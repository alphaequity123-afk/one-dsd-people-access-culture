"""Stage only the approved opening speaker's references; do not upload anything."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path


def prepare(profile_path, output):
    profile_path, output = Path(profile_path), Path(output)
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    if profile.get("locked") is not True:
        raise ValueError("Only a locked approved profile can be staged")
    voice = profile["voices"]["host1"]
    staged = {"locked": True, "voice": "host1", "profileId": profile["profileId"]}
    sources = []
    for kind in ("identity", "style"):
        expected = profile["assets"]["host1" + kind.title()]
        relative = Path(voice[kind]["asset"])
        source = (profile_path.parent / relative).resolve()
        if relative.is_absolute() or not source.is_relative_to(profile_path.parent.resolve()) or str(relative).replace("\\", "/") != expected["path"]:
            raise ValueError("Reference path does not match the approved profile")
        if hashlib.sha256(source.read_bytes()).hexdigest() != expected["sha256"]:
            raise ValueError("Reference checksum mismatch")
        staged[kind] = {"file": kind + ".wav", "sha256": expected["sha256"], "transcript": voice[kind]["transcript"]}
        sources.append((source, kind + ".wav"))
    output.mkdir(parents=True, exist_ok=True)
    for source, name in sources:
        shutil.copyfile(source, output / name)
    (output / "profile.json").write_text(json.dumps(staged, indent=2), encoding="utf-8")
    return staged


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", required=True)
    parser.add_argument("--output", default=str(Path(__file__).parent / ".private-voice"))
    args = parser.parse_args()
    staged = prepare(args.profile, args.output)
    print(json.dumps({"voice": staged["voice"], "profile": staged["profileId"], "references_verified": True, "uploaded": False}))
