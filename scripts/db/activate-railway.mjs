import { execFileSync } from 'node:child_process';
import postgres from 'postgres';

execFileSync(process.execPath, ['scripts/db/migrate.mjs', '--apply'], { stdio: 'inherit' });
const runtimeUrl = new URL(process.env.PAC_RUNTIME_DATABASE_URL);
if (runtimeUrl.username !== 'pac_app_runtime') throw new Error('Restricted runtime role required');
const sql = postgres(process.env.PAC_DATABASE_URL, { ssl: 'require', max: 1, onnotice: () => {} });
try {
  const rows = await sql`select format('alter role pac_app_runtime password %L', ${decodeURIComponent(runtimeUrl.password)}) as statement`;
  await sql.unsafe(rows[0].statement);
  console.log('Restricted application role provisioned.');
} finally { await sql.end(); }
const runtime = postgres(process.env.PAC_RUNTIME_DATABASE_URL, { ssl: 'require', max: 1, onnotice: () => {} });
try {
  const rows = await runtime`select current_user, has_schema_privilege(current_user, 'pac', 'create') as can_create`;
  if (rows[0].current_user !== 'pac_app_runtime' || rows[0].can_create) throw new Error('Runtime boundary failed');
  await runtime`select * from pac.read_page_text_overrides('dsd', '/activation-verification')`;
  console.log('Restricted storage and page editing read verified.');
} finally { await runtime.end(); }
