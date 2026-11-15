import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({root,resolve:{alias:{'@':root,'server-only':fileURLToPath(new URL('../testing/server-only-stub.mjs',import.meta.url))}},test:{environment:'jsdom',include:['lib/implementation/records.test.ts','components/record-workbench.test.tsx','lib/learning/clas-notes.test.ts','components/clas-curriculum.test.tsx'],fileParallelism:false}});
