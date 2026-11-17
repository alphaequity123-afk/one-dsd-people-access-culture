# Accessible static document derivatives

The application serves 97 static PDF, Word, and PowerPoint files. The 2026-11-16 structural inventory identified 82 documents requiring these repairs. Five standalone HTML pages also receive verified post-restoration accessibility fixes, for 87 derived outputs in total:

- 73 PowerPoint files: designate existing visible titles as title placeholders; add reviewed descriptions to photographs, icons, and logos that lack alternative text; supply a default English language for existing text formatting.
- Seven Word guides: correct document-title metadata from the existing visible Title paragraph and add the English document language. Body content and existing table-header settings are unchanged.
- Two already-tagged PDFs: add missing title metadata and request display of that title. Incremental updates retain the original content and structure tree.

- Five standalone HTML pages: preserve the approved navigation, landmark, contrast, and section corrections after the existing source-restoration step. UTF-8 byte ranges and exact replacement text are captured in `html-patches.json`; both source fragments and final output hashes are checked.

`index.json` records the exact original and repaired SHA-256 hashes and lengths. `image-alt.json` contains descriptions written after visual inspection of the 58 distinct images, including inherited logos. No picture is automatically marked decorative. The original source wording, notes, diagrams, and images remain intact.

`scripts/accessible-static-assets.mjs` produces ordinary Office ZIP packages. The authoritative ZIP directory must have no duplicate entry names; output CRCs are checked. Replacement XML entries retain their source timestamps and do not create timestamp-dependent parent-directory entries.

Build order is deliberate:

1. `prebuild` restores any recognized repaired files from `.cache/accessible-static-assets/`, verifying the exact original hash. An unknown file or invalid cache fails closed. Missing files and unhydrated LFS pointers remain subject to the existing restoration checks.
2. The established release restoration and checksum verification run without weakened checks.
3. Immediately before the Next production build, the script derives the repaired files from the exact originals and verifies every repaired hash.

The cache is local and ignored by Git. Fresh builds obtain originals from the existing verified source transport. Do not commit the derived public binaries or the five derived standalone HTML pages or cached originals as new source identities. Run `node scripts/accessible-static-assets.mjs restore` before staging source changes. The final build recreates the repaired downloads.

For an intentional content update, review the new source, update its original identity and relevant descriptions, then use `record` to record the reviewed derivative hashes. `record` still refuses any source that does not match the listed original identity. Normal builds use `apply`, never `record`.

Validation receipts are in the task's `accessibility-review-2026-11-16` directory. They include the complete 97-file structural inventory, 82 repaired-document checks and separate roundtrip checks for all five HTML pages, title/alternative-text verification for all 2,286 slides, unchanged slide text and explicit geometry, seven unchanged Word document bodies, PDF render comparisons, and source-restoration/reapplication tests. LibreOffice comparison covered all pages of seven repaired Word guides and the visible slides in three representative decks. Title-placeholder inheritance causes small title-only rendering shifts in the decks; body content and imagery remain unchanged.

These repairs and checks do not constitute PDF/UA or WCAG certification. Reading order, complex diagram interpretation, assistive-technology behavior, and visual quality across every source page still require human review. The six original source PDFs and five training-companion PDFs already had tags and document language at inventory time; presence of those properties alone is not proof of their semantic quality.
