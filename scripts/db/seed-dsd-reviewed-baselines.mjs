import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import postgres from 'postgres';

// Exact-source setup client. Root installs/removes the bounded SQL adapter with MCP.
// No administrator credential, schema-create privilege, or arbitrary SQL is needed.
const directory = resolve(import.meta.dirname, '../../evidence/activation-20261004');
const read = name => JSON.parse(readFileSync(resolve(directory, name), 'utf8').replace(/^\uFEFF/, ''));
const resources = read('current-resource-corpus.json').items;
const surfaces = process.argv.includes('--resources-only') ? []
  : read('current-surface-registry.json').filter(item => item.scopePolicy !== 'one-dhs');
const approved = read('baseline-seeding/approved-manifest.json');
if (process.env.PAC_DEDICATED_DSD_DATABASE !== 'yes') throw new Error('Verify the dedicated One DSD database before setup.');
if (!process.env.PAC_RUNTIME_DATABASE_URL) throw new Error('A restricted runtime connection is required.');
const url = new URL(process.env.PAC_RUNTIME_DATABASE_URL);
if (!url.username.startsWith('pac_app_runtime')) throw new Error('Use the restricted runtime role for this adapter.');
const db = postgres(url.href, { ssl: 'require', max: 1, prepare: false, connect_timeout: 15, onnotice: () => {} });
const apply = process.argv.includes('--apply');
const verifyOnly = process.argv.includes('--verify-only');
const progressEnabled = process.argv.includes('--progress');
const startedAt = Date.now();
let phase = 'connection_identity';
let currentItem = null;
let lastCompletedItem = null;
let transactionOutcome = 'not_started';
// Only exact, fixed application RAISE messages may be shown. Dynamic messages,
// PostgreSQL details, query text, parameters, and nested context stay private.
const migrationsDirectory = resolve(import.meta.dirname, '../../db/migrations');
const fixedDatabaseMessages = new Set([
  resolve(import.meta.dirname, 'dsd-reviewed-baseline-installer.sql'),
  ...readdirSync(migrationsDirectory).filter(name => name.endsWith('.sql')).map(name => resolve(migrationsDirectory, name)),
].flatMap(path => [...readFileSync(path, 'utf8').matchAll(/raise\s+exception\s+'((?:''|[^'])*)'/gi)]
  .map(match => match[1].replaceAll("''", "'"))
  .filter(message => !message.includes('%'))));
const progress = (event, extra = {}) => {
  if (progressEnabled) console.log(JSON.stringify({ event, phase, currentItem, lastCompletedItem,
    elapsedMs: Date.now() - startedAt, ...extra }));
};
const rollback = new Error('validated rollback');
const counters = { resources: resources.length, surfaces: surfaces.length, created: 0, preserved: 0 };
const canonical = value => JSON.stringify(value, (_key, entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
const result = { mode: verifyOnly ? 'read_only_verification' : apply ? 'applied' : 'validated_and_rolled_back', ...counters };
try {
  const [identity] = await db`select current_user, has_schema_privilege(current_user,'pac','create') as can_create`;
  if (identity.current_user !== 'pac_app_runtime' || identity.can_create) throw new Error('The connection must remain least privilege.');
  if (!verifyOnly) {
    try {
      await db.begin(async tx => {
        transactionOutcome = 'in_progress';
        phase = 'installation_lock';
        progress('phase_started');
        await tx`select pg_advisory_xact_lock(hashtextextended('one-dsd-reviewed-static-seed',0))`;
        for (const [kind, items] of [['resource', resources], ['surface', surfaces]]) {
          for (const item of items) {
            const id = kind === 'resource' ? item.id : item.surfaceId;
            currentItem = `${kind}:${id}`;
            phase = 'manifest_verification';
            const serialized = JSON.stringify(item);
            if (createHash('sha256').update(serialized).digest('hex') !== approved[`${kind}:${id}`])
              throw new Error(`Source differs from the installation manifest: ${kind}:${id}`);
            phase = 'item_installation';
            const itemStartedAt = Date.now();
            progress('item_started');
            const [row] = await tx`select pac.install_one_dsd_reviewed_baseline(${kind},${serialized}) as receipt`;
            if (!row?.receipt || !['created','preserved'].includes(row.receipt.status)) throw new Error('Installation receipt is invalid.');
            counters[row.receipt.status]++;
            lastCompletedItem = currentItem;
            progress('item_completed', { status: row.receipt.status, itemElapsedMs: Date.now() - itemStartedAt,
              completed: counters.created + counters.preserved });
          }
        }
        currentItem = null;
        phase = apply ? 'transaction_commit' : 'validation_rollback';
        progress('phase_started');
        if (!apply) throw rollback;
      });
      transactionOutcome = 'committed';
    } catch (error) {
      if (error !== rollback) throw error;
      transactionOutcome = 'rolled_back';
    }
    Object.assign(result, counters);
  }
  if (apply || verifyOnly) {
    phase = 'resource_parity_read';
    progress('phase_started');
    const publishedResources = await db`select content_item_id,canonical_payload from pac.read_staff_publications('dsd',null)`;
    const resourceRows = new Map(publishedResources.map(item => [item.content_item_id,item.canonical_payload]));
    phase = 'surface_parity_read';
    progress('phase_started');
    const publishedSurfaces = await db`select surface_id,document from pac.read_surface_publications('dsd',${db.array(surfaces.map(item=>item.surfaceId),25)})`;
    const surfaceRows = new Map(publishedSurfaces.map(item=>[item.surface_id,item.document]));
    const failures = [];
    for (const item of resources) if (canonical(resourceRows.get(item.id)) !== canonical(item)) failures.push(`resource:${item.id}`);
    for (const item of surfaces) if (canonical(surfaceRows.get(item.surfaceId)?.values) !== canonical(item.approvedValues)) failures.push(`surface:${item.surfaceId}`);
    result.resourceParity = resources.length - failures.filter(item=>item.startsWith('resource:')).length;
    result.surfaceParity = surfaces.length - failures.filter(item=>item.startsWith('surface:')).length;
    result.failures = failures;
    result.restrictedRuntimeRole = true;
    if (failures.length) process.exitCode = 1;
  }
  writeFileSync(resolve(directory, `baseline-seeding/${verifyOnly ? 'parity' : apply ? 'applied' : 'validated'}.json`), JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} catch (error) {
  // Do not expose SQL, saved staff copy, connection strings, or authentication data.
  const databaseCode = typeof error.code === 'string' && /^[A-Z0-9_]{3,48}$/.test(error.code) ? error.code : null;
  if (transactionOutcome === 'in_progress') transactionOutcome = 'unconfirmed';
  const failure = { status: 'baseline_setup_failed', code: databaseCode ?? error.name,
    phase, currentItem, lastCompletedItem, transactionOutcome, elapsedMs: Date.now() - startedAt,
    completedBeforeFailure: counters.created + counters.preserved,
    message: fixedDatabaseMessages.has(error.message) ? error.message
      : databaseCode ? 'Database rejected or interrupted the exact baseline setup.' : 'Baseline setup could not complete.' };
  writeFileSync(resolve(directory,'baseline-seeding/failure.json'),JSON.stringify(failure,null,2));
  console.error(JSON.stringify(failure));
  process.exitCode = 1;
} finally {
  await db.end({ timeout: 5 });
}
