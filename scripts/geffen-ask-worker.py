"""Outbound-only ASK speech worker. The approved reference never leaves this computer."""
import argparse, hashlib, io, json, os, re, time, sys, queue, threading
from pathlib import Path
from urllib.request import Request, urlopen

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--profile', required=True)
    parser.add_argument('--model', required=True)
    parser.add_argument('--origin')
    parser.add_argument('--key-file')
    parser.add_argument('--key-env', help='Read the worker credential from this environment variable instead of a file')
    parser.add_argument('--sample')
    parser.add_argument('--targets-file')
    parser.add_argument('--engine-path')
    args = parser.parse_args()
    profile = json.loads(Path(args.profile).read_text(encoding='utf-8'))
    voice = profile['geffen']
    ref = Path(voice['referenceWav'])
    if not profile.get('locked') or hashlib.sha256(ref.read_bytes()).hexdigest() != voice['referenceWavSha256']:
        raise RuntimeError('Geffen reference does not match the approved voice profile')
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    import torch, soundfile as sf, numpy as np
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    torch.backends.cuda.matmul.allow_tf32 = True
    from qwen_tts import Qwen3TTSModel
    if not torch.cuda.is_available(): raise RuntimeError('The local Geffen worker requires the installed GPU runtime')
    if args.engine_path:
        sys.path.insert(0, str(Path(args.engine_path).resolve()))
        from faster_qwen3_tts import FasterQwen3TTS
        model = FasterQwen3TTS.from_pretrained(args.model, device='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa', max_seq_len=768)
        build_inputs = model._build_talker_inputs_local
        def bounded_inputs(*positional, **named):
            result = build_inputs(*positional, **named)
            if result[0].shape[1] + 384 >= model.max_seq_len:
                raise RuntimeError('Voice segment exceeds the model cache capacity')
            return result
        model._build_talker_inputs_local = bounded_inputs
        model.predictor_graph.top_k = 20
        model.predictor_graph.top_p = .8
        model.predictor_graph.temperature = .7
        prompt = model.model.create_voice_clone_prompt(ref_audio=str(ref), ref_text=voice['referenceTranscript'], x_vector_only_mode=False)
    else:
        model = Qwen3TTSModel.from_pretrained(args.model, device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa', local_files_only=True)
        prompt = model.create_voice_clone_prompt(ref_audio=str(ref), ref_text=voice['referenceTranscript'], x_vector_only_mode=False)
    print('Approved local Geffen profile loaded', flush=True)

    def render_chunks(text):
        # Short chunks preserve the complete answer while bounding each generation.
        text = re.sub(r'\[\d+\]', '', text).replace('**', '').replace('`', '')
        parts = re.split(r'(?<=[.!?])\s+|\n+', text.strip())
        chunks = []
        for part in parts:
            words = part.split()
            while words:
                take = 24 if args.engine_path else (7 if not chunks else 24)
                chunks.append(' '.join(words[:take])); words = words[take:]
        started = time.monotonic()
        for chunk in chunks:
            if len(chunk) > 600: raise RuntimeError('Voice segment text exceeds capacity')
            if time.monotonic() - started > 550: raise RuntimeError('Voice deadline exceeded')
            chunk_started = time.monotonic()
            if args.engine_path:
                # The first small packet starts playback; subsequent packets combine
                # larger audio packets without interrupting synthesis.
                pending_audio = []; emitted = False; steps = 0
                for wave, rate, timing in model.generate_voice_clone_streaming(text=chunk, language='English', voice_clone_prompt=prompt,
                        non_streaming_mode=True, chunk_size=16, first_chunk_size=4, do_sample=True, top_k=20, top_p=.8, temperature=.7,
                        repetition_penalty=1.05, max_new_tokens=384):
                    if time.monotonic() - started > 550: raise RuntimeError('Voice deadline exceeded')
                    steps = timing.get('total_steps_so_far', 0)
                    if not len(wave): continue
                    pending_audio.append(wave)
                    if pending_audio:
                        output = io.BytesIO(); sf.write(output, np.concatenate(pending_audio), rate, format='WAV', subtype='PCM_16')
                        pending_audio = []; emitted = True
                        yield output.getvalue()
                if not emitted: raise RuntimeError('Voice segment returned no playable audio')
                if steps >= 384: raise RuntimeError('Voice segment reached its generation limit')
                if pending_audio:
                    output = io.BytesIO(); sf.write(output, np.concatenate(pending_audio), rate, format='WAV', subtype='PCM_16')
                    yield output.getvalue()
            else:
                with torch.inference_mode():
                    waves, rate = model.generate_voice_clone(text=chunk, language='English', voice_clone_prompt=prompt,
                        non_streaming_mode=True, do_sample=True, top_k=20, top_p=.8, temperature=.7,
                        repetition_penalty=1.05, max_new_tokens=min(1100, len(chunk.split())*14+180))
                output = io.BytesIO(); sf.write(output, waves[0], rate, format='WAV', subtype='PCM_16')
                yield output.getvalue()
            print(json.dumps({'event': 'speech_segment', 'words': len(chunk.split()), 'generation_seconds': round(time.monotonic()-chunk_started, 3)}), flush=True)

    if args.sample:
        list(render_chunks('Welcome to Ask.')) # Warm kernels before measuring interactive latency.
        started = time.monotonic()
        audio = []; first = None
        for data in render_chunks('Welcome to Ask. What would you like to explore today?'):
            if first is None: first = round(time.monotonic()-started, 2)
            wave, rate = sf.read(io.BytesIO(data)); audio.append(wave)
        sf.write(args.sample, np.concatenate(audio), rate, subtype='PCM_16')
        print(json.dumps({'sample': args.sample, 'elapsed_seconds': round(time.monotonic()-started, 2), 'reference_verified': True, 'first_audio_seconds': first}), flush=True)
        return
    targets = json.loads(Path(args.targets_file).read_text(encoding='utf-8-sig')) if args.targets_file else [{'origin': args.origin, 'key_file': args.key_file, 'key_env': args.key_env}]
    import requests
    endpoints = []
    for target in targets:
        origin = target.get('origin') or ''
        if not (origin.startswith('https://') or origin.startswith('http://127.0.0.1:')): raise RuntimeError('HTTPS origin required')
        credential = os.environ.get(target['key_env'], '').strip() if target.get('key_env') else Path(target['key_file']).read_text().strip() if target.get('key_file') else ''
        if not credential: raise RuntimeError('Worker credential required')
        endpoints.append((origin.rstrip('/') + '/api/ask/voice/worker', credential, requests.Session()))
    if not endpoints: raise RuntimeError('At least one application is required')
    endpoint, key, session = endpoints[0]
    cursor = 0
    def network_request(session, key, url, data=None, failed=False, sequence=0, done=False, timeout=25):
        headers = {'Authorization': 'Bearer '+key}
        if data is not None: headers['Content-Type'] = 'audio/wav'
        if failed: headers['X-Voice-Failed'] = '1'
        if done: headers['X-Voice-Done'] = '1'
        headers['X-Voice-Sequence'] = str(sequence)
        response = session.request('POST' if data is not None else 'GET', url, data=data, headers=headers, timeout=timeout, allow_redirects=False)
        if 300 <= response.status_code < 400: raise RuntimeError('Voice redirects are not allowed')
        response.raise_for_status()
        return response.json()
    def request(url, data=None, failed=False, sequence=0, done=False, timeout=25):
        return network_request(session, key, url, data, failed, sequence, done, timeout)
    list(render_chunks('Welcome to Ask.')) # Keep model, reference prompt and kernels warm.
    pending_jobs = queue.Queue(maxsize=len(endpoints))
    def listen(target):
        target_url, target_key, target_session = target
        while True:
            try:
                poll_started = time.monotonic()
                value = network_request(target_session, target_key, target_url+'?wait=15000', timeout=25)
                job = value.get('job')
                if not job:
                    # Older releases return immediately; avoid rapid fallback polling.
                    time.sleep(max(0, 1 - (time.monotonic()-poll_started)))
                    continue
                completed = threading.Event()
                pending_jobs.put((target, job, completed))
                completed.wait() # One outstanding request per application, one GPU owner.
            except Exception:
                time.sleep(2)
    for target in endpoints:
        threading.Thread(target=listen, args=(target,), daemon=True).start()
    print('Geffen worker ready', flush=True)
    while True:
        completed = None
        try:
            target, job, completed = pending_jobs.get()
            endpoint, key, session = target
            job_deadline = time.monotonic() + 550
            packets = queue.Queue(maxsize=4); cancelled = threading.Event(); upload_error = []
            sequence = [0]
            def upload():
                try:
                    while not cancelled.is_set():
                        data = packets.get()
                        if cancelled.is_set(): return
                        if data is None:
                            request(endpoint+'?id='+job['id'], b'', sequence=sequence[0], done=True)
                            return
                        # The server checks owner pause and active job on every upload.
                        if not request(endpoint+'?id='+job['id'], data, sequence=sequence[0]).get('accepted'):
                            cancelled.set(); return
                        sequence[0] += 1
                except Exception as failure:
                    upload_error.append(type(failure).__name__); cancelled.set()
            sender = threading.Thread(target=upload, daemon=True); sender.start()
            def put_packet(data):
                while not cancelled.is_set():
                    if time.monotonic() > job_deadline: raise RuntimeError('Voice upload deadline exceeded')
                    try: packets.put(data, timeout=.1); return True
                    except queue.Full: pass
                return False
            try:
                for data in render_chunks(job['text']):
                    if not put_packet(data): break
                if not cancelled.is_set(): put_packet(None)
                sender.join(timeout=30)
                if sender.is_alive(): raise RuntimeError('Voice upload deadline exceeded')
                if upload_error: raise RuntimeError('Voice upload failed')
                print('Completed or cancelled voice job', flush=True)
            except Exception:
                cancelled.set()
                # Wake an uploader waiting for a packet, then wait before reusing its session.
                try: packets.put_nowait(None)
                except queue.Full: pass
                sender.join(timeout=30)
                if sender.is_alive(): raise SystemExit('Voice uploader did not stop; restarting worker')
                try: request(endpoint+'?id='+job['id'], b'', failed=True, sequence=sequence[0])
                except Exception: pass
                print('Voice job failed; text answer remains available', flush=True)

        except Exception:
            print('Waiting for application connection', flush=True); time.sleep(2)
        finally:
            if completed is not None: completed.set()

if __name__ == '__main__': main()
