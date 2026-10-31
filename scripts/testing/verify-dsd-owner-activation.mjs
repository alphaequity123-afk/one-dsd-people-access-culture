import { execFileSync } from 'node:child_process';
import postgres from 'postgres';

// Read-only activation check. Never prints connection strings, keys, or saved wording.
if (process.env.PAC_CONTENT_SOURCE !== 'static') throw new Error('This check preserves the reviewed static resource collection.');
if (process.env.PAC_STORE !== 'postgres') throw new Error('Persistent storage must be selected.');
if (!process.env.PAC_RUNTIME_DATABASE_URL) throw new Error('A restricted database connection is required.');
if (!process.env.PAC_OWNER_DATABASE_URL || decodeURIComponent(new URL(process.env.PAC_OWNER_DATABASE_URL).username).split('.')[0] !== 'pac_owner_writer') throw new Error('A separate private owner writer connection is required.');
if ((process.env.PAC_OWNER_KEY?.trim().length ?? 0) < 32) throw new Error('A private owner key of at least 32 characters is required.');
const connection = new URL(process.env.PAC_RUNTIME_DATABASE_URL);
const ssl = ['localhost','127.0.0.1','::1','[::1]'].includes(connection.hostname) ? false : 'require';
const db = postgres(connection.href, { ssl, max: 1, prepare: false, onnotice: () => {} });
const selected = [...new Set((process.env.PAC_DATABASE_EDITABLE_SURFACES ?? '').split(',').map(x => x.trim()).filter(Boolean))];
const registry = JSON.parse(execFileSync(process.execPath, ['scripts/content/export-editable-surface-seed.cjs'], { encoding: 'utf8', maxBuffer: 100_000_000, windowsHide: true }));
const canonical = value => JSON.stringify(value, (_key, entry) => entry && typeof entry === 'object' && !Array.isArray(entry) ? Object.fromEntries(Object.entries(entry).sort(([a],[b]) => a.localeCompare(b))) : entry);
const report = { staticCollectionPreserved: true, restrictedRole: false, textRead: false, imageRead: false, selectedSurfaces: [], failures: [] };
try {
  const [identity] = await db`select current_user, has_schema_privilege(current_user, 'pac', 'create') as can_create`;
  report.restrictedRole = identity.current_user !== 'postgres' && !identity.can_create;
  if (!report.restrictedRole) report.failures.push('Runtime must not use an administrative role.');
  await db`select * from pac.read_page_text_overrides('dsd', '/activation-verification')`;
  report.textRead = true;
  await db`select * from pac.read_page_image_overrides('dsd', '/activation-verification')`;
  report.imageRead = true;
  for (const id of selected) {
    const definition = registry.find(item => item.surfaceId === id);
    if (!definition) { report.failures.push(`Unknown selected area: ${id}`); continue; }
    const scope = definition.scopePolicy === 'one-dhs' ? 'one-dhs' : 'dsd';
    const rows = await db`select * from pac.read_surface_publication(${scope}, ${id})`;
    const matchesReviewedDefaults = rows.length === 1 && canonical(rows[0].document.values) === canonical(definition.approvedValues);
    const [state] = await db`select pac.read_surface_editing_state(${scope}, ${id}) as state`;
    const editable = Boolean(state?.state);
    report.selectedSurfaces.push({ id, scope, matchesReviewedDefaults, editable });
    if (!matchesReviewedDefaults || !editable) report.failures.push(`Selected area needs baseline reconciliation before activation: ${id}`);
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ status: 'activation_check_failed', code: error.code ?? error.name }));
  process.exitCode = 1;
} finally { await db.end({ timeout: 5 }); }
