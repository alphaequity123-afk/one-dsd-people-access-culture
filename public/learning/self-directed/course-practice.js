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
  // Closing step on the last page (owner decision 2026-11-22): choose an outcome to use first and shape a plan.
  const closing = document.createElement('section');
  closing.id = 'course-closing';
  closing.hidden = true;
  closing.style.cssText = 'margin:20px 0;padding:22px 24px;background:#fff;border:1px solid #d6dee6;border-top:3px solid #003865;border-radius:16px;box-shadow:0 1px 2px rgba(11,42,74,.06),0 10px 24px -14px rgba(11,42,74,.22)';
  explanation.after(records, practice, closing);
  const drafts = new Map();
  const element = (tag, value) => {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  };
  function show({course, page}) {
    records.replaceChildren(); practice.replaceChildren();
    records.hidden = true; practice.hidden = true;
    showClosing(course, page);
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
    practice.append(label, response, element('p', 'Download your response if you would like to keep it.'));
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
  function showClosing(course, page) {
    closing.replaceChildren(); closing.hidden = true;
    const visible = (course.slides || []).filter(s => !s.hidden);
    if (!Array.isArray(course.outcomes) || !course.outcomes.length || page.hidden || visible[visible.length - 1]?.number !== page.number) return;
    const name = 'course-closing-' + course.number;
    const kicker = element('p', 'Before you go'); kicker.style.cssText = 'margin:0 0 4px;font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#3f7a0e';
    const heading = element('h2', 'Put this course to work'); heading.style.margin = '0 0 8px';
    const intro = element('p', 'Which of these could you do now? Choose the one you would like to use first.');
    const list = document.createElement('div'); list.setAttribute('role', 'radiogroup'); list.setAttribute('aria-label', 'What you can do now');
    list.style.cssText = 'display:grid;gap:8px;margin:12px 0';
    const planBox = document.createElement('div'); planBox.hidden = true; planBox.setAttribute('aria-live', 'polite');
    const planLabel = element('label', 'Make it your own, then copy it into your calendar or notes.'); planLabel.htmlFor = name + '-plan';
    const plan = document.createElement('textarea'); plan.id = planLabel.htmlFor; plan.rows = 3;
    plan.style.cssText = 'display:block;margin:8px 0 12px;width:100%;font:inherit;padding:12px;border:1px solid #b9c7d5;border-radius:10px';
    const copy = element('button', 'Copy my plan'); copy.type = 'button'; copy.className = 'button';
    const note = element('p', ''); note.setAttribute('role', 'status');
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(plan.value); note.textContent = 'Copied. Keep it somewhere you will see it this week.'; }
      catch { note.textContent = 'You can select the text and copy it instead.'; }
    });
    const talk = element('p', 'Talk it over: share one idea from this course with a colleague this week, and ask how it shows up in their work.');
    talk.style.cssText = 'margin:14px 0 0;padding-top:12px;border-top:1px solid #e3e9ef;color:#3b4048';
    planBox.append(element('h3', 'Your plan for this week'), planLabel, plan, copy, note, talk);
    course.outcomes.forEach((outcome, i) => {
      const label = document.createElement('label');
      label.style.cssText = 'display:flex;gap:10px;align-items:flex-start;padding:11px 14px;border:1px solid #cdd9e5;border-radius:12px;cursor:pointer;line-height:1.5;background:#fff;font-weight:400';
      const input = document.createElement('input'); input.type = 'radio'; input.name = name; input.value = String(i);
      input.style.cssText = 'margin-top:.3rem;accent-color:#003865;flex:none';
      input.addEventListener('change', () => {
        for (const other of list.querySelectorAll('label')) { other.style.borderColor = '#cdd9e5'; other.style.background = '#fff'; }
        label.style.borderColor = '#003865'; label.style.background = '#f5f8fc';
        const action = outcome.trim().replace(/\.$/, '');
        plan.value = 'This week, I will ' + action.charAt(0).toLowerCase() + action.slice(1) + ', using a decision or conversation from my own work.';
        note.textContent = ''; planBox.hidden = false;
      });
      label.append(input, element('span', outcome));
      list.append(label);
    });
    closing.append(kicker, heading, intro, list, planBox);
    closing.hidden = false;
  }
  document.addEventListener('course-rendered', event => show(event.detail));
  if (typeof courses !== 'undefined' && courses[selected]?.slides) show({course:courses[selected],page:courses[selected].slides.find(s=>s.number===current)});
})();
