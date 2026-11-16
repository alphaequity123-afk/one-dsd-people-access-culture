'use client';
import { useState } from 'react';

export function ReadingPractice() {
  const [choice,setChoice]=useState<number|null>(null);
  const [reflection,setReflection]=useState('');
  const options=[
    {text:'Shorten the notice and keep the online-only response.',feedback:'Shorter wording may help, but a person could still be unable to respond. Examine the response options, language, accessibility and support as well as the length.'},
    {text:'Ask people who use the service to test the notice and its response options before deciding what to change.',feedback:'This brings people’s experience into the decision and tests the whole task. Include people with different communication and access needs; record what their feedback changes and check the applicable requirements.'},
    {text:'Add a longer explanation of why the online response is convenient for staff.',feedback:'An explanation of staff convenience does not establish whether the process works for the person receiving the notice. Investigate barriers and practical alternatives before choosing an approach.'},
  ];
  function download() {
    const blob=new Blob(['Improve a service notice\n\nMy next step\n'+reflection+'\n\nFollow-up: What changed, who benefited, and what still needs attention?\n'],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='my-service-notice-reflection.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section>
    <h2>Try a different situation</h2><p>In this example, a team sends an appointment reminder that asks everyone to confirm through a website. Several people miss the confirmation. The team does not yet know why.</p>
    <fieldset style={{border:0,padding:0}}><legend style={{fontWeight:700}}>Which next step would give the team the most useful information?</legend>{options.map((option,i)=><label key={option.text} style={{display:'flex',gap:'.75rem',alignItems:'baseline',padding:'.85rem 0',cursor:'pointer'}}><input type="radio" name="notice-response" checked={choice===i} onChange={()=>setChoice(i)}/><span>{option.text}</span></label>)}</fieldset>
    {choice!==null?<p role="status" style={{padding:'1rem',borderLeft:'4px solid #003865',background:'#f4f7f9'}}>{options[choice].feedback}</p>:null}
    <h2>Bring one idea into your work</h2><label htmlFor="reading-reflection">What would you examine, who would you involve, and what would tell you whether the change helped?</label><p id="reflection-help">Use a practice example or general description. Keep personal and confidential details out of your notes. Writing here is optional.</p><textarea id="reading-reflection" aria-describedby="reflection-help" rows={5} value={reflection} onChange={e=>setReflection(e.target.value)} style={{display:'block',width:'100%',padding:'.8rem',border:'1px solid #637f90',borderRadius:'.3rem',font:'inherit'}}/>
    <button type="button" disabled={!reflection.trim()} onClick={download} style={{marginTop:'1rem',padding:'.7rem 1rem',background:'#005ea8',color:'#fff',borderRadius:'.3rem',opacity:reflection.trim()?1:.6}}>Download my reflection</button>
    <p>Your writing stays on this page until you leave. Download it if you want to keep it.</p>
    <h2>Return to the question</h2><p>After you have tried a change, revisit your reflection. What became easier? Who still faced a barrier? What did you learn that should change your next decision?</p>
  </section>;
}
