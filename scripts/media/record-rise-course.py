"""Record a Rise course locally: each lesson's narration and each spoken scenario line.

Narration is read by Kelly (C3). Every scenario line is read by its own cast member, from the approved
eight references (config/character-voices.json, docs/media-scripts/CAST.md). Installed Qwen3-TTS and
Whisper models only; nothing is sent to any service. Each sentence is checked twice before it is kept:
Whisper must hear the written words, and the generated voice must match its own reference more closely
than any other. Verified sentences are cached, so an interrupted run resumes without repeating work.

    node scripts/media/rise-recording-jobs.mjs --course dhs-equity-analysis-toolkit --out output/rise-jobs.json
    python scripts/media/record-rise-course.py --references <folder> --jobs output/rise-jobs.json

Finished audio lands in public/learning-media/rise/<course>/<lesson>/ and is registered in
lib/content/courses/rise/recordings.json, which the course player reads.
"""
import argparse
import difflib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location('record_approved_local', Path(__file__).with_name('record-approved-local.py'))
_approved = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_approved)
sha, words, save = _approved.sha, _approved.words, _approved.save

RATE = 24000
NARRATOR = 'C3'
AGREEMENT = .94


CONTRACTIONS = [(r"\bcan['’]t\b", 'can not'), (r"\bwon['’]t\b", 'will not'), (r"n['’]t\b", ' not'),
                (r"['’]re\b", ' are'), (r"['’]ll\b", ' will'), (r"['’]ve\b", ' have'),
                (r"['’]m\b", ' am'), (r"['’]d\b", ' would'), (r"['’]s\b", ' is')]


def spoken(text):
    """The written words, with contractions opened out.

    Whisper writes what it hears in whichever form it prefers: "Here's" for "Here is", "doesn't" for
    "does not". The same rule is applied to the written sentence and to the transcription before they are
    compared, so the comparison is between the words themselves and neither form is favoured.
    """
    for pattern, replacement in CONTRACTIONS:
        text = re.sub(pattern, replacement, text, flags=re.I)
    return words(text)


