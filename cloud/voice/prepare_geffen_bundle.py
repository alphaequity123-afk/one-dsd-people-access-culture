"""Stage only the approved GEFen reference for the public read-aloud worker."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil


PROFILE = "approved-geffen-read-aloud-v1"


def prepare(profile_path, output):
    profile_path, output = Path(profile_path), Path(output)
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    if profile.get("locked") is not True:
        raise ValueError("A locked approved profile is required")
    voice = profile["geffen"]
    source = (profile_path.parent / voice["referenceWav"]).resolve()
    expected = voice["referenceWavSha256"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != expected:
        raise ValueError("GEFen reference checksum mismatch")
    identity = {"file": "identity.wav", "sha256": expected, "transcript": voice["referenceTranscript"]}
    manifest = {"locked": True, "voice": "geffen", "profileId": PROFILE, "identity": identity, "style": identity}
    output.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, output / "identity.wav")
    (output / "profile.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("profile", type=Path, help="Approved voice profile lock")
    args = parser.parse_args()
    prepare(args.profile, Path(__file__).resolve().parent / ".private-geffen-public")
    print("Staged the verified GEFen read-aloud reference.")
