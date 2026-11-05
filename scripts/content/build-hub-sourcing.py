"""Combine the researched sourcing categories into lib/content/hub/sourcing.json.

Usage: python -I scripts/content/build-hub-sourcing.py <sourcing data folder> <worktree root>
Native community ids are removed from every entry (owner rule).
"""
import json
import pathlib
import sys

SRC = pathlib.Path(sys.argv[1])
ROOT = pathlib.Path(sys.argv[2])
ORDER = ["state-hiring", "workforce", "education", "associations", "media", "community-institutions", "venues", "events"]
NATIVE = {"native-american", "tribal-nations", "alaska-native"}

categories = []
for path in sorted(SRC.glob("*.json"), key=lambda p: ORDER.index(p.stem) if p.stem in ORDER else 99):
    data = json.loads(path.read_text(encoding="utf-8"))
    # The page carries the Tribal referral note itself, so referral entries are not repeated as sources.
    data["entries"] = [e for e in data.get("entries", []) if e.get("kind") != "referral"]
    for entry in data.get("entries", []):
        entry["communities"] = [c for c in entry.get("communities", []) if c not in NATIVE]
        if entry.get("website", "").startswith("http://"):
            entry["website"] = "https://" + entry["website"][len("http://"):]
    categories.append(data)

out = ROOT / "lib" / "content" / "hub" / "sourcing.json"
out.write_text(json.dumps({"checked": "2026-11-05", "categories": categories}, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(categories), "categories,", sum(len(c.get("entries", [])) for c in categories), "entries")
