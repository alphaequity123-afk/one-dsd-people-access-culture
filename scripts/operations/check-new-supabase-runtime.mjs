import fs from 'node:fs';
import postgres from 'postgres';

const secrets = JSON.parse(fs.readFileSync('.data/supabase-activation/secrets.json', 'utf8'));
const url = new URL('postgresql://db.htdefyecztafxkvfbrlo.supabase.co:5432/postgres');
url.username = 'pac_app_runtime';
url.password = secrets.runtimePassword;
const db = postgres(url.href, { ssl: 'require', prepare: false, max: 1, connect_timeout: 15, onnotice: () => {} });
try {
  const [identity] = await db`select current_user, has_schema_privilege(current_user, 'pac', 'create') as can_create`;
  if (identity.current_user !== 'pac_app_runtime' || identity.can_create) throw new Error('Runtime boundary failed');
  console.log(JSON.stringify({ connected: true, restrictedRole: true, administrativeSchemaAccess: false }));
} catch (error) {
  console.error(JSON.stringify({ connected: false, code: error.code ?? error.name }));
  process.exitCode = 1;
} finally { await db.end({ timeout: 5 }); }
