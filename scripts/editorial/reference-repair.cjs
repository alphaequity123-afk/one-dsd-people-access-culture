/** Only independently accepted, exact source-reference repairs may bypass link protection. */
function isAcceptedReferenceRepair(row, change) {
  const p = change.path;
  if (p.length !== 4 || p[0] !== 'pack' || p[1] !== 'sources' || !Number.isInteger(p[2]) || p[2] < 0 || !['href', 'title'].includes(p[3])) return false;
  if (p[3] === 'title' && (typeof change.after !== 'string' || !change.after.trim() || /[<>]/.test(change.after))) return false;
  if (p[3] === 'href') {
  let url;
  try { url = new URL(change.after); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.') || /^(localhost|127\.|0\.|169\.254\.|10\.|192\.168\.)/i.test(url.hostname)) return false;
  }
  return Array.isArray(row.referenceRepairs) && row.referenceRepairs.some(repair =>
    JSON.stringify(repair.path) === JSON.stringify(p.slice(1)) && repair.before === change.before && repair.after === change.after &&
    repair.review?.status === 'accepted' && typeof repair.review.evidence === 'string' && repair.review.evidence.trim().length > 0 &&
    typeof repair.review.reviewer === 'string' && repair.review.reviewer.trim().length > 0);
}
module.exports = { isAcceptedReferenceRepair };
