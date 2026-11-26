"""Record approved course podcasts locally; verify references, speech and speaker identity.

Uses installed Qwen and Whisper models only. Private references are never published.
Compressed sentence caches permit resuming without retaining large WAV files.
"""
import argparse
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def words(text):
    text = text.replace('%', ' percent ')
    text = re.sub(r'\bcase\s+loads?\b', lambda m: m[0].replace(' ', ''), text, flags=re.I)
    text = re.sub(r'\bany\s+time\b', 'anytime', text, flags=re.I)
    text = re.sub(r'\bco[- ]worker', 'coworker', text, flags=re.I)
    # These two transcriptions are acoustically identical in this exact short line.
    # Preserve the intended spelling in the source/transcript and retain raw ASR in evidence.
    if text.lower().strip().rstrip('.!?') in ('know where support lives', 'nowhere support lives'):
        return ['know', 'where', 'support', 'lives']
    text = re.sub(r'(?<=\d),(?=\d)', '', text)
    tokens = re.findall(r'[a-z0-9]+', text.lower().replace('â€™', "'").replace("'", ''))
    units = dict(zip('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(), range(20)))
    units.update(dict(zip('twenty thirty forty fifty sixty seventy eighty ninety'.split(), range(20,100,10))))
    result = []
    i = 0
    while i < len(tokens):
        if tokens[i] not in units:
            result.append(tokens[i]); i += 1; continue
        total = value = 0
        while i < len(tokens):
            token = tokens[i]
            if token in units:
                value += units[token]
            elif token == 'hundred':
                value = max(value, 1)*100
            elif token in ('thousand', 'million'):
                total += max(value, 1)*(1000 if token == 'thousand' else 1000000); value = 0
            else:
                break
            i += 1
        result.append(str(total+value))
    return result


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    temporary.replace(path)


def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d}.{ms%1000:03d}'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--references', type=Path, required=True)
    parser.add_argument('--course')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    profile = json.loads((root/'config/character-voices.json').read_text())
    for character, voice in profile['characters'].items():
        if sha((args.references/voice['referenceFile']).read_bytes()) != voice['sha256']:
            raise RuntimeError('Reference identity mismatch: ' + character)
    scripts = sorted(p for folder in ['culture-wellbeing', 'cultural-navigation']
                     for p in (root/'docs/media-scripts'/folder).glob('*.podcast.json'))
    if args.course:
        scripts = [p for p in scripts if p.name == args.course + '.podcast.json']
    if not scripts:
        raise RuntimeError('No matching scripts')
    for file in scripts:
        script = json.loads(file.read_text(encoding='utf8'))
        if script.get('voiceProfile') != profile['id']:
            raise RuntimeError('Script has not adopted approved voices: ' + file.name)
        for turn in script['turns']:
            if turn['speaker'] not in profile['podcastSpeakers']:
                raise RuntimeError('Unknown podcast voice')
    print(f'Checked all eight references; {len(scripts)} scripts use Kelly and John.', flush=True)
    if args.check:
        return
    if shutil.disk_usage(root).free < 100 * 1024**2:
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
    prompts = {}
    for char in ['C3', 'C4']:
        prompts[char] = model.model.create_voice_clone_prompt(
            ref_audio=str(args.references/profile['characters'][char]['referenceFile']),
            ref_text='', x_vector_only_mode=True)
    cache = root/'output/approved-local-recording'
    cache.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise RuntimeError('ffmpeg is required')
    labels = {'host1': 'Kelly', 'geffen': 'John'}
    rate = 24000
    second_asr = None

    def record(sentence, char):
        nonlocal second_asr
        identity = profile['characters'][char]['sha256']
        key = sha(json.dumps([3, identity, sentence]).encode())
        audiofile = cache/(key+'.flac')
        receiptfile = cache/(key+'.json')
        if audiofile.exists() and receiptfile.exists():
            receipt = json.loads(receiptfile.read_text(encoding='utf8'))
            if receipt['audioSha256'] == sha(audiofile.read_bytes()):
                return sf.read(audiofile, dtype='float32')[0], receipt
        for attempt in range(5):
            torch.manual_seed(4100 + attempt)
            generation_text = sentence
            with torch.inference_mode():
                pieces = []
                timing = {}
                if attempt >= 2:
                    waves, sample_rate = model.model.generate_voice_clone(
                        text=generation_text, language='English', voice_clone_prompt=prompts[char],
                        non_streaming_mode=True, do_sample=True, top_k=20, top_p=.8,
                        temperature=.7, repetition_penalty=1.05, max_new_tokens=500)
                    pieces = [waves[0]]
                else:
                    for piece, sample_rate, timing in model.generate_voice_clone_streaming(
                        text=generation_text, language='English', voice_clone_prompt=prompts[char],
                        non_streaming_mode=True, chunk_size=16, first_chunk_size=4,
                        do_sample=True, top_k=20, top_p=.8, temperature=.7,
                        repetition_penalty=1.05, max_new_tokens=500):
                        if len(piece):
                            pieces.append(piece)
                if not pieces or timing.get('total_steps_so_far', 0) >= 500:
                    continue
                wave = np.concatenate(pieces)
                if sample_rate != rate or not np.isfinite(wave).all():
                    raise RuntimeError('Invalid generated audio')
                candidate = model.model.create_voice_clone_prompt(
                    ref_audio=(wave, rate), ref_text='', x_vector_only_mode=True)
                scores = {c: float(torch.nn.functional.cosine_similarity(
                    candidate[0].ref_spk_embedding.reshape(1, -1).float(),
                    prompts[c][0].ref_spk_embedding.reshape(1, -1).float()).item()) for c in prompts}
            segments, _ = asr.transcribe(resample_poly(wave, 2, 3), language='en', beam_size=5, word_timestamps=True)
            segments = list(segments)
            heard = ' '.join(s.text.strip() for s in segments)
            agreement = difflib.SequenceMatcher(None, words(sentence), words(heard), autojunk=False).ratio()
            transcription_model = 'small.en'
            pickup_timings = None
            correction = None
            if agreement < .94:
                if second_asr is None:
                    second_asr = WhisperModel(str(next((hub/'models--Systran--faster-whisper-base.en/snapshots').iterdir())),
                                              device='cpu', compute_type='int8', cpu_threads=3)
                alternate, _ = second_asr.transcribe(resample_poly(wave, 2, 3), language='en', beam_size=5, word_timestamps=True)
                alternate = list(alternate)
                alternate_heard = ' '.join(s.text.strip() for s in alternate)
                alternate_agreement = difflib.SequenceMatcher(None, words(sentence), words(alternate_heard), autojunk=False).ratio()
                if alternate_agreement > agreement:
                    segments, heard, agreement = alternate, alternate_heard, alternate_agreement
                    transcription_model = 'base.en'
            wanted_tokens, heard_tokens = words(sentence), words(heard)
            if (attempt == 4 and len(wanted_tokens) >= 8 and
                wanted_tokens[:-1] == heard_tokens[:-1] and wanted_tokens[-1] != heard_tokens[-1]):
                # Correct an isolated final-word substitution with a separately verified pickup.
                # The source words are unchanged; both retained audio pieces are transcribed.
                pickup, pickup_receipt = record(sentence.split()[-1], char)
                boundary = segments[-1].words[-1].start
                prefix = wave[:round(boundary*rate)]
                prefix_segments, _ = asr.transcribe(resample_poly(prefix, 2, 3), language='en', beam_size=5, word_timestamps=True)
                prefix_segments = list(prefix_segments)
                prefix_heard = ' '.join(s.text.strip() for s in prefix_segments)
                joined_heard = prefix_heard + ' ' + pickup_receipt['heard']
                joined_agreement = difflib.SequenceMatcher(None, wanted_tokens, words(joined_heard), autojunk=False).ratio()
                if joined_agreement >= .94:
                    wave = np.concatenate([prefix, pickup])
                    heard, agreement = joined_heard, joined_agreement
                    pickup_timings = [{'text':w.word.strip(),'start':w.start,'end':min(w.end,boundary)}
                                      for s in prefix_segments for w in (s.words or [])]
                    pickup_timings += [{**w,'start':boundary+w['start'],'end':boundary+w['end']} for w in pickup_receipt['words']]
                    other = 'C4' if char == 'C3' else 'C3'
                    scores[char] = min(scores[char], pickup_receipt['speakerScores'][char])
                    scores[other] = max(scores[other], pickup_receipt['speakerScores'][other])
                    correction = {'method':'separately verified final-word pickup','text':sentence.split()[-1]}
                    transcription_model = 'small.en + verified pickup'
            if agreement < .94 or scores[char] < .6 or scores[char] <= scores['C4' if char == 'C3' else 'C3']:
                print(f'Retry {char}: speech={agreement:.3f}, voice={scores[char]:.3f}; heard: {heard}', flush=True)
                continue
            timings = pickup_timings if pickup_timings is not None else [
                {'text': w.word.strip(), 'start': w.start, 'end': w.end}
                for s in segments for w in (s.words or [])]
            sf.write(audiofile, wave, rate, format='FLAC', subtype='PCM_16')
            receipt = {'text': sentence, 'heard': heard, 'agreement': agreement, 'character': char,
                       'transcriptionModel': transcription_model,
                       'correction': correction,
                       'phoneticNormalization': 'know where / nowhere' if sentence == 'Know where support lives.' else None,
                       'referenceSha256': identity, 'speakerScores': scores, 'words': timings,
                       'audioSha256': sha(audiofile.read_bytes()), 'seconds': len(wave)/rate}
            save(receiptfile, receipt)
            return wave, receipt
        raise RuntimeError(f'Speech or voice verification failed: {char}: {sentence}')

    for file in scripts:
        script = json.loads(file.read_text(encoding='utf8'))
        folder = root/'public/learning/course-podcasts'/script['id']
        folder.mkdir(parents=True, exist_ok=True)
        audio = [np.zeros(round(.25*rate), dtype=np.float32)]
        elapsed = .25
        turns, cues, evidence = [], [], []
        for i, turn in enumerate(script['turns']):
            if i:
                audio.append(np.zeros(round(.45*rate), dtype=np.float32)); elapsed += .45
            start = elapsed
            char = profile['podcastSpeakers'][turn['speaker']]
            sentences = re.split(r'(?<=[.!?])\s+', turn['text'].strip())
            for j, sentence in enumerate(sentences):
                if j:
                    audio.append(np.zeros(round(.15*rate), dtype=np.float32)); elapsed += .15
                wave, receipt = record(sentence, char)
                # Use source words, with sentence boundaries grounded in the audited audio.
                source_words = sentence.split()
                heard_words = receipt['words']
                first = heard_words[0]['start'] if heard_words else 0
                last = heard_words[-1]['end'] if heard_words else len(wave)/rate
                for offset in range(0, len(source_words), 8):
                    end = min(offset+8, len(source_words))
                    cues.append((elapsed+first+(last-first)*offset/len(source_words),
                                 elapsed+first+(last-first)*end/len(source_words),
                                 ' '.join(source_words[offset:end])))
                audio.append(wave); elapsed += len(wave)/rate
                evidence.append(receipt)
            turns.append({**turn, 'speakerLabel': labels[turn['speaker']],
                          'start': round(start, 3), 'end': round(elapsed, 3)})
            print(f'{script["id"]}: verified turn {i+1}/{len(script["turns"])}', flush=True)
        audio.append(np.zeros(round(.6*rate), dtype=np.float32)); elapsed += .6
        pcm = (np.clip(np.concatenate(audio), -1, 1)*32767).astype('<i2').tobytes()
        result = subprocess.run([ffmpeg, '-v', 'error', '-f', 's16le', '-ar', str(rate), '-ac', '1',
            '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1',
            '-f', 'mp3', 'pipe:1'], input=pcm, capture_output=True, check=True)
        (folder/'episode.mp3').write_bytes(result.stdout)
        version = sha(result.stdout)[:12]
        web = '/learning/course-podcasts/'+script['id']
        transcript = script['title']+'\n\n'+'\n\n'.join(t['speakerLabel']+': '+t['text'] for t in turns)+'\n'
        (folder/'transcript.txt').write_text(transcript, encoding='utf8')
        save(folder/'transcript.json', {'title': script['title'], 'speakerLabels': labels, 'turns': turns})
        (folder/'captions.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(
            f'{i+1}\n{stamp(a)} --> {stamp(b)}\n{text}' for i, (a,b,text) in enumerate(cues))+'\n', encoding='utf8')
        save(folder/'episode.json', {**script, 'turns': turns, 'speakerLabels': labels, 'speakers': labels,
            'status': 'ready', 'durationSeconds': round(elapsed, 3), 'scriptSha256': sha(file.read_bytes()),
            'audioSrc': f'{web}/episode.mp3?v={version}', 'transcriptSrc': f'{web}/transcript.txt?v={version}',
            'transcriptJsonSrc': f'{web}/transcript.json?v={version}', 'captionsSrc': f'{web}/captions.vtt?v={version}'})
        save(folder/'voice-verification.json', {'profile': profile['id'], 'sentences': evidence,
            'audioSha256': sha(result.stdout), 'captionTiming': 'Audited sentence boundaries; words distributed within each sentence.'})
        registryfile = root/'lib/content/courses/completed-podcasts.json'
        registry = json.loads(registryfile.read_text(encoding='utf8'))
        registry[script['id']] = {'src': f'{web}/episode.mp3?v={version}', 'transcript': transcript, 'seconds': round(elapsed,3)}
        save(registryfile, registry)
        print(f'COMPLETE {script["id"]}: {elapsed:.1f} seconds', flush=True)


if __name__ == '__main__':
    main()
