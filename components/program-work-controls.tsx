"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { measureDefinitionFields } from "@/lib/program/measure-definition-fields";
import { ADSA_WORK_GOALS, adsaWorkAction } from "@/lib/program/adsa-work-links";
import { programFunctions } from "@/lib/program/model";
import type { ProgramWorkView } from "@/lib/program/work";
export function ProgramWorkControls(){
  const router=useRouter(),requestId=useRef<string|null>(null),readyAt=useRef<string|null>(null);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function send(body:unknown){
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/consultant/program",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error??"The change could not be saved.");
      setMessage(result.result?result.result.completed.length+" completed; "+result.result.failed.length+" unfinished; "+result.result.skipped.length+" paused or already assigned.":result.prepared?"Program-area resource reviews are ready.":"Work saved.");
      router.refresh();return true;
    }catch(error){setMessage(error instanceof Error?error.message:"Please try again.");return false;}
    finally{setBusy(false);}
  }
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget,data=new FormData(form),date=String(data.get("due")??"");
    requestId.current??=crypto.randomUUID();readyAt.current??=date?new Date(date+"T12:00:00Z").toISOString():new Date().toISOString();
    if(await send({action:"create",requestId:requestId.current,functionId:data.get("area"),kind:data.get("kind"),title:data.get("title"),objective:data.get("objective"),executionMode:data.get("mode"),goalActionIds:data.getAll("goalActionIds"),dueAt:readyAt.current})){form.reset();requestId.current=null;readyAt.current=null;}
  }
  return <section className="card p-6"><h2 className="text-2xl font-semibold">Carry the work forward</h2><p className="mt-2">Set a priority, explain the question and prepare a useful contribution. You can record your own analysis with automated assistance off, or assign bounded preparation when assistance is available. Neither path authorizes a policy or operational decision.</p>
    <div className="my-4 flex flex-wrap gap-3"><button className="btn btn-primary" disabled={busy} onClick={()=>void send({action:"run",limit:2})}>{busy?"Working…":"Run assigned work"}</button><button className="btn" disabled={busy} onClick={()=>void send({action:"prepare"})}>Prepare program-area resource reviews</button><a className="btn" href="/consultant/orchestrator">Review or pause program activity</a></div>
    <details><summary className="cursor-pointer font-semibold">Add a work item</summary>
      <form onSubmit={create} onChange={()=>{requestId.current=null;readyAt.current=null;}} className="mt-4 grid gap-4"><fieldset disabled={busy} className="contents">
        <label>How will this be prepared?<select name="mode" className="input block w-full"><option value="manual">Prepare and record it myself</option><option value="assisted">Use available program assistance</option></select></label>
        <label>Program area<select name="area" className="input block w-full">{programFunctions.map(fn=><option key={fn.id} value={fn.id}>{fn.title}</option>)}</select></label>
        <label>Type of work<select name="kind" className="input block w-full"><option value="work_preparation">Prepare a work product</option><option value="resource_review">Review published resources in this area</option></select></label>
        <label>Work item<input className="input block w-full" name="title" minLength={5} maxLength={180} required/></label>
        <label>Question, affected people, evidence and intended contribution<textarea className="input block w-full" name="objective" minLength={10} maxLength={3000} rows={4} required/></label>
        <details><summary className="cursor-pointer font-semibold">Connect this work to ADSA action steps, if relevant</summary><p className="mt-2">Choose only the supplied steps this work supports. These links do not assign duties, establish agency-wide adoption or show that an action is completed. <Link prefetch={false} className="underline" href="/program/implementation">Read the implementation map</Link>.</p><div className="mt-3 grid gap-3">{ADSA_WORK_GOALS.map(goal=><details key={goal.number}><summary>Goal {goal.number}: {goal.title}</summary><div className="mt-2 grid gap-2">{goal.actions.map(action=><label key={action.id} className="flex items-start gap-2"><input type="checkbox" name="goalActionIds" value={action.id}/><span>{action.id}: {action.sourceText}</span></label>)}</div></details>)}</div></details>
        <label>Ready to begin on <input className="input" type="date" name="due"/></label><button className="btn btn-primary" disabled={busy}>Add work item</button>
      </fieldset></form>
    </details><p role="status" className="mt-3">{message}</p>
  </section>;
}
export function ProgramObservationForm({task}:{task:Pick<ProgramWorkView,"id"|"status"|"receipt"|"lastEventId"|"executionMode"> & {decisionRecorded?:boolean;implementationRecorded?:boolean}}){
  const router=useRouter(),requestId=useRef<string|null>(null);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [phase,setPhase]=useState(task.receipt?"reviewed":"cancelled");
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget,data=new FormData(form);setBusy(true);setMessage("");
    try{
      const date=String(data.get("followUp")??""),minutes=String(data.get("minutes")??"");
      requestId.current??=crypto.randomUUID();
      const response=await fetch("/api/consultant/program",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"observe",requestId:requestId.current,taskId:task.id,expectedEventId:task.lastEventId,phase:data.get("phase"),note:data.get("note"),disposition:data.get("disposition"),followUpAt:date?new Date(date+"T12:00:00Z").toISOString():undefined,humanMinutes:minutes?Number(minutes):undefined,...(data.get("phase")==="decision_recorded"?{decisionOwner:data.get("decisionOwner"),decisionReference:data.get("decisionReference"),nextAction:data.get("nextAction"),implementationOwner:data.get("implementationOwner")}: {}),...(data.get("phase")==="results_recorded"?{resultObservation:data.get("resultObservation"),resultEvidence:data.get("resultEvidence"),resultLimitations:data.get("resultLimitations"),resultConfidence:data.get("resultConfidence")}: {})})});
      const result=await response.json();
      if(!response.ok){if(response.status===409)throw new Error("This work changed since you opened it. Your writing is still here. Copy it before refreshing to review the latest record.");throw new Error(result.error??"The observation could not be saved.");}
      setMessage("Saved. Your follow-through is recorded.");form.reset();requestId.current=null;router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Please try again.");}finally{setBusy(false);}
  }
  return <details className="mt-4"><summary className="cursor-pointer font-semibold">Record follow-through or redirect this work</summary>
    <form onSubmit={save} onChange={()=>{requestId.current=null;}} className="mt-3 grid gap-3"><fieldset disabled={busy} className="contents">
      <label>What happened?<select className="input block" name="phase" value={phase} onChange={event=>setPhase(event.target.value)}>
        {task.receipt&&<><option value="reviewed">Reviewed the preparation or result</option><option value="decision_recorded">Record an authorized decision reported to you</option>{task.implementationRecorded&&<option value="results_recorded">Record observed results and limitations</option>}{task.decisionRecorded&&<option value="applied">Report implementation in work</option>}</>}
        {["failed","cancelled","completed","prepared"].includes(task.status)&&<option value="retry_requested">Prepare a revised contribution</option>}
        {task.status!=="cancelled"&&<option value="cancelled">Stop this work</option>}
      </select></label>
      {phase==="decision_recorded"&&<fieldset className="grid gap-3"><legend>Decision and next action</legend><p>This records your account of an existing authorized decision. It does not grant approval or verify the responsible office&apos;s authority.</p><label>Who made the decision, and in what role?<input className="input block w-full" name="decisionOwner" minLength={2} maxLength={240} required/></label><label>Decision reference and relevant date<input className="input block w-full" name="decisionReference" minLength={5} maxLength={1500} required/></label><label>Agreed next action<textarea className="input block w-full" name="nextAction" minLength={5} maxLength={1500} required/></label><label>Responsible implementation person or role<input className="input block w-full" name="implementationOwner" minLength={2} maxLength={240} required/></label></fieldset>}
      {phase==="results_recorded"&&<fieldset className="grid gap-3"><legend>What changed after implementation?</legend><p>Describe what the evidence supports, including barriers that remain. A reported result does not establish that this action caused the change.</p><label>Observed change and who was affected<textarea className="input block w-full" name="resultObservation" minLength={10} maxLength={1500} required/></label><label>Evidence source, period and comparison<textarea className="input block w-full" name="resultEvidence" minLength={10} maxLength={1500} required/></label><label>Limitations, missing perspectives and other possible explanations<textarea className="input block w-full" name="resultLimitations" minLength={10} maxLength={1500} required/></label><label>How strong is the observation?<select className="input block" name="resultConfidence"><option value="not_yet_known">Not yet known</option><option value="early_observation">Early observation</option><option value="supported_observation">Supported by the evidence described</option></select></label></fieldset>}
      <label>Observation and evidence<textarea className="input block w-full" rows={3} minLength={10} maxLength={3000} name="note" required/></label>
      <label>Next direction<select className="input block" name="disposition"><option value="not_yet_known">Still learning</option><option value="retain">Retain</option><option value="revise">Revise</option><option value="stop">Stop</option></select></label>
      <label>Next review <input className="input" name="followUp" type="date"/></label>
      <label>Your time spent, if known (minutes) <input className="input" name="minutes" type="number" min={0} max={100000}/></label>
      <button className="btn" disabled={busy}>{busy?"Saving…":"Save follow-through"}</button><p role="status">{message}</p>
    </fieldset></form>
  </details>;
}

