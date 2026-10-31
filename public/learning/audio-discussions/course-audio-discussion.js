(() => {
 const stage=document.getElementById('stage');if(!stage)return;
 let last='',request=0;
 const available=()=>fetch('../audio-discussions/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}));
 const cache=new Map();
 const panel=document.createElement('section');panel.id='course-audio-discussion';panel.hidden=true;
 const guidance=document.createElement('section');guidance.id='course-audio-guidance';guidance.hidden=true;
 for(const p of [panel,guidance])p.style.cssText='margin:24px 0;padding:20px;border:1px solid #ccd4df;border-radius:8px';
 stage.parentNode.insertBefore(panel,stage);stage.parentNode.insertBefore(guidance,stage.nextSibling);
 const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value??'';return el;};
 const speaker=(turn,data)=>turn.speakerLabel||data.speakers?.[turn.host]||(turn.host==='geffen'?'Geffen':turn.host==='host1'?'Speaker 1':'Speaker 2');
 function player(target,src,title){const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src=src;audio.style.width='100%';audio.setAttribute('aria-label',title);audio.addEventListener('play',()=>{for(const other of document.querySelectorAll('audio'))if(other!==audio)other.pause();});target.append(audio);const link=text('a','Download audio');link.href=src;link.download='';target.append(link);}
 async function refresh(){
  const course=stage.dataset.course,slide=Number(stage.dataset.slide),key=course+':'+slide;if(key===last)return;last=key;const ticket=++request;
  for(const p of [panel,guidance]){p.querySelectorAll('audio').forEach(a=>a.pause());p.replaceChildren();p.hidden=true;}
  try{
   const manifest=await available();if(!manifest[course])return;
   let data=cache.get(course);if(!data){const response=await fetch('../audio-discussions/'+encodeURIComponent(course)+'.json',{cache:'no-store'});if(!response.ok)return;data=await response.json();cache.set(course,data);}if(ticket!==request)return;
   if((data.src || data.turns?.length) && slide===(data.afterSlide??1)){
    panel.append(text('h2',data.title),text('p',data.before));if(data.src){panel.append(text('p','Listen or read at your own pace.'));player(panel,data.src,data.title);}
    const details=document.createElement('details');details.append(text('summary',(data.turns||[]).every(turn=>turn.host==='geffen')?'Read the introduction':'Read the complete conversation'));
    for(const turn of data.turns||[]){const p=document.createElement('p');p.append(text('strong',speaker(turn,data)),document.createElement('br'),document.createTextNode(turn.text));details.append(p);}
    panel.append(details);panel.hidden=false;
   }
   for(const c of data.guidance||[])if(c.afterSlide===slide){const target=c.kind==='introduction'?panel:guidance;target.append(text('h2',c.title));if(c.src)player(target,c.src,c.title);const details=document.createElement('details');details.open=!c.src;details.append(text('summary',c.kind==='explainer'?'Read this explanation':c.kind==='introduction'?'Read this introduction':'Read this reflection'),text('p',c.text));target.append(details);target.hidden=false;}
  }catch{}
 }
 new MutationObserver(refresh).observe(stage,{attributes:true,attributeFilter:['data-course','data-slide']});refresh();
})();
