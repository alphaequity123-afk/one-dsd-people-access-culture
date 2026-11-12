"""Stage the approved private voice references for the hosted overview worker."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil


def verify(path, sha256):
    if hashlib.sha256(path.read_bytes()).hexdigest() != sha256:
        raise RuntimeError("The approved voice reference checksum does not match")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("work", type=Path, help="Directory containing the approved voice profile locks")
    args = parser.parse_args()
    work = args.work.resolve()
    geffen = json.loads((work / "approved-three-voice-profile.lock.json").read_text(encoding="utf-8"))
    selected = work / "preview-podcast-voices-20261101"
    hosts = json.loads((selected / "profile.lock.json").read_text(encoding="utf-8"))
    if not geffen.get("locked") or not hosts.get("locked") or hosts["profileId"] != "one-dsd-selected-preview-podcast-voices-v1":
        raise RuntimeError("The approved three-voice references are required")

    refs = {"geffen": (Path(geffen["geffen"]["referenceWav"]), geffen["geffen"]["referenceWavSha256"], geffen["geffen"]["referenceTranscript"])}
    for voice, key in (("host1", "host1Selected"), ("host2", "host2Selected")):
        asset = hosts["assets"][key]
        refs[voice] = (selected / asset["path"], asset["sha256"], hosts["voices"][voice]["identity"]["transcript"])
    for path, sha256, _ in refs.values():
        verify(path, sha256)

    output = Path(__file__).resolve().parent / ".private-overview-voices"
    output.mkdir(exist_ok=True)
    manifest = {"profile": "approved-resource-overview-v1", "voices": {}}
    for voice, (path, sha256, transcript) in refs.items():
        shutil.copyfile(path, output / (voice + ".wav"))
        manifest["voices"][voice] = {"sha256": sha256, "transcript": transcript}
    (output / "profile.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Verified and staged GEFen and both approved Qwen hosts.")