export function ManualPreparationForm({task}:{task:Pick<ProgramWorkView,"id"|"lastEventId"|"goalActionIds">}) {
  const router=useRouter(),requestId=useRef<string|null>(null);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[defineMeasure,setDefineMeasure]=useState(false);
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=event.currentTarget,data=new FormData(form);
    if(Boolean(String(data.get("referenceLabel")??"").trim())!==Boolean(String(data.get("referenceHref")??"").trim())) {setMessage("Add both a source title and address, or leave both empty. Your writing is still here.");return;}
    setBusy(true);setMessage("");requestId.current??=crypto.randomUUID();
    try {
      const response=await fetch("/api/consultant/program",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"prepare_manual",requestId:requestId.current,taskId:task.id,expectedEventId:task.lastEventId,body:data.get("body"),note:data.get("note"),references:String(data.get("referenceHref")??"").trim()?[{label:data.get("referenceLabel"),href:data.get("referenceHref")}]:[],preparationPlan:{reviewNeeds:data.get("reviewNeeds"),measure:data.get("measure"),reportBack:data.get("reportBack"),...(defineMeasure?{measureDefinition:Object.fromEntries(measureDefinitionFields.map(field=>[field.id,data.get("measure_"+field.id)]))}:{})}})});
      const result=await response.json();if(!response.ok){if(response.status===409)throw new Error("This work changed since you opened it. Your writing is still here. Copy it before refreshing to review the latest record.");throw new Error(result.error??"The preparation could not be confirmed.");}
      setMessage("Preparation recorded. It remains a draft contribution, not an approved decision.");requestId.current=null;form.reset();router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"The preparation could not be confirmed. Your writing is still here.");}finally{setBusy(false);}
  }
  return <details className="mt-5"><summary className="cursor-pointer font-semibold">Record your prepared analysis or recommendation</summary><form className="mt-4 grid gap-3" onSubmit={save} onChange={()=>{requestId.current=null;}}><fieldset disabled={busy} className="contents"><p>Use general program information. Keep client, case, health, personnel and confidential records out of this workspace.</p>{task.goalActionIds?.length? <p>Selected ADSA connections: {task.goalActionIds.map(id=><a key={id} className="mr-3 underline" href={"/program/implementation#"+id}>{id}: {adsaWorkAction(id)?.sourceText}</a>)}. This preparation is a draft contribution; delivery, implementation and observed benefit are recorded separately.</p>:null}<label>Prepared contribution<textarea className="input block w-full" name="body" rows={10} minLength={20} maxLength={18000} required placeholder="Question and scope; relevant sources; affected people and missing perspectives; options and tradeoffs; recommendation; uncertainty and the evidence still needed."/></label><fieldset className="grid gap-3"><legend>Connect a source or program resource, if useful</legend><p>Use a public source or a page in this program. Keep restricted links and sign-in details out. In your review note, explain the source&apos;s date, scope and any uncertainty; adding a link does not establish authority.</p><label>Source or resource title<input className="input block w-full" name="referenceLabel" minLength={2} maxLength={240}/></label><label>Public HTTPS address or program path<input className="input block w-full" name="referenceHref" maxLength={1500} placeholder="/learn/equity-toolkit"/></label></fieldset><label>Review note and source limitations<textarea className="input block w-full" name="note" rows={3} minLength={10} maxLength={3000} required/></label><label>Reviews needed before a decision<textarea className="input block w-full" name="reviewNeeds" minLength={10} maxLength={1500} required placeholder="Identify relevant policy, legal, fiscal, accessibility or community engagement needs; explain any not needed or still unknown."/></label><label>How will you check whether the change helped?<textarea className="input block w-full" name="measure" minLength={10} maxLength={1500} required placeholder="Proposed measure, evidence source, comparison and remaining uncertainty."/></label><details><summary className="cursor-pointer font-semibold">Keep a proposed measure definition with this work</summary><p className="mt-3">When this work needs a repeatable measure, save its definition with the preparation. The program assigns a stable identity and a new version when you revise it. It remains proposed; actual agency review, data permissions and targets are not established here.</p><label className="mt-3 block"><input type="checkbox" checked={defineMeasure} onChange={event=>setDefineMeasure(event.target.checked)}/> Include a measure definition</label>{defineMeasure&&<div className="mt-3 grid gap-3">{measureDefinitionFields.map(field=><label key={field.id}>{field.label}<textarea className="input block w-full" name={"measure_"+field.id} required minLength={field.minimum} maxLength={field.maximum} rows={2}/><span className="block text-sm text-muted">{field.help}</span></label>)}</div>}</details><label>Who should receive the findings and next update?<textarea className="input block w-full" name="reportBack" minLength={5} maxLength={1000} required/></label><button className="btn" disabled={busy}>{busy?"Saving…":"Record preparation"}</button><p role="status">{message}</p></fieldset></form></details>;
}
