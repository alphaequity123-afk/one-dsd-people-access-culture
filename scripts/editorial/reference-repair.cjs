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
/** The already-reviewed Somali course diagram replacement is an exact exception, not general media editing. */
function isAcceptedAssetRepair(row, change) {
  const expected = ['pack', 'course', 'lessons', 2, 'blocks', 0, 'src'];
  return row.courseId === 'somali-minnesota-brief'
    && JSON.stringify(change.path) === JSON.stringify(expected)
    && change.before === '/images/course-sm/iceberg.png'
    && change.after === '/images/course-sm/observation-inquiry-service.svg'
    && Array.isArray(row.assetRepairs) && row.assetRepairs.some(repair =>
      repair.courseId === row.courseId && repair.kind === 'illustrative-image'
      && JSON.stringify(repair.path) === JSON.stringify(expected.slice(1))
      && repair.before === change.before && repair.after === change.after
      && repair.sha256 === 'f6389222fb177b833e9aa340b3081cd0b9111ce3ff54544e7e528567ebff831d'
      && repair.review?.status === 'accepted' && repair.review.reviewer && repair.review.evidence);
}
module.exports = { isAcceptedReferenceRepair, isAcceptedAssetRepair };
