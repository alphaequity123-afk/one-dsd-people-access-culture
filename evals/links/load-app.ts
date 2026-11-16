/**
 * Load the application's own TypeScript modules offline, in this process, with the "@/" alias and the
 * "server-only" stub the test suite uses. Vite transforms the modules in memory (middleware mode: no port is
 * opened, nothing is watched or built). Content comes from the repository files (PAC_CONTENT_SOURCE=static),
 * never a database, and no model provider key is visible to the loaded code.
 * One loader is shared by every eval in the run; scripts/evals/run.ts exits the process when it is done.
 */
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url)).replace(/[\\/]$/, "");

type Loader = { load: <T>(file: string) => Promise<T>; close: () => Promise<void> };
const shared = globalThis as { __evalAppLoader?: Promise<Loader> };

async function createLoader(): Promise<Loader> {
  process.env.PAC_CONTENT_SOURCE = "static";
  process.env.PAC_STORE = "memory";
  for (const key of ["PAC_RUNTIME_DATABASE_URL", "DATABASE_URL", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "PAC_OPENAI_API_KEY"]) delete process.env[key];
  const { createServer } = await import("vite");
  const server = await createServer({
    configFile: false,
    root: ROOT,
    logLevel: "error",
    appType: "custom",
    clearScreen: false,
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { "@": ROOT, "server-only": `${ROOT}/scripts/testing/server-only-stub.mjs` } },
  });
  return {
    load: async <T>(file: string) => (await server.ssrLoadModule(`${ROOT}/${file}`)) as T,
    close: () => server.close(),
  };
}

export async function loadAppModule<T>(file: string): Promise<T> {
  shared.__evalAppLoader ??= createLoader();
  return (await shared.__evalAppLoader).load<T>(file);
}

export async function closeApp(): Promise<void> {
  const loader = shared.__evalAppLoader;
  shared.__evalAppLoader = undefined;
  if (loader) await (await loader).close();
}