def sentences(text):
    parts = []
    for paragraph in text.split('\n\n'):
        parts += [s.strip() for s in re.split(r'(?<=[.!?])\s+', paragraph.strip()) if s.strip()]
    return parts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--references', type=Path, required=True)
    parser.add_argument('--jobs', type=Path, default=ROOT/'output/rise-recording-jobs.json')
    parser.add_argument('--lesson', action='append', help='Record only this lesson id; repeatable.')
    parser.add_argument('--check', action='store_true', help='Verify references and list the work, then stop.')
    args = parser.parse_args()

    profile = json.loads((ROOT/'config/character-voices.json').read_text(encoding='utf8'))
    for character, voice in profile['characters'].items():
        if sha((args.references/voice['referenceFile']).read_bytes()) != voice['sha256']:
            raise RuntimeError('Reference identity mismatch: ' + character)

    jobs = json.loads(args.jobs.read_text(encoding='utf8'))['jobs']
    if args.lesson:
        jobs = [job for job in jobs if job['lesson'] in args.lesson]
    if not jobs:
        raise RuntimeError('No matching lessons')
    for job in jobs:
        for line in job['lines']:
            if f"C{line['cast']}" not in profile['characters']:
                raise RuntimeError('Unknown cast voice in ' + job['lesson'])
    total = sum(len(sentences(job['narration']['text'])) + sum(len(sentences(l['text'])) for l in job['lines']) for job in jobs)
    print(f'Checked all eight references; {len(jobs)} lessons, {total} sentences to verify.', flush=True)
    if args.check:
        for job in jobs:
            print(f"  {job['lesson']}: narration {len(sentences(job['narration']['text']))} sentences, {len(job['lines'])} spoken lines", flush=True)
        return
    if shutil.disk_usage(ROOT).free < 100 * 1024**2:
        raise RuntimeError('At least 100 MB free is required before recording.')

    import numpy as np
    import soundfile as sf
    import torch
    from scipy.signal import resample_poly
    from faster_whisper import WhisperModel
    home = Path.home()
    sys.path.insert(0, str(home/'.codex/geffen-ask/latency-lab/faster-qwen3-tts'))
    from faster_qwen3_tts import FasterQwen3TTS
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    hub = home/'.cache/huggingface/hub'
    model = FasterQwen3TTS.from_pretrained(
        str(next((hub/'models--Qwen--Qwen3-TTS-12Hz-0.6B-Base/snapshots').iterdir())),
        device='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa', max_seq_len=768)
    asr = WhisperModel(str(next((hub/'models--Systran--faster-whisper-small.en/snapshots').iterdir())),
                       device='cpu', compute_type='int8', cpu_threads=3)
    used = {NARRATOR} | {f"C{line['cast']}" for job in jobs for line in job['lines']}
    prompts = {}
    for character in sorted(used):
        prompts[character] = model.model.create_voice_clone_prompt(
            ref_audio=str(args.references/profile['characters'][character]['referenceFile']),
            ref_text='', x_vector_only_mode=True)
    cache = ROOT/'output/rise-recording'
    cache.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise RuntimeError('ffmpeg is required')
    second_asr = None

    def record(sentence, character):
        """One verified sentence in one approved voice. Returns its audio and its receipt."""
        nonlocal second_asr
        identity = profile['characters'][character]['sha256']
        key = sha(json.dumps([1, identity, sentence]).encode())
        audiofile, receiptfile = cache/(key+'.flac'), cache/(key+'.json')
        if audiofile.exists() and receiptfile.exists():
            receipt = json.loads(receiptfile.read_text(encoding='utf8'))
            if receipt['audioSha256'] == sha(audiofile.read_bytes()):
                return sf.read(audiofile, dtype='float32')[0], receipt
        for attempt in range(5):
            torch.manual_seed(4100 + attempt)
            with torch.inference_mode():
                pieces, timing = [], {}
                if attempt >= 2:
                    waves, sample_rate = model.model.generate_voice_clone(
                        text=sentence, language='English', voice_clone_prompt=prompts[character],
                        non_streaming_mode=True, do_sample=True, top_k=20, top_p=.8,
                        temperature=.7, repetition_penalty=1.05, max_new_tokens=500)
                    pieces = [waves[0]]
                else:
                    for piece, sample_rate, timing in model.generate_voice_clone_streaming(
                        text=sentence, language='English', voice_clone_prompt=prompts[character],
                        non_streaming_mode=True, chunk_size=16, first_chunk_size=4,
                        do_sample=True, top_k=20, top_p=.8, temperature=.7,
                        repetition_penalty=1.05, max_new_tokens=500):
                        if len(piece):
                            pieces.append(piece)
                if not pieces or timing.get('total_steps_so_far', 0) >= 500:
                    continue
                wave = np.concatenate(pieces)
                if sample_rate != RATE or not np.isfinite(wave).all():
                    raise RuntimeError('Invalid generated audio')
                candidate = model.model.create_voice_clone_prompt(ref_audio=(wave, RATE), ref_text='', x_vector_only_mode=True)
                scores = {c: float(torch.nn.functional.cosine_similarity(
                    candidate[0].ref_spk_embedding.reshape(1, -1).float(),
                    prompts[c][0].ref_spk_embedding.reshape(1, -1).float()).item()) for c in prompts}
            segments, _ = asr.transcribe(resample_poly(wave, 2, 3), language='en', beam_size=5)
            heard = ' '.join(s.text.strip() for s in segments)
            agreement = difflib.SequenceMatcher(None, spoken(sentence), spoken(heard), autojunk=False).ratio()
            transcription_model = 'small.en'
            if agreement < AGREEMENT:
                if second_asr is None:
                    second_asr = WhisperModel(str(next((hub/'models--Systran--faster-whisper-base.en/snapshots').iterdir())),
                                              device='cpu', compute_type='int8', cpu_threads=3)
                alternate, _ = second_asr.transcribe(resample_poly(wave, 2, 3), language='en', beam_size=5)
                alternate_heard = ' '.join(s.text.strip() for s in alternate)
                alternate_agreement = difflib.SequenceMatcher(None, spoken(sentence), spoken(alternate_heard), autojunk=False).ratio()
                if alternate_agreement > agreement:
                    heard, agreement, transcription_model = alternate_heard, alternate_agreement, 'base.en'
            best_other = max(value for c, value in scores.items() if c != character) if len(scores) > 1 else 0
            if agreement < AGREEMENT or scores[character] < .6 or scores[character] <= best_other:
                print(f'  retry {character}: speech={agreement:.3f}, voice={scores[character]:.3f}; heard: {heard}', flush=True)
                continue
            sf.write(audiofile, wave, RATE, format='FLAC', subtype='PCM_16')
            receipt = {'text': sentence, 'heard': heard, 'agreement': agreement, 'character': character,
                       'transcriptionModel': transcription_model, 'referenceSha256': identity,
                       'normalization': 'contractions opened out on both sides',
                       'speakerScores': scores, 'audioSha256': sha(audiofile.read_bytes()),
                       'seconds': len(wave)/RATE}
            save(receiptfile, receipt)
            return wave, receipt
        raise RuntimeError(f'Speech or voice verification failed: {character}: {sentence}')

    def passage(text, character, gap):
        """A whole narration or line: its sentences, verified one at a time, with a short pause between."""
        audio, receipts = [], []
        for index, sentence in enumerate(sentences(text)):
            if index:
                audio.append(np.zeros(round(gap*RATE), dtype=np.float32))
            wave, receipt = record(sentence, character)
            audio.append(wave)
            receipts.append(receipt)
        return np.concatenate(audio), receipts

    def write_mp3(path, audio):
        pcm = (np.clip(audio, -1, 1)*32767).astype('<i2').tobytes()
        result = subprocess.run([ffmpeg, '-v', 'error', '-f', 's16le', '-ar', str(RATE), '-ac', '1',
            '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1',
            '-f', 'mp3', 'pipe:1'], input=pcm, capture_output=True, check=True)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(result.stdout)
        return len(audio)/RATE

    registryfile = ROOT/'lib/content/courses/rise/recordings.json'
    registry = json.loads(registryfile.read_text(encoding='utf8')) if registryfile.exists() else {}
    for number, job in enumerate(jobs, 1):
        folder = ROOT/'public/learning-media/rise'/job['course']/job['lesson']
        web = f"/learning-media/rise/{job['course']}/{job['lesson']}"
        evidence = {'lesson': job['lesson'], 'profile': profile['id'], 'narration': [], 'lines': {}}
        entry = registry.get(job['lesson'], {})

        audio, receipts = passage(job['narration']['text'], NARRATOR, .35)
        seconds = write_mp3(folder/'narration.mp3', audio)
        entry['narration'] = {'src': f'{web}/narration.mp3', 'seconds': round(seconds)}
        evidence['narration'] = receipts
        print(f"{job['lesson']}: narration recorded, {seconds:.0f} seconds ({number}/{len(jobs)})", flush=True)

        lines = entry.get('lines', {})
        for line in job['lines']:
            character = f"C{line['cast']}"
            audio, receipts = passage(line['text'], character, .15)
            name = 'line-' + line['key'].replace('.', '-') + '.mp3'
            write_mp3(folder/name, audio)
            lines[line['key']] = f'{web}/{name}'
            evidence['lines'][line['key']] = receipts
            print(f"  line {line['key']} as {profile['characters'][character]['name']} ({line['role']})", flush=True)
        if lines:
            entry['lines'] = dict(sorted(lines.items()))
        registry[job['lesson']] = dict(sorted(entry.items()))
        save(registryfile, dict(sorted(registry.items())))
        save(cache/f"{job['lesson']}.verification.json", evidence)
        print(f"COMPLETE {job['lesson']}", flush=True)


if __name__ == '__main__':
    main()
