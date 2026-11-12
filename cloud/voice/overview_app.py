"""Private Qwen speech for owner-created learning overviews."""

import base64
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
REFERENCE_DIR = "/opt/overview-voices"
VOICES = ("geffen", "host1", "host2")


def download_model():
    from huggingface_hub import snapshot_download
    snapshot_download(MODEL_ID, revision=MODEL_REVISION, local_dir=MODEL_DIR)


image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libsndfile1", "sox")
    .pip_install("torch==2.11.0", "torchaudio==2.11.0", index_url="https://download.pytorch.org/whl/cpu")
    .pip_install("qwen-tts==0.1.1", "transformers==4.57.3", "huggingface-hub==0.36.2", "soundfile==0.14.0", "fastapi==0.115.12")
    .run_function(download_model)
    .add_local_dir(Path(__file__).parent / ".private-overview-voices", REFERENCE_DIR, copy=True)
    .env({"HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1"})
)
app = modal.App("one-pac-overview-voices", image=image)


def speech_chunks(text):
    parts = re.split(r"(?<=[.!?])\s+|\n+", text.strip())
    chunks = []
    words = []
    for part in parts:
        for word in part.split():
            words.append(word)
            if len(words) == 28:
                chunks.append(" ".join(words))
                words = []
        if len(words) >= 12:
            chunks.append(" ".join(words))
            words = []
    if words:
        chunks.append(" ".join(words))
    return chunks


@app.cls(cpu=2, memory=8192, min_containers=0, max_containers=1, scaledown_window=30, timeout=600)
@modal.concurrent(max_inputs=1)
class OverviewVoices:
    @modal.enter()
    def load(self):
        import torch
        from qwen_tts import Qwen3TTSModel

        root = Path(REFERENCE_DIR)
        bundle = json.loads((root / "profile.json").read_text(encoding="utf-8"))
        if bundle["profile"] != "approved-resource-overview-v1" or set(bundle["voices"]) != set(VOICES):
            raise RuntimeError("Approved voice profile is required")
        for voice in VOICES:
            reference = root / (voice + ".wav")
            if hashlib.sha256(reference.read_bytes()).hexdigest() != bundle["voices"][voice]["sha256"]:
                raise RuntimeError("Approved voice reference checksum mismatch")
        torch.set_num_threads(2)
        self.model = Qwen3TTSModel.from_pretrained(
            MODEL_DIR, device_map="cpu", dtype=torch.float32, attn_implementation="sdpa", local_files_only=True,
        )
        self.prompts = {
            voice: self.model.create_voice_clone_prompt(
                ref_audio=str(root / (voice + ".wav")),
                ref_text=bundle["voices"][voice]["transcript"], x_vector_only_mode=False,
            )
            for voice in VOICES
        }

    def render(self, text, voice):
        import soundfile
        import torch
        from torch.nn.functional import cosine_similarity

        deadline = time.monotonic() + 535
        for sequence, part in enumerate(speech_chunks(text)):
            spelling = re.sub(r"\bantiracis(m|t)\b", r"ant-eye racis\1", part, flags=re.I)
            for attempt in range(3):
                if time.monotonic() >= deadline:
                    raise TimeoutError("Voice generation deadline exceeded")
                seed = int(hashlib.sha256(f"{voice}:{part}:{attempt}".encode()).hexdigest()[:8], 16)
                with torch.inference_mode():
                    torch.manual_seed(seed)
                    waves, rate = self.model.generate_voice_clone(
                        text=spelling, language="English", voice_clone_prompt=self.prompts[voice],
                        non_streaming_mode=True, do_sample=True, top_k=20 if attempt == 0 else 10,
                        top_p=0.83 if attempt == 0 else 0.76, temperature=0.68 if attempt == 0 else 0.55,
                        repetition_penalty=1.07, max_new_tokens=min(1000, len(part.split()) * 17 + 150),
                    )
                    if rate != 24000 or not 0.4 <= len(waves[0]) / rate <= 35:
                        continue
                    sample = self.model.create_voice_clone_prompt(ref_audio=(waves[0], rate), x_vector_only_mode=True)[0].ref_spk_embedding
                    scores = {
                        role: float(cosine_similarity(sample.float(), prompt[0].ref_spk_embedding.float(), dim=0))
                        for role, prompt in self.prompts.items()
                    }
                if scores[voice] >= 0.93 and scores[voice] - max(scores[role] for role in VOICES if role != voice) >= 0.01:
                    output = io.BytesIO()
                    soundfile.write(output, waves[0], rate, format="WAV", subtype="PCM_16")
                    yield {
                        "audio": base64.b64encode(output.getvalue()).decode("ascii"), "voice": voice,
                        "sequence": sequence, "text": part, "verified": True,
                    }
                    break
            else:
                raise RuntimeError("Rendered clip failed approved voice verification")

    @modal.asgi_app(requires_proxy_auth=True)
    def web(self):
        from fastapi import FastAPI, Request
        from fastapi.responses import JSONResponse, StreamingResponse
        from starlette.concurrency import run_in_threadpool

        service = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

        @service.get("/health")
        async def health():
            return {"ready": True, "voices": VOICES, "profile": "approved-resource-overview-v1"}

        @service.post("/speech")
        async def speech(request: Request):
            body = bytearray()
            async for chunk in request.stream():
                body.extend(chunk)
                if len(body) > 5000:
                    return JSONResponse({"error": "Overview segment too long"}, status_code=413)
            try:
                payload = json.loads(body)
                text = payload.get("text")
                voice = payload.get("voice")
            except (ValueError, AttributeError):
                text, voice = None, None
            if not isinstance(text, str) or not text.strip() or len(text) > 1300 or len(text.split()) > 100 or voice not in VOICES:
                return JSONResponse({"error": "Choose an approved voice and a short segment"}, status_code=400)

            async def packets():
                rendered = self.render(text, voice)
                try:
                    while not await request.is_disconnected():
                        value = await run_in_threadpool(lambda: next(rendered, None))
                        if value is None:
                            yield "data: " + json.dumps({"done": True, "voice": voice}) + "\n\n"
                            return
                        yield "data: " + json.dumps(value) + "\n\n"
                except Exception:
                    yield 'data: {"error":"The approved voice could not finish this segment."}\n\n'
                finally:
                    rendered.close()

            return StreamingResponse(packets(), media_type="text/event-stream", headers={"Cache-Control": "no-store"})

        return service
