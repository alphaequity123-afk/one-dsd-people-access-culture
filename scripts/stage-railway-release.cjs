const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ignore = require('ignore');
const root = path.resolve(__dirname, '..');
const destination = path.resolve(root, '../one-dsd-railway-release-20261004');
if (fs.existsSync(destination)) throw new Error('Release directory already exists; inspect before replacing.');
const exclusions = ignore().add(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'));
const roots = ['app','components','config','data','lib','models','public','types'];
const files = ['package.json','package-lock.json','next.config.ts','tsconfig.json','postcss.config.mjs','proxy.ts','.npmrc','.node-version','.nvmrc','next-env.d.ts','.railwayignore','scripts/hydrate-railway-assets.mjs','scripts/verify-clone-agent-pilot.mjs','evidence/local-audit-2026-09-07/owner-content-approval.json'];
const entries=[];
function copy(relative) {
  if (exclusions.ignores(relative) && relative !== 'next-env.d.ts') return;
  const source=path.join(root,relative);
  const stat=fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error('Unexpected symbolic link in release: '+relative);
  if (stat.isDirectory()) {
    for(const name of fs.readdirSync(source)) copy(relative+'/'+name);
    return;
  }
  if (/(^|\/)(\.env(?:\.|$)|local-resolver\.local\.json$)|\.(?:pem|key|log)$/i.test(relative)) throw new Error('Private/local file in release: '+relative);
  const bytes=fs.readFileSync(source);
  fs.mkdirSync(path.dirname(path.join(destination,relative)),{recursive:true});
  fs.writeFileSync(path.join(destination,relative),bytes);
  entries.push({path:relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const name of [...roots,...files]) copy(name);
const receipt={source:root,destination,createdAt:new Date().toISOString(),fileCount:entries.length,bytes:entries.reduce((s,e)=>s+e.bytes,0),entries};
fs.mkdirSync(path.join(root,'evidence/railway-release-20261004'),{recursive:true});
fs.writeFileSync(path.join(root,'evidence/railway-release-20261004/stage-manifest.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({destination,fileCount:receipt.fileCount,bytes:receipt.bytes}));


