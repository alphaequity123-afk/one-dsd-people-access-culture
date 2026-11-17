# Accessibility standard for One DHS

Owner-directed application requirement, adopted November 16, 2026.

## Scope

This is an internal staff application. Accessibility applies to the entire staff experience: navigation, Ask and its generated answers, role selection, learning pathways, courses, practice and Apply activities, search, support, owner interfaces, media, and generated/downloadable materials. The requirement extends across the agency application and connected DSD routes. Internal use does not remove accessibility requirements.

Use the owner-supplied Minnesota Accessible Document Reference Guide (Version 3.0, January 2020) as the content-authoring baseline, mapped to the current State of Minnesota Digital Accessibility Standard (Version 4.00, effective July 1, 2024), WCAG 2.1 levels A and AA and the state's qualified Section 508 provisions. The state standard exempts WCAG 4.1.1. Apply technology-specific instructions to the relevant format; update obsolete procedures using current authoritative guidance.

Sources:
- https://mn.gov/mnit/government/policies/accessibility/
- https://mn.gov/mnit/assets/MinnesotaStateAccessibilityStandard-v.4.0_tcm38-607575.pdf
- https://www.w3.org/TR/WCAG21/
- https://www.w3.org/WAI/media/av/description/
- https://support.microsoft.com/en-us/accessibility/office-accessibility/create-accessible-pdfs

## Shared interface requirements

- Keep the approved navy DHS logo banner, visible navigation, calm professional language, roles and pathways. Improve accessibility within that design.
- Supply descriptive page titles, semantic headings, landmarks and logical reading order. Distinguish multiple media regions and navigation regions by meaningful names.
- Every operation must work by keyboard with visible focus, logical focus order and no trap. Removing or replacing an active control requires an intentional focus strategy. Announce relevant results and errors without repetitive streaming announcements.
- Associate labels, instructions and validation errors with inputs. Make errors understandable and preserve appropriate entered work. Do not use placeholders as the only labels.
- Make prose links identifiable without color alone. Use underlines for inline links; distinguish buttons and navigation by their established control styling. Retain visible focus in forced-color modes.
- Verify applicable text contrast (4.5:1 normal text, 3:1 large text) and non-text UI contrast (3:1). Evaluate actual colors, sizes, states and context. Do not infer contrast from a token name.
- Support 200% text resize, 400% browser zoom/reflow at 320 CSS pixels, applicable text-spacing changes and user-selected display settings. Do not override accessibility preferences.
- Give meaningful non-text content an equivalent description. Decorative images use empty alternatives. Charts need labels and accessible data or a full equivalent explanation; color cannot carry the only distinction.

## Ask, learning and practice

- Announce preparing, completion and failure through stable status/error regions. Give staff a clear way to reach the answer and supporting sources. Avoid announcing every streamed token or unexpectedly taking focus while staff read elsewhere.
- Preserve headings and real lists in generated answers. Retain source provenance and distinguish guidance, evidence, uncertainty and official authority.
- Make selection, feedback, next steps, completion and return navigation understandable with a screen reader. Verify every distinct job-family/task combination, shared template and interactive state.
- Give staff sufficient time for learning and practice. Video countdowns must not block controls or substitute for an untimed text/interactive version.
- Keep Geffen as optional narration and the approved individual guides as supportive visuals. Custom speech must not replace accessible HTML or interfere with a user's screen reader and speech preferences.

## Media

- Follow the owner's supplied guide by starting audio and animation only after a user chooses playback. Preserve the five-second hero animation as an optional action and honor reduced motion.
- Provide usable keyboard controls and accurate synchronized captions, including meaningful non-speech sound where applicable. Review final captions against the actual audio; generation or file existence is not proof of accuracy.
- Speak all visual information necessary to understand an instructional video. Integrated narration can satisfy the description need; otherwise provide a described version. A transcript alone does not close an AA audio-description gap.
- Keep the recording, captions, transcript, teaching points and chapter timings consistent after edits. Provide a structured HTML equivalent for essential instruction, with meaningful headings and actions.
- Share the accessible player with its captions and transcript as the primary route. If offering a bare media file, also make the corresponding captions and transcript available.
- Avoid unsafe flashing; a warning does not substitute for satisfying flash requirements.

## Documents and exports

- Maintain title, subject, author/agency and language metadata as appropriate to the file format.
- Word: semantic styles, logical heading order, real lists, table headers, useful link text and image alternatives; verify reading order.
- Excel: meaningful sheet names, clear starting instructions, usable table structure and header information, labeled charts and non-color distinctions. Do not hide essential help using white-on-white text or tiny fonts.
- PowerPoint: meaningful unique slide titles, logical reading order, appropriate layouts, image alternatives and equivalent media access. Keep essential instruction available beyond presenter notes.
- PDF: tagged semantic structure, correct reading order, headings, lists, table-header associations, language, useful links and accessible fields where applicable. Preserve metadata and inspect the generated output. Extractable text alone is insufficient.
- Use current accessible export methods; Microsoft Save As can produce tagged PDFs when source content and options are correct. Printing to PDF is not an accessibility verification method.
- Inventory original third-party sources separately. Preserve their meaning, source credits and publication rights. Obtain an accessible version or provide a lawful equivalent route when a necessary external resource creates a barrier.

## Verification and release receipts

Use automated accessibility checks and targeted behavioral tests, followed by keyboard, magnification and screen-reader review. Include actual staff who use assistive technology where possible. Automated checks, clean builds, captions present and readable appearance do not establish full conformance.

For each finding record ID, requirement, route/artifact and state, role/task, expected behavior, observed result, severity, owner, correction, browser/assistive technology, before/after evidence and date. Mark untested or partially tested items explicitly. Do not describe an authentication screen as coverage of the authenticated interface behind it.

Before claiming conformance, resolve confirmed required failures, complete the remaining manual checks and follow the responsible agency process for any necessary exception. Keep an internal route for reporting barriers and requesting alternative formats. Never invent contacts or claim a completed human review that did not occur.

New pages, shared components, generated exports and media changes must retain these requirements. Do not suppress accessibility rules merely to make a test pass.
