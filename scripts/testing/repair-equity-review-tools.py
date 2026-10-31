from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
source = root.parent / 'claude-one-dsd-source-20261005/3-library-bundle/public/library/equity-review-tools'
target = root / 'public/library/equity-review-tools'
target.mkdir(parents=True, exist_ok=True)
for name in ('DSD_Equity_Policy_Analysis_Tool.html', 'DSD_HCBS_Equity_Policy_Analysis_Tool.html'):
    h = (source / name).read_text(encoding='utf-8')
    hcbs = 'HCBS' in name
    final, alternative = ('s10', 's8') if hcbs else ('s9', 's7')
    h = h.replace('#3E7D4F', '#52677B').replace('#E6F2E9', '#E9EEF3').replace('#A33D2E', '#675747').replace('#F8E7E3', '#F1ECE4')
    h = h.replace('DSD HCBS Equity Policy Analysis Tool', 'One DSD HCBS Equity Policy Review').replace('DSD Equity Policy Analysis Tool', 'One DSD Equity Policy Review')
    h = h.replace('https://people-access-culture.up.railway.app/', '/') .replace('?view=one_dsd', '')
    h = h.replace('DSD unit or team responsible', 'DHS unit or team responsible')
    h = h.replace('<div class="actions">', '<nav aria-label="Review navigation"><a style="color:white" href="/equity-review">All equity reviews</a> · <a style="color:white" href="/one-dsd/planning">Policy and planning</a></nav><div class="actions">',1)
    h = h.replace('Name the decision, the person who will make it, and determine which review the DHS Equity Policy requires. Ten minutes here saves a rework later.', 'Name the decision and who is responsible for it. Use the questions to suggest a review approach, and confirm policy requirements with the responsible office.')
    h = h.replace('Answer the three questions above to see the required review track.', 'Answer the questions above to see a suggested review approach. Confirm policy requirements with the responsible office.')
    h = h.replace('Equity scan is appropriate only when a formal analysis was already completed and its results integrated.', 'The linked policy establishes when formal analysis is required. Its toolkit user guide provides further guidance on analysis and scans; confirm the appropriate approach with the responsible office.')
    h = h.replace('Waiver amendments, state plan changes, bulletins, rate methodologies and manual changes all qualify. An equity scan applies only when a formal analysis was already completed and integrated.', 'For waiver amendments, state plan changes, bulletins, rate methodologies and manual changes, examine impact and the actual review requirements. Confirm analysis or scan guidance with the responsible office and the toolkit user guide.')
    h = h.replace('Record the action, the service lines it touches, the person who decides and the required review track.', 'Record the action, the service lines it touches and who is responsible for the decision. Use the questions to suggest a review approach, then confirm policy requirements with the responsible office.')
    h = h.replace('</header>', '<p id="draftStatus" role="status" aria-live="polite" style="margin:.5rem 1rem">Your draft stays in this browser. It is not submitted or shared. Avoid personal or confidential information; downloaded drafts are unencrypted.</p><button class="btn small" id="btnClearLocal">Clear browser draft</button></header>', 1)
    h = h.replace('version:1, savedAt:null,', f'version:1, toolKind:"{"hcbs" if hcbs else "general"}", sample:false, savedAt:null,')
    h = h.replace('prior:"",team:""', 'prior:"",team:"",unchanged:"",priorCitation:""')
    h = h.replace('if(m.prior==="yes") return', 'if(m.prior==="yes" && m.unchanged==="yes" && filled(m.priorCitation)) return')
    h = h.replace('Treat it as a full analysis unless the ADSA Equity Director agrees a scan is sufficient.', 'Use the full review to examine the effects and confirm any required policy review paths.')
    h = h.replace('Short-lived and not going for approval.', 'Based on the selected answers, a lighter review may be useful. Confirm any remaining uncertainties and required review paths.')
    insert = '${radios("meta.unchanged","If a prior review exists, has anything material changed?","Consider the people affected, proposal, evidence and unresolved concerns.",[["yes","No material changes identified"],["no","Changed or not yet determined"]])}${tx("meta.priorCitation","Prior review reference","Title, date or location; do not enter confidential information.")} '
    h = h.replace('  ${t?`<div class="note', '  ' + insert + '${t?`<div class="note', 1)
    h = h.replace('"meta.prior"].includes', '"meta.prior","meta.unchanged","meta.priorCitation"].includes')
    h = h.replace('g.some(x=>x.eff==="burden"||x.eff==="both")||g.every(x=>x.eff&&x.eff!=="unknown")', 'g.length>0&&g.every(x=>filled(x.name)&&x.eff&&x.eff!=="unknown")')
    h = h.replace('"Burdens identified, or every group assessed with none unknown"', '"Every listed group assessed, with no unresolved unknown effects"')
    h = h.replace('g.filter(x=>x.eff&&x.eff!=="none").every(x=>filled(x.how))', 'g.some(x=>x.eff&&x.eff!=="none")&&g.filter(x=>x.eff&&x.eff!=="none").every(x=>filled(x.how)&&filled(x.evidence))')
    h = h.replace('"Every affected group has a description of how"', '"Every affected group has an effect description and evidence reference"')
    h = h.replace('"At least two alternatives compared"', '"Alternative comparison recorded; confirm that it covers at least two options"')
    h = h.replace('filled(r.text)&&filled(r.owner)&&filled(r.by)', 'filled(r.text)&&filled(r.owner)&&filled(r.by)&&filled(r.measure)')
    h = h.replace('"At least one recommendation has an owner and a date"', '"At least one recommendation has an owner, date and measure"')
    h = h.replace('Support as drafted', 'Proceed as proposed').replace('Support with amendments', 'Proceed with changes').replace('stop:"Oppose"', 'stop:"Do not proceed"').replace('Position not yet recorded', 'Recommendation not yet recorded').replace('Equity position:', 'Equity review recommendation (not an official legislative position):')
    h = h.replace('return `<div class="rubric">', 'return `<p class="help">These checks show what has been recorded. They do not establish the quality of the evidence or policy compliance.</p><div class="rubric">')
    h = h.replace('return `<', 'return `<', 1)
    # Sample provenance follows generated records, copied text and saved drafts.
    h = h.replace('function record(){', 'function record(){')
    h = h.replace('<div class="record">', '<div class="record">${S.sample?"<p><strong>Fictional worked example — figures, dates and recommendations are illustrative.</strong></p>":""}')
    h = h.replace('return `<h2>Equity Analysis Record:', 'return `${S.sample?"<p><strong>Fictional worked example — illustrative figures, dates and recommendations.</strong></p>":""}<h2>Equity Analysis Record:')
    h = h.replace('const L=[];', 'const L=[]; if(S.sample)L.push("FICTIONAL WORKED EXAMPLE — illustrative figures and recommendations, not an actual policy review.","");')
    h = h.replace('`EQUITY IMPACT (DHS Equity Policy analysis)`', '`EQUITY IMPACT (DHS Equity Policy analysis)${S.sample?" — FICTIONAL WORKED EXAMPLE":""}`')
    h = h.replace('S=blank();\n  WALK', 'S=blank();S.sample=true;\n  WALK')
    # More informative row labels and linked help.
    for label in ('Effect', 'Severity', 'How affected', 'Evidence', 'Engaged', 'Group name'):
        h = h.replace(f'aria-label="{label}" data-g=', f'aria-label="{label}: ${{esc(g.name||"unnamed group")}}" data-g=')
    h = h.replace('<p class="help">${help}</p>', '<p class="help" id="${path}-help">${help}</p>')
    h = h.replace('data-path="${path}"', 'aria-describedby="${path}-help" data-path="${path}"')
    # Transactional bounded import: never replace the working draft on a failed import.
    start = h.index('$("#fileOpen").addEventListener')
    end = h.index('render(false);', h.index('window.addEventListener("beforeunload"', start))
    h = h[:start] + '''
const DRAFT_KEY="one-dsd-review-"+blank().toolKind;
let lastDownloaded="";
function validateDraft(d){
 if(!d||d.version!==1||d.toolKind!==blank().toolKind)throw Error("wrong tool");
 const template=blank();
 function check(v,t,depth=0){
  if(depth>8)throw Error("depth");
  if(Array.isArray(t)){if(!Array.isArray(v)||v.length>100)throw Error("array");for(const x of v)check(x,t[0]??"",depth+1);return;}
  if(t!==null&&typeof t==="object"){if(!v||Array.isArray(v)||typeof v!=="object")throw Error("object");for(const k of Object.keys(t)){if(!Object.hasOwn(v,k))throw Error("missing field");check(v[k],t[k],depth+1);}for(const k of Object.keys(v)){if(!Object.hasOwn(t,k))throw Error("unknown field");}return;}
  if(t===null){if(v!==null&&typeof v!=="string")throw Error("date");return;}
  if(typeof v!==typeof t||(typeof v==="string"&&v.length>30000))throw Error("value");
 }
 check(d,template);
 if(d.meta.type&&!Object.hasOwn(TYPES,d.meta.type))throw Error("action");
 const enumValue=(value,allowed)=>{if(!["",...allowed].includes(value))throw Error("selection");};
 enumValue(d.meta.duration,["prolonged","short"]);enumValue(d.meta.approval,["supervisor","director","ac","commissioner","none"]);enumValue(d.meta.prior,["yes","no"]);enumValue(d.meta.unchanged,["yes","no"]);enumValue(d.s4.tribal,["yes","planned","na","unsure"]);enumValue(d.s5.disparity,["reduce","neutral","widen","unknown"]);
 for(const g of d.groups){enumValue(g.eff,["benefit","burden","both","unknown","none"]);enumValue(g.sev,["Low","Moderate","High"]);enumValue(g.engaged,["Yes","Planned","No"]);}
 const result=d[d.toolKind==="hcbs"?"s10":"s9"];enumValue(result.verdict,["proceed","changes","redesign","stop"]);
 const enumArray=(values,allowed)=>{if(new Set(values).size!==values.length||values.some(v=>!allowed.includes(v)))throw Error("selection list");};
 enumArray(result.objectives,OBJECTIVES.map(x=>x.id));enumArray(result.goals,GOALS.map(x=>x.id));enumArray(d[d.toolKind==="hcbs"?"s8":"s7"].routes,ROUTES.map(x=>x.id));if(d.toolKind==="hcbs")enumArray(d.meta.lines,LINES);
 return d;
}
function persistDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(S));$("#draftStatus").textContent="Draft saved in this browser only. Not submitted or shared. Avoid personal or confidential information.";}catch{$("#draftStatus").textContent="Browser saving is unavailable. Download your draft to keep your work.";}}
function restoreDraft(){try{const raw=localStorage.getItem(DRAFT_KEY);if(raw&&raw.length<=2000000){const d=validateDraft(JSON.parse(raw));S=d;$("#draftStatus").textContent="Your previous browser draft was recovered. It has not been submitted or shared.";}}catch{$("#draftStatus").textContent="The browser draft could not be recovered. Open a downloaded draft or start a new analysis.";}}
document.addEventListener("input",()=>persistDraft());
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.id==="btnClearLocal"){if(confirm("Clear the draft saved in this browser? Download it first if you want to keep it.")){try{localStorage.removeItem(DRAFT_KEY);}catch{}S=blank();cur=0;render();$("#draftStatus").textContent="Browser draft cleared.";}return;}if(b.id==="btnNew"||b.id==="btnExample"||b.id==="btnLoadEx"||b.id==="addGroup"||b.id==="addRec"||b.dataset.del!==undefined||b.dataset.delrec!==undefined)persistDraft();});
$("#fileOpen").addEventListener("change",async e=>{
 const f=e.target.files[0];if(!f)return;
 try{if(f.size>2000000)throw Error("size");const candidate=validateDraft(JSON.parse(await f.text()));if(!confirm("Replace the current draft with this file? Download the current draft first if you want to keep it."))return;S=candidate;cur=0;render();persistDraft();toast("Draft opened");}catch{toast("This draft could not be opened. Your current work is unchanged.");}finally{e.target.value="";}
});
document.querySelectorAll(".tabs button").forEach((tab,i)=>{tab.setAttribute("aria-controls",tab.dataset.tab);tab.tabIndex=i? -1:0;$("#"+tab.dataset.tab).setAttribute("aria-labelledby",tab.id);tab.addEventListener("click",()=>document.querySelectorAll(".tabs button").forEach(x=>x.tabIndex=x===tab?0:-1));tab.addEventListener("keydown",e=>{const tabs=[...document.querySelectorAll(".tabs button")];let n=tabs.indexOf(tab);if(e.key==="ArrowRight")n=(n+1)%tabs.length;else if(e.key==="ArrowLeft")n=(n+tabs.length-1)%tabs.length;else if(e.key==="Home")n=0;else if(e.key==="End")n=tabs.length-1;else return;e.preventDefault();tabs[n].click();tabs[n].focus();});});
window.addEventListener("beforeunload",e=>{try{if(localStorage.getItem(DRAFT_KEY)===JSON.stringify(S))return;}catch{}if(JSON.stringify(S)!==JSON.stringify(blank())&&JSON.stringify(S)!==lastDownloaded){e.preventDefault();e.returnValue="";}});
restoreDraft();
''' + h[end:]
    h = h.replace('S.savedAt=new Date().toISOString();', 'S.savedAt=new Date().toISOString();lastDownloaded=JSON.stringify(S);persistDraft();')
    # Keep keyboard focus after dynamic control changes.
    h = h.replace('function render(focus=true){', 'function render(focus=true){\n  const active=document.activeElement;const activePath=active?.dataset.path;const activeGroup=active?.dataset.g;const activeKey=active?.dataset.k;')
    h = h.replace('if(focus){$("#main").focus', 'if(!focus){const controls=[...document.querySelectorAll("[data-path],[data-g]")];controls.find(el=>activePath?el.dataset.path===activePath&&(!active.value||el.type!=="radio"||el.value===active.value):activeGroup!==undefined&&el.dataset.g===activeGroup&&el.dataset.k===activeKey)?.focus();}\n  if(focus){$("#main").focus')
    (target / name).write_text(h,encoding='utf-8')
