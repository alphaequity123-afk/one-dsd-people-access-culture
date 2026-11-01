// Creates and destroys a local synthetic database. Never connects to a deployment.
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const dataRoot = resolve(root, ".data");
mkdirSync(dataRoot, { recursive: true });
const temp = mkdtempSync(join(dataRoot, "pg-public-media-"));
const pgBin = process.env.PAC_TEST_POSTGRES_BIN || "C:\\Program Files\\PostgreSQL\\16\\bin";
const exe = name => join(pgBin, `${name}.exe`);
const env = { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, TEMP: process.env.TEMP, TMP: process.env.TMP, PGOPTIONS: "-c search_path=public,extensions" };
const invoke = (program, args, options = {}) => {
  const result = spawnSync(program, args, { env, encoding: "utf8", windowsHide: true, ...options });
  if (result.status !== 0) throw Error(`${program} failed: ${result.stderr || result.stdout || result.error}`);
  return result;
};
const port = await new Promise((resolvePort, reject) => {
  const server = createServer(); server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const number = server.address().port; server.close(() => resolvePort(number)); });
});
let started = false;
try {
  invoke(exe("initdb"), ["-D", temp, "-U", "pac_audit", "-A", "trust", "--no-locale", "--encoding=UTF8"]);
  // Do not pipe startup output: Windows postgres inherits open pipes, which can
  // otherwise keep spawnSync waiting after pg_ctl exits.
  invoke(exe("pg_ctl"), ["-D", temp, "-l", join(temp, "server.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"], { stdio: "ignore" });
  started = true;
  const psql = args => invoke(exe("psql"), ["-X", "-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1", "-p", String(port), "-U", "pac_audit", "-d", "postgres", ...args]);
  psql(["-c", "create schema extensions; create extension pgcrypto with schema extensions"]);
  for (const file of ["db/standalone/bootstrap.sql", "db/standalone/0070_pac_dsd_public_media_scripts.sql", "scripts/testing/fixtures/public-resource-media-fixtures.sql", "scripts/testing/fixtures/public-resource-media-assertions.sql", "scripts/testing/fixtures/public-resource-media-reader-fixtures.sql"]) psql(["-f", join(root, file)]);
  const testEnv = { ...env, NODE_ENV: "test", PAC_TEST_PUBLIC_MEDIA_URL: `postgres://pac_dsd_app_runtime@127.0.0.1:${port}/postgres`, PAC_TEST_PUBLIC_MEDIA_ADMIN_URL: `postgres://pac_audit@127.0.0.1:${port}/postgres` };
  invoke(process.execPath, [join(root, "node_modules/vitest/vitest.mjs"), "run", "--config", "scripts/testing/vitest.public-resource-media.config.mts"], { env: testEnv, stdio: "inherit" });
  console.log("Isolated publication and actual app reader tests passed.");
} finally {
  if (started) invoke(exe("pg_ctl"), ["-D", temp, "-m", "fast", "-w", "stop"]);
  if (dirname(resolve(temp)) !== dataRoot || !temp.startsWith(join(dataRoot, "pg-public-media-"))) throw Error("Refusing to remove unexpected test directory");
  rmSync(temp, { recursive: true, force: true });
}
