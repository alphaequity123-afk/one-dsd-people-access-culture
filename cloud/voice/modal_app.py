"""Private, on-demand approved Host 1 voice. Deploy only after hosting approval."""
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
REFERENCE_DIR = "/opt/approved-voice"


def download_model():
    from huggingface_hub import snapshot_download
    snapshot_download(MODEL_ID, revision=MODEL_REVISION, local_dir=MODEL_DIR)


image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libsndfile1", "sox")
    .pip_install("torch==2.11.0", "torchaudio==2.11.0", index_url="https://download.pytorch.org/whl/cu128")
    .pip_install("qwen-tts==0.1.1", "transformers==4.57.3", "huggingface-hub==0.36.2", "soundfile==0.14.0", "fastapi==0.115.12")
    .run_function(download_model)
    .add_local_dir(Path(__file__).parent / ".private-voice", REFERENCE_DIR, copy=True)
    .add_local_file(Path(__file__).parent / "voice_http.py", "/root/voice_http.py", copy=True)
    .env({"HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1"})
)
app = modal.App("one-dsd-approved-voice", image=image)


# GPU fallback list per Modal support (Nov 13, 2026): cheapest first; a wider list waits less on capacity.
# scaledown_window=300 was approved by the owner on Nov 15, 2026; idle time is billed.
@app.cls(gpu=["L4", "A10", "T4", "L40S"], cpu=2, memory=8192, min_containers=0, max_containers=1, scaledown_window=300, timeout=600)
@modal.concurrent(max_inputs=1)
class ApprovedVoice:
    @modal.enter()
    def load(self):
        import torch
        from qwen_tts import Qwen3TTSModel
        from qwen_tts.inference.qwen3_tts_model import VoiceClonePromptItem
        profile = json.loads((Path(REFERENCE_DIR) / "profile.json").read_text())
        if profile.get("locked") is not True or profile.get("voice") != "host1":
            raise RuntimeError("Approved Host 1 profile required")
        for kind in ("identity", "style"):
            source = Path(REFERENCE_DIR) / (kind + ".wav")
            if profile[kind]["file"] != source.name or hashlib.sha256(source.read_bytes()).hexdigest() != profile[kind]["sha256"]:
                raise RuntimeError("Approved voice reference checksum mismatch")
        torch.set_num_threads(2)
        dtype = torch.bfloat16 if torch.cuda.is_bf16_supported(including_emulation=False) else torch.float16
        self.model = Qwen3TTSModel.from_pretrained(MODEL_DIR, device_map="cuda:0", dtype=dtype, attn_implementation="sdpa", local_files_only=True)
        prompts = {
            kind: self.model.create_voice_clone_prompt(ref_audio=str(Path(REFERENCE_DIR) / (kind + ".wav")), ref_text=profile[kind]["transcript"], x_vector_only_mode=False)[0]
            for kind in ("identity", "style")
        }
        self.prompt = [VoiceClonePromptItem(ref_code=prompts["style"].ref_code, ref_spk_embedding=prompts["identity"].ref_spk_embedding, x_vector_only_mode=False, icl_mode=True, ref_text=profile["style"]["transcript"])]

    def render(self, text):
        import soundfile as sf
        import torch
        began = time.monotonic()
        parts = re.split(r"(?<=[.!?])\s+|\n+", re.sub(r"\[\d+\]", "", text).replace("**", "").replace("`", "").strip())
        first = True
        for part in parts:
            words = part.split()
            while words:
                if time.monotonic() - began > 550:
                    raise TimeoutError("Voice generation deadline exceeded")
                count = 7 if first else 24
                chunk = " ".join(words[:count]); words = words[count:]; first = False
                with torch.inference_mode():
                    waves, rate = self.model.generate_voice_clone(text=chunk, language="English", voice_clone_prompt=self.prompt, non_streaming_mode=True, do_sample=True, top_k=20, top_p=.8, temperature=.7, repetition_penalty=1.05, max_new_tokens=min(1100, len(chunk.split()) * 14 + 180))
                output = io.BytesIO()
                sf.write(output, waves[0], rate, format="WAV", subtype="PCM_16")
                yield output.getvalue()

    @modal.asgi_app(requires_proxy_auth=True)
    def web(self):
        from voice_http import create_app
        return create_app(self.render)
