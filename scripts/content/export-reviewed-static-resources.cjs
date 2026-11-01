#!/usr/bin/env node

// Read-only export of the exact application definitions approved for publication.
// This helper never rewrites an applied migration or stores credentials.
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");
const projectRoot = path.resolve(__dirname, "../..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, isMain, options) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(projectRoot, request.slice(2)) : request, parent, isMain, options);
};
require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(compiled.outputText, filename);
};

const { staffCorpus } = require(path.join(projectRoot,"lib/content/staff-corpus.ts"));
const { ReleaseResourcePayloadSchema, staffReleaseValidationIssues } = require(path.join(projectRoot,"lib/content/resource-release-contract.ts"));
const items = staffCorpus();
if(new Set(items.map(item=>item.id)).size!==items.length) throw new Error("Duplicate reviewed resource IDs.");
for(const item of items) {
 if(!ReleaseResourcePayloadSchema.safeParse(item).success || staffReleaseValidationIssues(item).length) throw new Error(`Invalid reviewed resource: ${item.id}`);
}
process.stdout.write(JSON.stringify({items}));