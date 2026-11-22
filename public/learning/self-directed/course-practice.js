(() => {
  const explanation = document.getElementById('narration')?.closest('details');
  if (!explanation) return;
  const records = document.createElement('section');
  records.id = 'course-public-records';
  const practice = document.createElement('section');
  practice.id = 'course-written-practice';
  for (const section of [records, practice]) {
    section.hidden = true;
    section.style.cssText = 'margin:20px 0;padding:20px;background:white;border-left:4px solid #78be21';
  }
  explanation.after(records, practice);
  const drafts = new Map();
  const element = (tag, value) => {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  };
  function show({course, page}) {
    records.replaceChildren(); practice.replaceChildren();
    records.hidden = true; practice.hidden = true;
    if (page.sourceReferences?.length) {
      records.append(element('h2', 'Read the public record'));
      for (const source of page.sourceReferences) {
        let url;
        try { url = new URL(source.url); } catch { continue; }
        if (url.protocol !== 'https:') continue;
        const p = document.createElement('p');
        const a = element('a', source.title);
        a.href = url.href; a.target = '_blank'; a.rel = 'noopener';
        p.append(a, document.createElement('br'), document.createTextNode(source.location || ''));
        records.append(p);
      }
      records.hidden = false;
    }
    if (!page.writtenActivity) return;
    const key = course.number + ':' + page.number;
    practice.append(element('h2', 'Try it in writing'));
    const label = element('label', page.writtenActivity.prompt);
    label.htmlFor = 'course-practice-response';
    const response = document.createElement('textarea');
    response.id = label.htmlFor; response.rows = 7;
    response.style.cssText = 'display:block;margin:12px 0;width:100%;font:inherit;padding:12px;border:1px solid #526b79;border-radius:4px';
    response.value = drafts.get(key) || '';
    response.addEventListener('input', () => drafts.set(key, response.value));
    practice.append(label, response, element('p', 'Your response stays in this tab until you reload or close it. Download it if you would like to keep it. Nothing is submitted.'));
    const download = element('button', 'Download my response'); download.type = 'button';
    download.addEventListener('click', () => {
      const content = course.title + '\n\n' + page.writtenActivity.prompt + '\n\n' + response.value;
      const url = URL.createObjectURL(new Blob([content], {type:'text/plain;charset=utf-8'}));
      const a = document.createElement('a'); a.href = url; a.download = course.number + '-practice-' + page.number + '.txt';
      a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const feedback = document.createElement('details');
    feedback.append(element('summary', 'Compare your reasoning'), element('p', page.writtenActivity.feedback));
    practice.append(download, feedback);
    practice.hidden = false;
  }
  document.addEventListener('course-rendered', event => show(event.detail));
  if (typeof courses !== 'undefined' && courses[selected]?.slides) show({course:courses[selected],page:courses[selected].slides.find(s=>s.number===current)});
})();

// Owner decision 2026-11-21: the series is named Practice for the Moments That Matter.
// index.html is a fingerprinted accessibility artifact (config/accessible-static-assets), so the name is set here.
(function(){function rename(){var h=document.querySelector('main h1');if(h&&h.textContent.trim()==='Self-directed learning')h.textContent='Practice for the Moments That Matter';if(/^Self-Directed Learning \|/.test(document.title))document.title=document.title.replace(/^Self-Directed Learning/,'Practice for the Moments That Matter');}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rename);else rename();})();
