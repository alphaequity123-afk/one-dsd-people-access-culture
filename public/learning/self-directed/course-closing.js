/* "Put this course to work" (owner decision 2026-11-22): a closing step on each self-directed course's last page, built
   from the course's own outcomes. Nothing chosen or typed is kept. Loaded by standalone-shell.js because the course
   page's own files ship from the release asset bucket. */
(() => {
  if (window.__courseClosing) return; window.__courseClosing = true;
  const explanation = document.getElementById('narration')?.closest('details');
  if (!explanation) return;
  const element = (tag, value) => { const node = document.createElement(tag); node.textContent = value; return node; };
  // Closing step on the last page (owner decision 2026-11-22): choose an outcome to use first and shape a plan.
  const closing = document.createElement('section');
  closing.id = 'course-closing';
  closing.hidden = true;
  closing.style.cssText = 'margin:20px 0;padding:22px 24px;background:#fff;border:1px solid #d6dee6;border-top:3px solid #003865;border-radius:16px;box-shadow:0 1px 2px rgba(11,42,74,.06),0 10px 24px -14px rgba(11,42,74,.22)';
  (document.getElementById('course-written-practice') || explanation).after(closing);
  // A warmer note under the written practice box.
  function warmNote() {
    for (const p of document.querySelectorAll('#course-written-practice p')) {
      if (/Nothing is submitted/.test(p.textContent)) p.textContent = 'Download your response if you would like to keep it.';
    }
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
    const plan = document.createElement('textarea'); plan.id = planLabel.htmlFor; plan.rows = 4;
    plan.style.cssText = 'display:block;margin:8px 0 12px;width:100%;font:inherit;padding:12px;border:1px solid #b9c7d5;border-radius:10px';
    const copy = element('button', 'Copy my plan'); copy.type = 'button'; copy.className = 'button'; copy.style.cssText = 'padding:10px 18px;background:#003865;color:#fff;border:0;border-radius:8px;font:inherit;font-weight:600;cursor:pointer';
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
  document.addEventListener('course-rendered', event => { showClosing(event.detail.course, event.detail.page); warmNote(); });
  try { if (typeof courses !== 'undefined' && courses[selected]?.slides) { showClosing(courses[selected], courses[selected].slides.find(s => s.number === current)); warmNote(); } } catch {}
})();
