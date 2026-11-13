import { describe, expect, it } from 'vitest';
import { EXTERNAL_READINGS } from '@/lib/content/external-readings';
import { loadExternalReading } from '@/lib/content/external-reading-body';
import { sourceReadingDocs } from './source-reading-docs';
import { searchDocs } from './search';
import { citationEvidenceFromDocs, validateEvidenceClaims } from './evidence';
import { resolveCitedStatements } from './generated-evidence';
import { brainContext } from './brain';

describe('reviewed outside readings in the shared knowledge index', () => {
  it('represents every published reading and substantive section, retaining outside attribution', async () => {
    const docs = await sourceReadingDocs();
    for (const entry of EXTERNAL_READINGS) {
      const body = await loadExternalReading(entry.id);
      const sections = docs.filter(doc => doc.id.startsWith(`asset-source-reading-${entry.id}-`));
      expect(sections.length).toBe(body!.sections!.length);
      expect(sections.every(doc => doc.authority === 'external_verify' && doc.graphRelated!.includes(entry.original))).toBe(true);
    }
  });
  it('retrieves original substantive text and validates its exact evidence identity', async () => {
    const docs = await sourceReadingDocs();
    const hits = searchDocs('ADA effective communication auxiliary aids companions', docs, {limit: 5});
    expect(hits.some(hit => /Effective Communication/.test(hit.title))).toBe(true);
    const sources = citationEvidenceFromDocs(hits, docs);
    const {claims} = resolveCitedStatements([{text: 'The reading discusses communication support.', refs: ['S1']}], sources);
    expect(validateEvidenceClaims(claims, sources, docs)).toHaveLength(1);
    expect(() => validateEvidenceClaims(claims, sources, docs.filter(doc => doc.id !== sources[0].id))).toThrow();
  });
  it('keeps a rescinded footnote reference distinct from the still-preserved national origin reading', async () => {
    const docs = await sourceReadingDocs();
    const section = docs.find(doc => doc.id === 'asset-source-reading-7e5f68e5c07f566d2dcf-36')!;
    expect(section.sourceContext?.note).toContain('October 28, 2026');
    expect(section.sourceContext?.note).toContain('does not say that the National Origin Discrimination guidance itself was rescinded');
    expect(section.text).toContain('Arrest and Conviction Records');
    expect(section.text).not.toContain(section.sourceContext!.note);
    expect(docs.filter(doc => doc.sourceContext)).toHaveLength(1);
    const hits = searchDocs('National Origin Discrimination', [section], { limit: 1 });
    expect(citationEvidenceFromDocs(hits, docs)[0].sourceContext).toEqual(section.sourceContext);
    expect(brainContext(hits, [], docs, 'arrest and conviction records').context[0].sourceContext).toEqual(section.sourceContext);
  });
});
