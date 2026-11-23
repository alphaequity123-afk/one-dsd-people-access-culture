/* Owner decision 2026-11-22: no system notices on staff pages. The course page ships as a release asset, so the browser-saving notice is removed here; the Save and My work links stay. */
(() => {
  const note = [...document.querySelectorAll('p')].find(el => el.firstChild && el.firstChild.nodeType === 3 && /When browser saving is available/.test(el.firstChild.textContent));
  if (note) note.firstChild.textContent = '';
})();
/* Owner decision 2026-11-22: the line under the menu is DHS green, matching the logo. The course chrome CSS ships as a release asset, so the color is set here. */
(() => {
  const style = document.createElement('style');
  style.textContent = '.dsd-header{border-bottom-color:#78BE21!important}';
  document.head.appendChild(style);
})();
/* Portable pages use the same hosted Ask and Search tools as the rest of One DSD. */
(() => {
  if (location.protocol === 'file:') return;
  void fetch('/source-link-map.json').then(response => response.ok ? response.json() : null).then(map => {
    if (!map) return;
    const unavailable = new Set(map.unavailable);
    function update(root) {
      const links = [...(root.querySelectorAll?.('a[href]') || [])];
      if (root.matches?.('a[href]')) links.unshift(root);
      for (const link of links) {
        if (link.hasAttribute('data-original')) continue;
        let url; try { url = new URL(link.href); } catch { continue; }
        if (!/^https?:$/.test(url.protocol) || url.origin === location.origin) continue;
        const fragment = url.hash; url.hash = '';
        let key = url.href.replace(/\/$/, '');
        const replacement = map.redirects?.[key];
        if (replacement && !map.links[key]) {
          link.href = replacement + fragment;
          key = new URL(replacement).href.replace(/\/$/, '');
        }
        if (map.links[key]) {
          let anchor = fragment.slice(1);
          try { anchor = decodeURIComponent(anchor); } catch { /* Keep publisher fragment. */ }
          const section = map.anchors?.[map.links[key]]?.[anchor];
          if (fragment && !section) continue;
          link.href = map.links[key] + (section ? '?section=' + section : '') + fragment;
          link.removeAttribute('target');
        }
        else if (unavailable.has(key)) {
          const text = document.createElement('span');
          text.className = link.className;
          if (link.id) text.id = link.id;
          text.append(...link.childNodes); link.replaceWith(text);
        }
      }
    }
    update(document);
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === 1) update(node); }))).observe(document.body, {childList:true,subtree:true});
  }).catch(() => { /* Existing links remain usable if the shared map cannot be loaded. */ });
})();
(() => {
  const header = document.querySelector('.dsd-header');
  if (!header) return;
  const menu = header.querySelector('#dsd-menu');
  const nav = header.querySelector('#dsd-navigation');
  const buttons = [...header.querySelectorAll('[data-tool]')];
  const panels = [...header.querySelectorAll('[data-tool-panel]')];
  let active = null;
  function close() {
    const previous = active;
    active = null;
    panels.forEach(panel => { panel.hidden = true; });
    buttons.forEach(button => button.setAttribute('aria-expanded', 'false'));
    previous?.focus();
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    if (active === button) { close(); return; }
    close(); active = button;
    nav.classList.remove('is-open'); menu.setAttribute('aria-expanded','false'); menu.textContent='Menu';
    const panel = panels.find(p => p.dataset.toolPanel === button.dataset.tool);
    panel.hidden = false; button.setAttribute('aria-expanded','true');
    let frame = panel.querySelector('iframe');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.title = button.textContent;
      frame.src = '/embedded-tools/' + button.dataset.tool;
      frame.setAttribute('allow','microphone');
      frame.addEventListener('load', () => {
        try {
          const doc = frame.contentDocument;
          doc.addEventListener('keydown', event => { if(event.key==='Escape'){event.preventDefault();close();} });
          // Resource navigation opens the full app, while Ask requests stay inside the panel.
          doc.addEventListener('click', event => {
            const link = event.target.closest?.('a[href]');
            if (!link || link.href.startsWith('blob:') || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')) return;
            if (link.origin === location.origin) { event.preventDefault(); location.assign(link.href); }
          }, true);
          doc.querySelector('textarea,input[type="search"]')?.focus();
        } catch { /* Its ordinary page link remains usable if a file is opened offline. */ }
      });
      panel.querySelector('.standalone-frame').append(frame);
    } else frame.contentDocument?.querySelector('textarea,input[type="search"]')?.focus();
  }));
  header.querySelectorAll('[data-close-tool]').forEach(button => button.addEventListener('click',close));
  menu.addEventListener('click', () => { close(); const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';nav.classList.toggle('is-open',open); });
  header.addEventListener('keydown', event => {if(event.key==='Escape'){close();nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}});
  // Portable files opened directly retain links into the live program.
  if (location.protocol === 'file:') {
    buttons.forEach(button => button.addEventListener('click', () => location.assign('https://one-dsd-people-access-culture-production-2454.up.railway.app/' + button.dataset.tool)));
  }
})();

