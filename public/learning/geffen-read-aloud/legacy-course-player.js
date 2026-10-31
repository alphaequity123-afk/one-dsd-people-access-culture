/* Optional Geffen reading for self-directed teaching pages. No narration is synthesized in the browser. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.OneDsdLegacyReadAloud = api;
    const player = api.mountPlayer(root.document, { fetch: root.fetch.bind(root), crypto: root.crypto });
    if (player) {
      root.document.addEventListener('course-rendered', event => { void player.show(event.detail); });
      if (typeof courses !== 'undefined' && typeof selected !== 'undefined' && typeof current !== 'undefined' && courses[selected]?.slides) {
        void player.show({ course: courses[selected], page: courses[selected].slides.find(page => page.number === current) });
      }
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const plain = value => String(value || '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  function pageSections(course, page) {
    if (!course || !page || !/^[A-Z]\d{2}$/.test(course.number) || !Number.isSafeInteger(page.number) || page.number < 1 || page.hidden || (page.links || []).some(link => /^Answer\b/i.test(link.name || ''))) return [];
    const prefix = `course/self-directed-${course.number}/page/${page.number}`;
    const text = plain(page.text), explanation = plain(page.narration);
    const heading = text.split('\n')[0];
    const result = [];
    if (text) result.push({ id: `${prefix}/text`, title: heading && heading.length <= 100 ? heading : 'On this page', text, readPurpose: 'teachable' });
    if (explanation && explanation !== text) result.push({ id: `${prefix}/explanation`, title: 'A closer look', text: explanation, readPurpose: 'teachable' });
    const alternatives = [];
    for (const section of result) {
      const lines = Array.from(section.text.matchAll(/[^\n]+/g));
      lines.forEach((line, index) => {
        const paragraph = line[0], words = paragraph.match(/\b[\w]+(?:[’'-][\w]+)*/g) || [], previous = lines[index - 1];
        const hasLabel = previous && previous[0] !== section.title && !/[.!?]/.test(previous[0]) && previous[0].split(/\s+/).length <= 10;
        const text = hasLabel ? section.text.slice(previous.index, line.index + paragraph.length) : paragraph;
        const count = (text.match(/\b[\w]+(?:[’'-][\w]+)*/g) || []).length;
        if (paragraph === section.title || text === section.text || !/[.!?]/.test(paragraph) || words.length < (hasLabel ? 15 : 25) || count > 90) return;
        alternatives.push({ id: `${section.id}/moment-${index + 1}`, title: hasLabel ? previous[0] : paragraph.split(/[.!?]/)[0].length <= 85 ? paragraph.split(/[.!?]/)[0] : paragraph.split(/\s+/).slice(0, 10).join(' ') + '…', text, readPurpose: section.readPurpose, shortAlternative: true, parentId: section.id });
      });
    }
    return [...result, ...alternatives];
  }
  async function textHash(text, crypto) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function validRecording(item, section, sourceTextHash, parentSourceTextHash) {
    return item && item.id === section.id && item.voice === 'geffen' && item.verified === true && item.sourceTextHash === sourceTextHash && (!section.shortAlternative || (parentSourceTextHash && item.parentSourceTextHash === parentSourceTextHash)) && /^[a-f0-9]{64}$/.test(item.audioSha256) && /^\/audio\/geffen-read-aloud\/[a-zA-Z0-9._/-]+\.(mp3|wav)$/.test(item.src) && !item.src.split('/').includes('..');
  }
  function mountPlayer(document, dependencies) {
    const anchor = document.getElementById('narration')?.closest('details');
    if (!anchor) return null;
    const element = (name, text) => { const node = document.createElement(name); if (text) node.textContent = text; return node; };
    const panel = element('aside'); panel.hidden = true; panel.id = 'geffen-page-reading'; panel.setAttribute('aria-label', 'Listen to the learning page');
    panel.style.cssText = 'margin:20px 0;padding:20px;background:#fff;border-left:4px solid #78be21;color:#163549';
    const heading = element('h2'), intro = element('p', 'Listen at your own pace, or return to the text whenever you like.');
    const full = element('button', 'Listen through the page'); full.type = 'button';
    const scope = element('p', 'Includes the page text and learning explanation. Activities and response feedback stay separate.');
    const label = element('label', 'Choose a passage'); label.htmlFor = 'geffen-page-passage';
    const select = element('select'); select.id = label.htmlFor; select.style.cssText = 'display:block;width:100%;margin:8px 0 14px';
    const passageTitle = element('p'); passageTitle.style.fontWeight = 'bold';
    const audio = element('audio'); audio.controls = true; audio.preload = 'none'; audio.style.cssText = 'width:100%;display:block;margin:14px 0';
    const status = element('p'); status.setAttribute('role', 'status');
    panel.append(heading, intro, full, scope, label, select, passageTitle, audio, status); anchor.after(panel);
    let revision = 0, ready = [], fullReady = [], at = 0, continuous = false;
    const pause = () => { try { audio.pause(); } catch {} };
    const setSection = index => { at = index; select.value = ready[at].id; audio.src = ready[at].src; audio.setAttribute('aria-label', `Listen: ${ready[at].title}`); passageTitle.textContent = ready[at].title; status.textContent = ''; };
    const requestPlay = () => { const result = audio.play(); if (result?.catch) result.catch(() => { status.textContent = 'Use the play control when you are ready to listen.'; }); };
    select.addEventListener('change', () => { pause(); continuous = false; setSection(ready.findIndex(section => section.id === select.value)); });
    full.addEventListener('click', () => { if (!ready.length || full.hidden) return; pause(); continuous = true; setSection(ready.findIndex(section => section.id === fullReady[0].id)); requestPlay(); });
    audio.addEventListener('play', () => document.querySelectorAll('audio,video').forEach(other => { if (other !== audio) other.pause(); }));
    audio.addEventListener('ended', () => { if (!continuous) return; const next = fullReady[fullReady.findIndex(section => section.id === ready[at].id) + 1]; if (next) { setSection(ready.findIndex(section => section.id === next.id)); requestPlay(); } else continuous = false; });
    audio.addEventListener('error', () => { continuous = false; status.textContent = 'This recording could not be played. You can continue with the text.'; });
    async function show(detail) {
      const request = ++revision; pause(); continuous = false; ready = []; fullReady = []; panel.hidden = true; select.replaceChildren(); status.textContent = ''; audio.removeAttribute('src');
      const sections = pageSections(detail?.course, detail?.page);
      if (!sections.length || !dependencies.crypto?.subtle) return;
      try {
        const response = await dependencies.fetch(`/learning/geffen-read-aloud/courses/self-directed-${detail.course.number}.json`);
        if (!response.ok) return;
        const index = await response.json();
        if (index.format !== 'geffen-course-read-aloud-v1' || !Array.isArray(index.recordings)) return;
        const matches = [];
        for (const section of sections) {
          const digest = await textHash(section.text, dependencies.crypto);
          const parent = section.parentId ? sections.find(item => item.id === section.parentId) : null;
          const parentDigest = parent ? await textHash(parent.text, dependencies.crypto) : undefined;
          const clip = index.recordings.find(item => validRecording(item, section, digest, parentDigest));
          if (clip) matches.push({ ...section, src: clip.src });
        }
        if (request !== revision || !matches.length) return;
        ready = matches; fullReady = matches.filter(section => !section.shortAlternative); const complete = fullReady.length === sections.filter(section => !section.shortAlternative).length;
        heading.textContent = complete ? 'Listen to this page' : 'Listen to a passage'; full.hidden = !complete; scope.hidden = !complete;
        for (const section of ready) { const option = element('option', section.title); option.value = section.id; select.append(option); }
        label.hidden = select.hidden = ready.length < 2; passageTitle.hidden = ready.length > 1;
        setSection(0); panel.hidden = false;
      } catch { /* Reading text remains available if a recording or connection is unavailable. */ }
    }
    return { show, destroy() { revision++; pause(); panel.remove(); } };
  }
  return { plain, pageSections, textHash, validRecording, mountPlayer };
});
