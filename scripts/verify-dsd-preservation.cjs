const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const source = path.resolve('../pac-clarity-release-20260928');
const folders = ['data', 'lib/content', 'public'];
const receipt = { source, checked: 0, missing: [], changed: [], byFolder: {} };
function walk(folder) {
  for (const entry of fs.readdirSync(path.join(source, folder), {withFileTypes:true})) {
    const relative = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (entry.isFile()) {
      const original = path.join(source, relative), copy = path.resolve(relative);
      receipt.checked++;
      const group = folders.find(f=>relative.replaceAll('\\','/').startsWith(f));
      receipt.byFolder[group] = (receipt.byFolder[group] || 0) + 1;
      if (!fs.existsSync(copy)) receipt.missing.push(relative);
      else {
        const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
        if (hash(original) !== hash(copy)) receipt.changed.push(relative);
      }
    }
  }
}
folders.forEach(walk);
fs.writeFileSync('evidence/dsd-logic-model/source-preservation.json', JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt,null,2));
