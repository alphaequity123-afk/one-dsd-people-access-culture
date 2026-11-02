/* Standalone curriculum controls. No network requests, dependencies or telemetry. */
(() => {
  'use strict';
  const key = 'one-dsd-clas-offline-v1';
  let saved = { notes: {}, completed: [] };
  try { saved = { ...saved, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { /* Working memory remains available. */ }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(saved)); return true; } catch { return false; }
  }
  const seconds = stamp => stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  function cues(text) {
    return text.replace(/\r/g, '').split(/\n\s*\n/).flatMap(block => {
      const lines = block.split('\n');
      const index = lines.findIndex(line => line.includes(' --> '));
      if (index < 0) return [];
      const [start, end] = lines[index].split(' --> ');
      return [{ start: seconds(start), end: seconds(end.split(' ')[0]), text: lines.slice(index + 1).join(' ').replace(/<[^>]*>/g, '') }];
    });
  }
  document.querySelectorAll('[data-player]').forEach(player => {
    const media = player.querySelector('video,audio');
    const text = JSON.parse(player.querySelector('[data-captions]').textContent);
    const transcript = cues(text);
    const caption = player.querySelector('[data-current-caption]');
    const toggle = player.querySelector('[data-toggle]');
    const track = media.querySelector('track');
    if (track) {
      track.src = URL.createObjectURL(new Blob([text], { type: 'text/vtt' }));
    }
    toggle.addEventListener('click', async () => {
      if (!media.paused) { media.pause(); return; }
      try { await media.play(); } catch { caption.textContent = 'Playback could not start. Extract the whole ZIP and keep its folders together, then use the direct media link below.'; }
    });
    media.addEventListener('play', () => {
      document.querySelectorAll('video,audio').forEach(other => { if (other !== media) other.pause(); });
      toggle.textContent = 'Pause';
    });
    media.addEventListener('pause', () => { toggle.textContent = 'Play'; });
    media.addEventListener('ended', () => { toggle.textContent = 'Play'; });
    media.addEventListener('timeupdate', () => {
      const cue = transcript.find(c => media.currentTime >= c.start && media.currentTime < c.end);
      caption.textContent = cue?.text || '';
    });
    player.querySelector('[data-speed]').addEventListener('change', event => { media.playbackRate = Number(event.target.value); });
    const list = player.querySelector('[data-transcript]');
    transcript.forEach(cue => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${Math.floor(cue.start / 60)}:${String(Math.floor(cue.start % 60)).padStart(2, '0')} — ${cue.text}`;
      button.addEventListener('click', () => { media.currentTime = cue.start; caption.textContent = cue.text; });
      list.append(button);
    });
  });
  document.querySelectorAll('[data-question]').forEach(question => {
    question.addEventListener('change', event => {
      if (event.target.matches('input[type=radio]')) question.querySelector('[role=status]').textContent = event.target.dataset.feedback;
    });
  });
  document.querySelectorAll('[data-ordering]').forEach(activity => {
    activity.querySelector('button').addEventListener('click', () => {
      const actual = [...activity.querySelectorAll('select')].map(select => select.value);
      const expected = JSON.parse(activity.dataset.ordering).map(String);
      const match = actual.every((value, index) => value === expected[index]);
      activity.querySelector('[role=status]').textContent = (match ? 'That matches the suggested sequence. ' : 'Compare your sequence with the suggested order below. ') + activity.dataset.feedback;
      activity.querySelector('details').open = true;
    });
  });
  document.querySelectorAll('[data-note]').forEach(note => {
    note.value = saved.notes[note.dataset.note] || '';
    note.addEventListener('input', () => {
      saved.notes[note.dataset.note] = note.value;
      note.closest('[data-view]').querySelector('[data-save-status]').textContent = persist() ? 'Saved in this browser. Download a copy to keep or move your notes.' : 'Available for this visit. Download your notes before leaving this page.';
    });
  });
  document.querySelectorAll('[data-complete]').forEach(button => {
    const id = button.dataset.complete;
    const update = () => { button.textContent = saved.completed.includes(id) ? 'Marked complete' : 'Mark lesson complete'; };
    update();
    button.addEventListener('click', () => {
      saved.completed = [...new Set([...saved.completed, id])];
      const stored = persist(); update();
      button.closest('[data-view]').querySelector('[data-save-status]').textContent = stored ? 'Completion saved in this browser.' : 'Marked complete for this visit.';
    });
  });
  document.querySelectorAll('[data-download-notes]').forEach(button => button.addEventListener('click', () => {
    const text = 'CLAS — MY WORKING NOTES AND PLAN\n\n' + Object.entries(saved.notes).map(([id, note]) => `${id}\n${note || '(Blank)'}\n`).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'CLAS-my-working-notes.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
  const progress = document.querySelector('[data-progress]');
  if (progress) progress.textContent = `${saved.completed.length} of 9 lessons marked complete in this browser.`;
  function showView() {
    const requested = location.hash.slice(1) || 'home';
    const views = [...document.querySelectorAll('[data-view]')];
    const selected = views.find(view => view.dataset.view === requested) || views.find(view => view.dataset.view === 'home');
    if (!selected) return;
    views.forEach(view => { view.hidden = view !== selected; });
    document.querySelectorAll('video,audio').forEach(media => media.pause());
    if (progress) progress.textContent = `${saved.completed.length} of 9 lessons marked complete in this browser.`;
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', showView);
  showView();
})();
