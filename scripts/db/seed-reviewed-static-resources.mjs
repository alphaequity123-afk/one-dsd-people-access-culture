// Compatibility entry point for exact resource-only imports.
// The setup adapter inserts provenance correctly rather than updating immutable history.
// See docs/ONE-DSD-PERSISTENT-EDITING.md for installation and removal of that adapter.
process.argv.push('--resources-only');
await import('./seed-dsd-reviewed-baselines.mjs');
