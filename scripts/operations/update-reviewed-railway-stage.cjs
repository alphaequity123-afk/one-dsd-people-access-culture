const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ignore=require('ignore');
const root=path.resolve(__dirname,'../..');
const destination=path.resolve(root,'../one-dsd-railway-release-20261004');
const manifestPath=path.join(root,'evidence/railway-release-20261004/stage-manifest.json');
if (!destination.startsWith(path.dirname(root)+path.sep) || !fs.existsSync(path.join(destination,'package.json')) || !fs.existsSync(manifestPath)) throw Error('Reviewed release staging directory or its manifest is missing');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if (path.resolve(manifest.source)!==root || path.resolve(manifest.destination)!==destination) throw Error('Staging manifest does not match the current checkout and destination');
if (fs.existsSync(path.join(destination,'railway.json')) || fs.existsSync(path.join(destination,'railway.toml'))) throw Error('Stale Railway configuration remains in the stage; create a clean stage before proceeding');
const exclusions=ignore().add(fs.readFileSync(path.join(root,'.gitignore'),'utf8')).add(fs.readFileSync(path.join(root,'.railwayignore'),'utf8'));
const entries=[];
function copy(relative) {
  if(exclusions.ignores(relative))return;
  const source=path.join(root,relative),stat=fs.lstatSync(source);
  if(stat.isSymbolicLink())throw Error('Unexpected link');
  if(stat.isDirectory()){for(const name of fs.readdirSync(source))copy(relative+'/'+name);return;}
  if(/(^|\/)(\.env(?:\.|$)|local-resolver\.local\.json$)|\.(?:pem|key|log)$/i.test(relative))throw Error('Private file');
  const bytes=fs.readFileSync(source),target=path.join(destination,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  entries.push({path:relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const name of ['app','components','config','data','lib','models','public','types','package.json','package-lock.json','next.config.ts','tsconfig.json','postcss.config.mjs','proxy.ts','scripts/hydrate-railway-assets.mjs','scripts/verify-clone-agent-pilot.mjs'])copy(name);
fs.writeFileSync('evidence/railway-release-20261004/activation-course-stage.json',JSON.stringify({createdAt:new Date().toISOString(),entries},null,2));
console.log(JSON.stringify({reviewedStageUpdated:true,fileCount:entries.length}));