// Read-only guides keep every paragraph and table, with one topic visible at a time.
(() => {
  const rail = document.querySelector('.shell > .rail');
  const coach = document.getElementById('coach');
  const toggle = document.getElementById('btnCoach');
  if (!rail || !coach || !toggle) return;
  document.body.classList.add('dsd-focused-tool');
  const steps = document.createElement('details'); steps.className = 'standalone-tool-steps';
  const summary = document.createElement('summary'); summary.textContent = 'Analysis steps';
  rail.before(steps); steps.append(summary,rail);
  steps.addEventListener('click', event => {
    if (event.target.closest('#nav button')) { steps.open = false; document.getElementById('main')?.focus(); }
  });
  coach.tabIndex = -1;
  toggle.addEventListener('click', () => requestAnimationFrame(() => {
    if (coach.classList.contains('open')) { coach.focus(); coach.scrollIntoView({block:'start'}); }
  }));
  coach.addEventListener('keydown', event => {
    if (event.key === 'Escape') { coach.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); toggle.focus(); }
  });
})();

(() => {
  const main = document.querySelector('main');
  if (!main || main.querySelector('input,textarea,select,form')) return;
  const headingTag = [...main.children].some(node => node.tagName === 'H2') ? 'H2' : 'H3';
  const headings = [...main.children].filter(node => node.tagName === headingTag);
  if (headings.length < 3) return;
  const groups = [];
  let section;
  for (const node of [...main.childNodes]) {
    if (node.nodeType === 1 && node.tagName === headingTag) {
      section = document.createElement('section');
      section.className = 'standalone-topic';
      node.id ||= `guide-topic-${groups.length + 1}`;
      section.setAttribute('aria-labelledby',node.id);
      section.tabIndex = -1;
      node.before(section);
      groups.push({section,heading:node});
    }
    if (section && node !== section) section.append(node);
  }
  const contents = document.createElement('details');
  contents.className = 'standalone-contents';
  const summary = document.createElement('summary'); summary.textContent = 'In this guide'; contents.append(summary);
  const list = document.createElement('ol'); contents.append(list);
  const pager = document.createElement('nav'); pager.className = 'standalone-topic-pager'; pager.setAttribute('aria-label','Guide topics');
  const previous = document.createElement('button'); previous.type='button'; previous.textContent='Previous';
  const next = document.createElement('button'); next.type='button'; next.textContent='Next';
  const position = document.createElement('span'); position.setAttribute('aria-live','polite');
  pager.append(previous,position,next);
  groups[0].section.before(contents); main.append(pager);
  let selected = 0;
  function choose(index, update = true) {
    selected = Math.max(0,Math.min(groups.length-1,index));
    groups.forEach(({section},i)=>{section.hidden = i !== selected;});
    previous.disabled=selected===0; next.disabled=selected===groups.length-1;
    position.textContent=`${selected+1} of ${groups.length}`;
    list.querySelectorAll('button').forEach((button,i)=>{ if(i===selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current'); });
    if (update) {
      const url = new URL(location.href); url.hash=groups[selected].heading.id;
      history.pushState(null,'',url); groups[selected].section.focus();
    }
  }
  groups.forEach(({heading},i)=>{
    const item=document.createElement('li'),button=document.createElement('button'); button.type='button';button.textContent=heading.textContent;
    button.addEventListener('click',()=>choose(i));item.append(button);list.append(item);
  });
  previous.addEventListener('click',()=>choose(selected-1));next.addEventListener('click',()=>choose(selected+1));
  function fromAddress() {
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    const target=document.getElementById(id);
    const index=groups.findIndex(({section})=>section.contains(target));
    choose(index<0?0:index,false);
  }
  window.addEventListener('hashchange',fromAddress); window.addEventListener('popstate',fromAddress); fromAddress();
})();

// Hybrid design and series name for the self-directed course pages (owner decisions 2026-11-21).
// The pages' own files ship from the release asset bucket, so these small changes live here.
(function () {
  if (!/^\/learning\/self-directed\//.test(location.pathname)) return;
  var style = document.createElement("style");
  style.textContent = '.dsd-calm main :is(strong, b, dt, th, legend, label, h4, h5, h6):not(:is(a, button, .button, [role="button"], [aria-pressed="true"], [aria-selected="true"]) *) { color: #003865; }';
  document.head.appendChild(style);
  function rename() {
    var h = document.querySelector("main h1");
    if (h && h.textContent.trim() === "Self-directed learning") h.textContent = "Practice for the Moments That Matter";
    if (/^Self-Directed Learning \|/.test(document.title)) document.title = document.title.replace(/^Self-Directed Learning/, "Practice for the Moments That Matter");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", rename); else rename();
})();
