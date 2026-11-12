"""Extract text from the explicitly published downloads used by Gemini learning.

Run from the app root after public release assets are restored. The runtime
checks the digest of every original against this projection before using it.
Requires PyMuPDF for PDF extraction.
"""

from hashlib import sha256
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

import pymupdf


COMPANIONS = (
    "Facilitator Guide",
    "Intercultural Competence in Practice",
    "Learning Glossary",
    "Unconscious Bias in Everyday Decisions",
    "Understanding White Privilege",
)
PRESENTATION = "/documents/program-evidence/one-dsd-equity-analysis-policy.pdf"
PRESENTATION_PAGE = "/learn/equity-toolkit/policy-review"
GUIDES = (
    ("guide-one-dsd-work-plan", "Equity implementation work plan", "DSD_Equity_Implementation_Work_Plan.docx"),
    ("guide-one-dsd-measures", "Data and measures", "One_DSD_Data_and_Metrics_Framework.docx"),
    ("guide-one-dsd-quarterly-report", "Quarterly progress report: Guide", "One_DSD_Quarterly_Report_Dashboard_Guide.docx"),
)
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def normalized(text):
    return re.sub(r"\s+", " ", text).strip()


def attachment(path, title, parent, kind, passages):
    digest = sha256((Path("public") / path.lstrip("/")).read_bytes()).hexdigest()
    return {"path": path, "title": title, "parent": parent, "kind": kind,
            "sha256": digest, "passages": passages}


def pdf(path, title, parent, kind="learning_pdf_page"):
    file = Path("public") / path.lstrip("/")
    with pymupdf.open(file) as document:
        passages = []
        for number, page in enumerate(document, 1):
            body = normalized(page.get_text())
            if not body:
                raise ValueError(f"Missing readable text on {path} page {number}")
            passages.append({"label": f"page {number}", "text": body, "fragment": f"page={number}"})
    return attachment(path, title, parent, kind, passages)


def paragraph_text(paragraph):
    return normalized("".join(node.text or "" for node in paragraph.iter(W + "t")))


def word(path, title, parent):
    with ZipFile(Path("public") / path.lstrip("/")) as archive:
        body = ET.fromstring(archive.read("word/document.xml")).find(W + "body")
    passages = []
    heading = "Overview"
    parts = []
    for block in body:
        if block.tag == W + "p":
            text = paragraph_text(block)
            if not text:
                continue
            style = block.find(f"{W}pPr/{W}pStyle")
            if style is not None and style.get(W + "val", "").startswith("Heading"):
                if parts:
                    passages.append({"label": heading, "text": "\n".join(parts)})
                heading, parts = text, []
            else:
                parts.append(text)
        elif block.tag == W + "tbl":
            for row in block.findall(W + "tr"):
                cells = [" ".join(paragraph_text(p) for p in cell.findall(W + "p")) for cell in row.findall(W + "tc")]
                parts.append(" | ".join(cells))
    if parts:
        passages.append({"label": heading, "text": "\n".join(parts)})
    if not passages:
        raise ValueError(f"Missing readable text in {path}")
    return attachment(path, title, parent, "learning_reference_section", passages)


def presentation():
    slide_data = json.loads(Path("data/program-documents/policy-presentation.json").read_text(encoding="utf-8"))
    passages = [{
        "label": f"slide {slide['number']}: {slide['title']}",
        "fragment": f"page={slide['number']}",
        "text": "\n".join([
            f"Adapted training from {slide_data['sourceDate']}. Confirm current contacts and procedures.",
            slide["title"],
            *slide["text"],
        ]),
    } for slide in slide_data["slides"]]
    with pymupdf.open(Path("public") / PRESENTATION.lstrip("/")) as document:
        if len(document) != len(passages):
            raise ValueError("Policy slide text and PDF page counts differ")
    return attachment(PRESENTATION, "Equity analysis for policy review", PRESENTATION_PAGE, "learning_slide", passages)


def main():
    rows = [pdf(f"/learning/training-companions/{title}.pdf", title, "/learning/training-companions/index.html") for title in COMPANIONS]
    rows.append(presentation())
    rows.extend(word(f"/library/one-dsd-planning/{file}", title, f"/library/{id_}") for id_, title, file in GUIDES)
    output = Path("lib/intelligence/retrieval/published-resource-text.json")
    output.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(rows)} downloads, {sum(len(row['passages']) for row in rows)} passages")


if __name__ == "__main__":
    main()
