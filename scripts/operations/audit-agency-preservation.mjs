import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(`${process.cwd()}/package.json`);
const postgres = require('postgres');
const result = {};
const file = `${process.cwd()}/.data/page-edits/page-edits.json`;
try {
  const bytes = await readFile(file), edits = JSON.parse(bytes);
  result.pageEdits = { pages: Object.keys(edits.pages).length, edits: Object.values(edits.pages).reduce((sum, page) => sum + Object.keys(page).length, 0), sha256: createHash('sha256').update(bytes).digest('hex') };
} catch (error) { if (error.code !== 'ENOENT') throw error; result.pageEdits = { present: false }; }
result.mediaDirectoryPresent = await stat(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT).then(info => info.isDirectory());
const db = postgres(process.env.PAC_RUNTIME_DATABASE_URL, { max: 1, prepare: false, ssl: 'require' });
try {
  result.publications = await db.begin('read only', async tx => tx`
    select count(*)::int as tracked, count(revision_id)::int as published,
      md5(string_agg(content_item_id || ':' || coalesce(payload_sha256, 'withdrawn'), ',' order by content_item_id)) as identity
    from pac_dsd.read_static_resource_overlay('dsd')`);
} finally { await db.end(); }
console.log(JSON.stringify(result));
