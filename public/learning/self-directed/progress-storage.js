/* Browser-local course places only. No submission, score or official record. */
(function (root) {
  'use strict';
  const prefix = 'one-dsd-learning-';
  const validId = id => /^[FIA](?:0[1-9]|1[0-9]|2[0-4])$/.test(id);
  const validPlace = value => value && Number.isInteger(value.page) && value.page > 0;
  function read(storage, id) {
    if (!validId(id)) return { ok: false, reason: 'invalid' };
    try {
      const raw = storage.getItem(prefix + id);
      if (raw === null) return { ok: true, place: null };
      const place = JSON.parse(raw);
      return validPlace(place) ? { ok: true, place } : { ok: false, reason: 'unreadable' };
    } catch { return { ok: false, reason: 'unreadable' }; }
  }
  function save(storage, id, page) {
    if (!validId(id) || !Number.isInteger(page) || page < 1) return { ok: false, reason: 'invalid' };
    const previous = read(storage, id);
    if (!previous.ok) return previous; // Do not overwrite a place we cannot read.
    try {
      storage.setItem(prefix + id, JSON.stringify({ page, visitedAt: new Date().toISOString() }));
      return { ok: true };
    } catch { return { ok: false, reason: 'write' }; }
  }
  function clear(storage, ids) {
    const failed = [];
    for (const id of ids) {
      if (!validId(id)) { failed.push(id); continue; }
      try {
        storage.removeItem(prefix + id);
        if (storage.getItem(prefix + id) !== null) failed.push(id);
      } catch { failed.push(id); }
    }
    return { ok: failed.length === 0, failed };
  }
  root.OneDsdCourseProgress = Object.freeze({ read, save, clear });
})(globalThis);
