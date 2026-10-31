// A release may reuse immutable base archives and replace only named assets.
export function validateTransportPlan(transport, release) {
  if (transport.format !== 'one-dhs-current-transport-v1') throw Error('Unsupported current transport');
  if (release.format !== 'one-dhs-release-assets-v1') throw Error('Unsupported release manifest');
  const safe = value => typeof value === 'string' && value.length > 0 &&
    !value.startsWith('/') && !value.includes('\\') && !value.includes(':') &&
    value.split('/').every(part => part && part !== '.' && part !== '..') &&
    (value.startsWith('public/') || value === 'models/bge-small-en-v1.5/onnx/model_quantized.onnx');
  const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  if (!Array.isArray(release.assets)) throw Error('Missing release assets');
  const expected = new Set();
  for (const asset of release.assets) {
    if (!safe(asset.path) || expected.has(asset.path) || !Number.isSafeInteger(asset.bytes) || asset.bytes < 0 || !digest(asset.sha256)) throw Error('Invalid release asset');
    expected.add(asset.path);
  }
  const keys = new Set();
  const approvedPackageKey = key => typeof key === 'string' &&
    (/^one-dhs-unified\/20261011\/[A-Za-z0-9._-]+\.tar\.gz$/.test(key) ||
     /^one-dhs-unified\/20261016\/assets-one-(?:dsd|dhs)-guide-[a-f0-9]{16}\.tar\.gz$/.test(key) ||
     /^one-dsd\/20261025\/assets-[a-f0-9]{64}\.tar\.gz$/.test(key));
  const validatePackages = items => {
    if (!Array.isArray(items)) throw Error('Missing release packages');
    const files = new Set();
    for (const item of items) {
      if (!approvedPackageKey(item.key) || keys.has(item.key) || !digest(item.sha256) || !Number.isSafeInteger(item.bytes) || item.bytes <= 0 || !Array.isArray(item.files) || item.files.length === 0) throw Error('Invalid release package');
      keys.add(item.key);
      for (const file of item.files) {
        if (!safe(file) || !expected.has(file) || files.has(file)) throw Error('Invalid or duplicate package coverage');
        files.add(file);
      }
    }
    return files;
  };
  const base = validatePackages(transport.packages);
  const overlayPackages = transport.overlayPackages ?? [];
  const overlay = validatePackages(overlayPackages);
  const overlayPaths = transport.overlayPaths ?? [];
  if (!Array.isArray(overlayPaths) || overlayPaths.length !== new Set(overlayPaths).size || overlayPaths.length !== overlay.size || overlayPaths.some(file => !safe(file) || !overlay.has(file))) throw Error('Overlay coverage differs from explicit paths');
  // New assets may travel with the source archive instead of a remote package.
  // They still receive the same final byte-count and SHA-256 verification.
  const bundledPaths = transport.bundledPaths ?? [];
  if (!Array.isArray(bundledPaths) || new Set(bundledPaths).size !== bundledPaths.length ||
      bundledPaths.some(file => !safe(file) || !expected.has(file) || base.has(file) || overlay.has(file))) {
    throw Error('Invalid bundled asset coverage');
  }
  const coverage = new Set([...base, ...overlay, ...bundledPaths]);
  if (coverage.size !== expected.size || [...expected].some(file => !coverage.has(file))) throw Error('Transport coverage differs from current release');
  return {basePackages: transport.packages, overlayPackages, expectedAssetCount: expected.size, baseAssetCount: base.size, overlayAssetCount: overlay.size};
}
