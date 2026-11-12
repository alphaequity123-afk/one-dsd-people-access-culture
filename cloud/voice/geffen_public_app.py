"""Private, scale-to-zero Qwen read-aloud for the locked GEFen profile."""

from contextlib import closing
import hashlib
import io
import json
import re
import time
from pathlib import Path

import modal


MODEL_ID = "Qwen/Qwen3-TTS-12Hz-0.6B-Base"
MODEL_REVISION = "5d83992436eae1d760afd27aff78a71d676296fc"
MODEL_DIR = "/opt/voice-model"
GRAPH_SOURCE = "faster-qwen3-tts @ git+https://github.com/andimarafioti/faster-qwen3-tts.git@a70afc0f81f7f5f8801c3227968f1102f43f211c"
REFERENCE_DIR = "/opt/approved-voice"
PROFILE = "approved-geffen-read-aloud-v1"
CPU_CORES = 2
BUNDLE = Path(__file__).parent / ".private-geffen-public"


def download_model():
    from huggingface_hub import snapshot_download

    snapshot_download(MODEL_ID, revision=MODEL_REVISION, local_dir=MODEL_DIR)


def speech_chunks(text):
    text = re.sub(r"\[\d+\]", "", text).replace("**", "").replace("`", "").strip()
    sentences = iter(re.split(r"(?<=[.!?])\s+|\n+", text))
    pending = next(sentences, "").split()
    if not pending:
        return
    if len(pending) <= 8:
        count = len(pending)
    else:
        count = next((index for index in range(7, 3, -1) if pending[index - 1].endswith((",", ";", ":"))), 6)
    yield " ".join(pending[:count])
    pending = pending[count:]
    for sentence in sentences:
        pending.extend(sentence.split())
        while len(pending) > 24:
            yield " ".join(pending[:24])
            pending = pending[24:]
        if len(pending) >= 10:
            yield " ".join(pending)
            pending = []
    while pending:
        yield " ".join(pending[:24])
        pending = pending[24:]


image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libsndfile1", "sox", "git")
    .pip_install("torch==2.11.0", "torchaudio==2.11.0", index_url="https://download.pytorch.org/whl/cu128")
    .pip_install("qwen-tts==0.1.1", "transformers==4.57.3", "huggingface-hub==0.36.2", "soundfile==0.14.0", "fastapi==0.115.12")
    .pip_install(GRAPH_SOURCE, extra_options="--no-deps")
    .run_function(download_model)
    .add_local_file(BUNDLE / "identity.wav", REFERENCE_DIR + "/identity.wav", copy=True)
    .add_local_file(BUNDLE / "profile.json", REFERENCE_DIR + "/profile.json", copy=True)
    .add_local_file(Path(__file__).parent / "voice_http.py", "/root/voice_http.py", copy=True)
    .env({"HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1"})
)
app = modal.App("one-dsd-approved-voice", image=image)


@app.cls(gpu="A10", cpu=CPU_CORES, memory=8192, min_containers=0, max_containers=1,
         scaledown_window=60, timeout=600, enable_memory_snapshot=True,
         experimental_options={"enable_gpu_snapshot": True})
@modal.concurrent(max_inputs=1)
class ApprovedVoice:
    @modal.enter(snap=True)
    def load(self):
        started = time.monotonic()
        import torch
        from faster_qwen3_tts import FasterQwen3TTS

        reference_root = Path(REFERENCE_DIR)
        profile = json.loads((reference_root / "profile.json").read_text(encoding="utf-8"))
        if profile.get("locked") is not True or profile.get("voice") != "geffen" or profile.get("profileId") != PROFILE:
            raise RuntimeError("Approved GEFen read-aloud profile required")
        reference = reference_root / "identity.wav"
        expected = profile["identity"]
        if (expected["file"] != reference.name or hashlib.sha256(reference.read_bytes()).hexdigest() != expected["sha256"]
                or profile["style"]["sha256"] != expected["sha256"] or profile["style"]["transcript"] != expected["transcript"]):
            raise RuntimeError("Approved GEFen reference checksum mismatch")

        torch.set_num_threads(CPU_CORES)
        torch.set_num_interop_threads(1)
        imports_and_validation = time.monotonic()
        dtype = torch.bfloat16 if torch.cuda.is_bf16_supported(including_emulation=False) else torch.float16
        self.model = FasterQwen3TTS.from_pretrained(
            MODEL_DIR, device="cuda:0", dtype=dtype, attn_implementation="sdpa", max_seq_len=2048, local_files_only=True,
        )
        model_loaded = time.monotonic()
        self.prompt = self.model.model.create_voice_clone_prompt(
            ref_audio=str(reference), ref_text=expected["transcript"], x_vector_only_mode=False,
        )
        prompt_loaded = time.monotonic()
        self.model.warmup(prefill_len=100)
        graph_ready = time.monotonic()
        startup = {"device": torch.cuda.get_device_name(), "importsAndValidation": round(imports_and_validation-started, 3),
                   "model": round(model_loaded-imports_and_validation, 3), "prompt": round(prompt_loaded-model_loaded, 3),
                   "graphWarmup": round(time.monotonic()-prompt_loaded, 3)}
        with closing(self.render("This short introduction is ready.")) as warmup:
            next(warmup)
        startup["fixedClipWarmup"] = round(time.monotonic() - graph_ready, 3)
        print(json.dumps({"event": "geffen_startup", **startup}), flush=True)

    def render(self, text):
        import soundfile
        import torch
        from torch.nn.functional import cosine_similarity

        deadline = time.monotonic() + 530
        for index, chunk in enumerate(speech_chunks(text)):
            for attempt in range(2):
                if time.monotonic() >= deadline:
                    raise TimeoutError("Voice generation deadline exceeded")
                seed = int(hashlib.sha256(f"geffen:{chunk}:{attempt}".encode()).hexdigest()[:8], 16)
                started = time.monotonic()
                with torch.inference_mode():
                    torch.manual_seed(seed)
                    waves, rate = self.model.generate_voice_clone(
                        text=chunk, language="English", voice_clone_prompt=self.prompt,
                        non_streaming_mode=True, do_sample=True, top_k=20, top_p=.8,
                        temperature=.7, repetition_penalty=1.05, max_new_tokens=min(1100, len(chunk.split()) * 14 + 180),
                    )
                    if rate != 24000 or not 0.4 <= len(waves[0]) / rate <= 35:
                        continue
                    generated = time.monotonic()
                    sample = self.model.model.model.extract_speaker_embedding(waves[0], rate)
                    score = cosine_similarity(sample.float(), self.prompt[0].ref_spk_embedding.float(), dim=0)
                if score >= 0.93:
                    verified = time.monotonic()
                    output = io.BytesIO()
                    soundfile.write(output, waves[0], rate, format="WAV", subtype="PCM_16")
                    print(json.dumps({"event": "geffen_packet", "index": index, "attempt": attempt+1,
                                      "inference": round(generated-started, 3), "verification": round(verified-generated, 3),
                                      "encoding": round(time.monotonic()-verified, 3)}), flush=True)
                    yield output.getvalue()
                    break
            else:
                raise RuntimeError("Rendered clip failed approved GEFen verification")

    @modal.asgi_app(requires_proxy_auth=True)
    def web(self):
        from voice_http import create_app

        return create_app(self.render, voice="geffen", profile=PROFILE, verified_packets=True)
