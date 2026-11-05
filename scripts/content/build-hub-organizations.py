"""Build lib/content/hub/organizations.json from the researched explainer files.

Usage: python -I scripts/content/build-hub-organizations.py <explainer data folder> <worktree root>

Community links are only added where a public record or the organization's own
description names that community. Native community pages are never linked
(owner rule: those pages defer to the Office of Indian Affairs).
"""
import json
import pathlib
import sys

SRC = pathlib.Path(sys.argv[1])
ROOT = pathlib.Path(sys.argv[2])

COMMUNITIES = {
    "autism-society-of-minnesota": ["somali", "latino"],
    "capital-health-services": ["somali", "oromo", "ethiopian", "amharic", "karen"],
    "centro-tyrone-guzman": ["latino"],
    "korean-service-center": ["korean"],
    "maangaar-global": ["somali"],
    "minnesota-deaf-muslim-community": ["deaf-deafblind-hard-of-hearing"],
    "rise-inc": ["deaf-deafblind-hard-of-hearing"],
    "minnesota-first-community-solutions": ["hmong", "somali"],
    "multicultural-autism-action-network": ["somali", "oromo"],
    "sewa-asian-indian-family-wellness": ["indian"],
    "shakir-consulting-services": ["african-american"],
    "somali-community-resettlement-services": ["somali", "latino"],
    "somali-parents-autism-network": ["somali"],
    # Greater Minnesota work, linked to the rural brief.
    "adaptive-wilderness-within-reach": ["rural"],
    "lighthouse-center-for-vital-living": ["rural"],
    "lincoln-pto-hibbing": ["rural"],
    "phase-pine-habilitation-and-supported-employment": ["rural"],
    "residential-services-of-northeastern-minnesota": ["rural"],
    "southeastern-minnesota-center-for-independent-living": ["rural"],
    "udac": ["rural"],
}
NATIVE = {"native-american", "tribal-nations", "alaska-native"}
CLOSED = {"upstream-arts"}

orgs = []
for path in sorted(SRC.glob("*.json")):
    org = json.loads(path.read_text(encoding="utf-8"))
    slug = org["slug"]
    communities = COMMUNITIES.get(slug, [])
    assert not NATIVE.intersection(communities), slug
    org["communities"] = communities
    org["closed"] = slug in CLOSED
    # A relationship counts as "with the division" only when its record names the division.
    for rel in org.get("withTheDivision", []):
        text = f'{rel.get("program", "")} {rel.get("what", "")}'
        rel["departmentWide"] = ("Department of Human Services-wide" in text) or ("no division named" in text) or ("division not named" in text)
    orgs.append(org)

out = ROOT / "lib" / "content" / "hub" / "organizations.json"
out.write_text(json.dumps({"checked": "2026-11-05", "organizations": orgs}, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(orgs), "organizations;", sum(1 for o in orgs if o["communities"]), "linked to communities")
