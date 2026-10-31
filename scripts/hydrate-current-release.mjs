import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {downloadVerifiedPackage} from './download-verified-package.mjs';
import {spawnSync} from 'node:child_process';
import {storageRequest} from './self-directed-storage.mjs';
import {validateTransportPlan} from './release-transport-plan.mjs';

const root = process.cwd();
const transport = JSON.parse(await fs.readFile('config/current-release-transport.json', 'utf8'));
const release = JSON.parse(await fs.readFile('config/railway-release-assets.json', 'utf8'));
const plan = validateTransportPlan(transport, release);
const credentials = {endpoint: process.env.SERIES_ASSET_ENDPOINT, bucketName: process.env.SERIES_ASSET_BUCKET, region: process.env.SERIES_ASSET_REGION, accessKeyId: process.env.SERIES_ASSET_ACCESS_KEY_ID, secretAccessKey: process.env.SERIES_ASSET_SECRET_ACCESS_KEY};
if (Object.values(credentials).some(value => !value)) throw Error('Existing asset store is unavailable');

// Always finish the base before applying the explicitly declared replacements.
for (const [label, packages] of [['base', plan.basePackages], ['overlay', plan.overlayPackages]]) {
  // Coverage validation guarantees disjoint files within each phase. Limit
  // concurrent downloads to three; overlays still wait for the full base.
  let next = 0;
  async function worker() {
   while (next < packages.length) {
    const i = next++;
    const item = packages[i];
    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'one-dhs-current-release-'));
    try {
      const archive = path.join(temporary, 'assets.tar.gz');
      const {url, headers} = storageRequest(credentials, item.key);
      console.log(`Restoring verified ${label} package ${i + 1}/${packages.length}`);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await downloadVerifiedPackage(url, headers, archive, item);
          break;
        } catch (error) {
          if (attempt === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      const listing = spawnSync('tar', ['-tzf', archive], {encoding: 'utf8', maxBuffer: 2000000});
      if (listing.status !== 0) throw Error('Cannot read current package');
      const entries = listing.stdout.split(/\r?\n/).filter(Boolean).map(entry => entry.replace(/^\.\//, ''));
      const allowed = new Set(item.files);
      if (entries.length !== allowed.size || new Set(entries).size !== allowed.size || entries.some(entry => !allowed.has(entry))) throw Error('Unexpected or missing package entry');
      const extract = spawnSync('tar', ['-xzf', archive, '-C', root], {stdio: 'inherit'});
      if (extract.status !== 0) throw Error('Cannot restore current package');
      console.log(`Restored verified ${label} package ${i + 1}/${packages.length}`);
    } finally {
      await fs.rm(temporary, {recursive: true, force: true});
    }
   }
  }
  await Promise.all(Array.from({length: Math.min(3, packages.length)}, () => worker()));
}
// Existing reviewed document overrides remain authoritative. The independent
// final gate checks every effective asset, not merely archive coverage.
for (const script of ['scripts/apply-standalone-public-overrides.mjs', 'scripts/apply-reviewed-public-assets.mjs', 'scripts/apply-standalone-public-overrides.mjs', 'scripts/verify-railway-release-assets.mjs']) {
  const result = spawnSync(process.execPath, [script], {stdio: 'inherit'});
  if (result.status !== 0) throw Error('Final release verification failed');
}
console.log(`Restored and verified ${plan.expectedAssetCount} current release assets.`);
