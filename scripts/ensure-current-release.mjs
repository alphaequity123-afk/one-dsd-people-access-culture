import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
import {validateTransportPlan} from './release-transport-plan.mjs';
const manifest=JSON.parse(await fs.readFile('config/railway-release-assets.json','utf8'));
const transport=JSON.parse(await fs.readFile('config/current-release-transport.json','utf8'));
validateTransportPlan(transport,manifest);
function run(script){const result=spawnSync(process.execPath,[script],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}
run('scripts/apply-standalone-public-overrides.mjs');
let complete=true;for(const asset of manifest.assets){const stat=await fs.stat(asset.path).catch(()=>null);if(!stat||stat.size!==asset.bytes){complete=false;break;}}
if(!complete)run('scripts/hydrate-current-release.mjs');
run('scripts/apply-standalone-public-overrides.mjs');
run('scripts/apply-reviewed-public-assets.mjs');
// A declared standalone HTML identity wins over an older reviewed copy of the same page.
run('scripts/apply-standalone-public-overrides.mjs');
run('scripts/verify-railway-release-assets.mjs');
