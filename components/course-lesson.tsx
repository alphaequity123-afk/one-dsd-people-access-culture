"use client";
import { GeffenLessonReadAloud } from "./geffen-course-read-aloud";
import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { CourseAudioDiscussion, CourseAudioGuidance } from "./course-audio-discussion";
import type { Block, Lesson } from "@/lib/content/courses/source-types";
import { lessonImageOverrides } from "@/lib/content/courses/lesson-image-overrides";
import { duplicateLessonImageKeys } from "@/lib/content/courses/lesson-image-repeat-suppression";

type State={schemaVersion:1;fields:Record<string,string>;submitted:Record<string,boolean>;completed:boolean};
const blank=():State=>({schemaVersion:1,fields:{},submitted:{},completed:false});
function validState(value:unknown):value is State { if(!value||typeof value!=="object"||Array.isArray(value))return false; const state=value as State;return state.schemaVersion===1&&typeof state.completed==="boolean"&&!!state.fields&&typeof state.fields==="object"&&!Array.isArray(state.fields)&&!!state.submitted&&typeof state.submitted==="object"&&!Array.isArray(state.submitted)&&Object.values(state.fields).every(item=>typeof item==="string")&&Object.values(state.submitted).every(item=>typeof item==="boolean"); }
function Rich({text}:{text:string}) {return <div className="course-rich" dangerouslySetInnerHTML={{__html:text}}/>;}
/** Authored blocks that close a lesson; they join the "Finish this lesson" tabs instead of standing as sections of their own. */
const CLOSING_BLOCK_HEADINGS=/^(continue your learning|put this lesson into practice)$/i;
export function CourseLesson({courseId,lesson,objectives,previous,next,companion,courseOverviewHref}:{courseId:string;lesson:Lesson;objectives:string[];previous?:string;next?:string;companion?:ReactNode;courseOverviewHref?:string}) {
  const overviewHref=courseOverviewHref??`/courses/${courseId}`;
  const [state,setState]=useState<State>(blank); const [loaded,setLoaded]=useState(false); const [message,setMessage]=useState(""); const uid=useId();
  const storageKey=`pac-course:${courseId}:${lesson.id}`;
  useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(!active)return;try{const raw=localStorage.getItem(storageKey);if(raw){const saved:unknown=JSON.parse(raw);if(!validState(saved))throw new Error("Invalid saved notes");setState(saved);}}catch{setMessage("Your saved progress could not be opened. You can still work through this lesson.");}setLoaded(true);});return()=>{active=false;};},[storageKey]);
  function save(nextState:State) {setState(nextState);try{localStorage.setItem(storageKey,JSON.stringify(nextState));localStorage.setItem(`pac-course-resume:${courseId}`,lesson.id);setMessage("Saved.");}catch{setMessage("Your progress could not be saved. You can continue while this page is open; note your place before leaving.");}}
  const field=(key:string,value:string)=>save({...state,fields:{...state.fields,[key]:value},submitted:{...state.submitted,[key]:false}});
  const submit=(key:string)=>save({...state,submitted:{...state.submitted,[key]:true}});
  const reset=(key:string)=>save({...state,fields:{...state.fields,[key]:""},submitted:{...state.submitted,[key]:false}});
  function downloadDraft(text:string,index:number) {
    let url:string|undefined;let link:HTMLAnchorElement|undefined;
    try {url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));link=document.createElement("a");link.href=url;link.download=`${courseId}-${lesson.id}-${index}.txt`;document.body.appendChild(link);link.click();setMessage("Your download has started. Look for the example in your downloads.");}
    catch {setMessage("The download could not start. You can copy the example shown above and keep it in your own document.");}
    finally {link?.remove();if(url){const pending=url;setTimeout(()=>URL.revokeObjectURL(pending),1000);}}
  }
  function render(block:Block,index:number) {
    const key=`block-${index}`;const inputId=`${uid}-${key}`;
    switch(block.type){
      case "text":return <section>{block.heading?<h2>{block.heading}</h2>:null}<Rich text={block.body}/></section>;
      case "image":{const replacement=lessonImageOverrides[block.src];const caption=replacement?.caption??block.caption;if(duplicateLessonImageKeys.has(`${courseId}|${lesson.id}|${index}`))return caption?<p className="course-image-note">{caption}</p>:null;return <figure><img src={replacement?.src??block.src} alt={replacement?.alt??block.alt} loading="lazy"/>{caption?<figcaption>{caption}</figcaption>:null}</figure>;}
      case "statement":return <aside className="course-statement"><Rich text={block.body}/></aside>;
      case "quote":return <blockquote><Rich text={block.text}/>{block.cite?<cite>{block.cite}</cite>:null}</blockquote>;
      case "list":{const List=block.ordered?"ol":"ul";return <section>{block.heading?<h2>{block.heading}</h2>:null}<List>{block.items.map((item,i)=><li key={i}><Rich text={item}/></li>)}</List></section>;}
      case "leaderMove":return <section><h2>{block.heading??"Put it into practice"}</h2><h3>What you can change</h3><Rich text={block.control}/><h3>What to watch for</h3><Rich text={block.failure}/><h3>Your next step</h3><Rich text={block.next}/></section>;
      case "accordion":return <section>{block.heading?<h2>{block.heading}</h2>:null}{block.items.map((item,i)=><details key={i}><summary>{item.title}</summary><Rich text={item.body}/></details>)}</section>;
      case "flashcards":return <section>{block.heading?<h2>{block.heading}</h2>:null}<div className="course-flashcards">{block.cards.map((card,i)=><details key={i}><summary><Rich text={card.front}/></summary><Rich text={card.back}/></details>)}</div></section>;
      case "tabs":{const saved=Number(state.fields[key]??0);const selected=Number.isInteger(saved)&&saved>=0&&saved<block.tabs.length?saved:0;return <section>{block.heading?<h2>{block.heading}</h2>:null}<div role="tablist" aria-label={block.heading??"Explore perspectives"}>{block.tabs.map((tab,i)=><button key={i} role="tab" id={`${inputId}-tab-${i}`} aria-controls={`${inputId}-panel-${i}`} aria-selected={selected===i} tabIndex={selected===i?0:-1} onKeyDown={event=>{const count=block.tabs.length;const nextIndex=event.key==="ArrowRight"?(i+1)%count:event.key==="ArrowLeft"?(i+count-1)%count:event.key==="Home"?0:event.key==="End"?count-1:undefined;if(nextIndex!==undefined){event.preventDefault();field(key,String(nextIndex));document.getElementById(`${inputId}-tab-${nextIndex}`)?.focus();}}} onClick={()=>field(key,String(i))}>{tab.label}</button>)}</div>{block.tabs.map((tab,i)=><div key={i} role="tabpanel" id={`${inputId}-panel-${i}`} aria-labelledby={`${inputId}-tab-${i}`} hidden={selected!==i}><Rich text={tab.body}/></div>)}</section>;}
      case "timeline":return <section>{block.heading?<h2>{block.heading}</h2>:null}<ol className="course-timeline">{block.events.map((event,i)=><li key={i}><h3>{event.year} — {event.title}</h3><Rich text={event.body}/></li>)}</ol></section>;
      case "knowledgeCheck":{const chosen=state.fields[key];const checked=state.submitted[key];const correct=block.options[Number(chosen)]?.correct;return <fieldset><legend>{block.question}</legend>{block.options.map((option,i)=><label key={i} className="course-choice"><input type="radio" name={inputId} checked={chosen===String(i)} onChange={()=>field(key,String(i))}/><Rich text={option.text}/></label>)}<button disabled={!loaded||chosen===undefined||chosen===""} onClick={()=>submit(key)}>Check answer</button><button onClick={()=>reset(key)}>Try again</button>{checked?<div role="status"><Rich text={correct?block.feedbackCorrect:block.feedbackIncorrect}/></div>:null}</fieldset>;}
      case "sorting":{const selections=block.items.map((_,i)=>state.fields[`${key}-${i}`]??"");return <fieldset><legend>{block.heading??"Match each example"}</legend>{block.items.map((item,i)=><label className="course-sort" key={i}><Rich text={item.text}/><select aria-label={`Category for ${item.text.replace(/<[^>]*>/g,"")}`} value={selections[i]} onChange={event=>save({...state,fields:{...state.fields,[`${key}-${i}`]:event.target.value},submitted:{...state.submitted,[key]:false}})}><option value="">Choose a category</option>{block.categories.map(category=><option key={category}>{category}</option>)}</select>{state.submitted[key]?<span>{selections[i]===item.category?"That fits.":`Consider: ${item.category}`}</span>:null}</label>)}<button disabled={!loaded||selections.some(value=>!value)} onClick={()=>submit(key)}>Check matches</button><button onClick={()=>save({...state,fields:{...state.fields,...Object.fromEntries(block.items.map((_,i)=>[`${key}-${i}`,""]))},submitted:{...state.submitted,[key]:false}})}>Reset</button></fieldset>;}
      case "artifact":return <section><h2>{block.title}</h2><Rich text={block.summary}/>{block.fields.map((item,i)=><p className="course-note" key={i}><strong>{item.label}</strong> {item.value}</p>)}<Rich text={block.action}/><p className="notice" role="note">Download this example to adapt it in your own document.</p><button onClick={()=>downloadDraft(block.title+"\n\n"+block.fields.map((item)=>item.label+": "+item.value).join("\n\n"),index)}>Download this example</button></section>;
      default:throw new Error(`Unsupported course block: ${block.type}`);
    }
  }
  // The lesson's closing parts (a situation to try, what to carry forward, a next step, and
  // the authored "put it into practice" and "continue your learning" blocks) used to stack as
  // five or six full sections. They now share one "Finish this lesson" area with a tab for each
  // part. Every word is still on the page; only one part is open at a time.
  const closingIndexes=lesson.blocks.flatMap((block,index)=>"heading" in block&&typeof block.heading==="string"&&CLOSING_BLOCK_HEADINGS.test(block.heading.trim())?[index]:[]);
  const finishParts:Array<{label:string;body:ReactNode}>=[
    ...(lesson.scenario?[{label:"Try a situation",body:<><Rich text={lesson.scenario.context}/><fieldset><legend>{lesson.scenario.prompt}</legend>{lesson.scenario.options.map((option,i)=><label className="course-choice" key={i}><input type="radio" name={`${uid}-scenario`} checked={state.fields.scenario===String(i)} onChange={()=>field("scenario",String(i))}/><Rich text={option.label}/></label>)}<button disabled={!state.fields.scenario} onClick={()=>submit("scenario")}>Consider your choice</button><button onClick={()=>reset("scenario")}>Try another response</button>{state.submitted.scenario?<div role="status"><Rich text={lesson.scenario.options[Number(state.fields.scenario)]?.response??""}/></div>:null}</fieldset></>}]:[]),
    ...(lesson.learning?.takeaways.length?[{label:"Carry this forward",body:<><ul>{lesson.learning.takeaways.map((item,i)=><li key={i}><Rich text={item}/></li>)}</ul><Rich text={lesson.learning.evidence}/><Rich text={lesson.learning.appliedNextStep}/></>}]:[]),
    ...(lesson.transfer?[{label:"Your next step",body:<><Rich text={lesson.transfer.prompt}/>{lesson.transfer.options.map((option,i)=><label className="course-choice" key={i}><input type="radio" name={`${uid}-transfer`} checked={state.fields.transfer===String(i)} onChange={()=>field("transfer",String(i))}/><Rich text={option}/></label>)}</>}]:[]),
    ...closingIndexes.map(index=>{const block=lesson.blocks[index];return {label:("heading" in block&&typeof block.heading==="string"?block.heading:"More"),body:<div className="course-finish-block" data-course-block={block.type}>{render(block,index)}</div>};}),
  ];
  const savedFinish=Number(state.fields.finish??0);
  const finishSelected=Number.isInteger(savedFinish)&&savedFinish>=0&&savedFinish<finishParts.length?savedFinish:0;
  const finishId=`${uid}-finish`;
  return <article className="course-lesson"><p>{lesson.minutes} minutes</p><h1>{lesson.title}</h1><Rich text={lesson.summary}/><section><h2>What you’ll be able to do</h2><ul>{objectives.map((objective,i)=><li key={i}>{objective}</li>)}</ul></section><GeffenLessonReadAloud courseId={courseId} lesson={lesson} objectives={objectives} />{courseId === "gc-structural-racism" && lesson.id === "gc-structural-racism-1" ? <CourseAudioDiscussion id="gc-structural-racism" /> : null}<fieldset disabled={!loaded} className="course-activities">{lesson.blocks.map((block,index)=>closingIndexes.includes(index)?null:<div key={index} data-course-block={block.type}>{render(block,index)}{courseId === "gc-structural-racism" && lesson.id === "gc-structural-racism-1" ? <CourseAudioGuidance id="gc-structural-racism" afterBlock={index} /> : null}</div>)}
    {companion}
    {courseId === "gc-structural-racism" && lesson.id === "gc-structural-racism-1" ? <CourseAudioGuidance id="gc-structural-racism" beforeScenario /> : null}
    {finishParts.length?<section className="course-finish" aria-labelledby={`${finishId}-title`}><h2 id={`${finishId}-title`}>Finish this lesson</h2>
      {finishParts.length>1?<div role="tablist" aria-label="Finish this lesson">{finishParts.map((part,i)=><button key={i} type="button" role="tab" id={`${finishId}-tab-${i}`} aria-controls={`${finishId}-panel-${i}`} aria-selected={finishSelected===i} tabIndex={finishSelected===i?0:-1} onKeyDown={event=>{const count=finishParts.length;const nextIndex=event.key==="ArrowRight"?(i+1)%count:event.key==="ArrowLeft"?(i+count-1)%count:event.key==="Home"?0:event.key==="End"?count-1:undefined;if(nextIndex!==undefined){event.preventDefault();field("finish",String(nextIndex));document.getElementById(`${finishId}-tab-${nextIndex}`)?.focus();}}} onClick={()=>field("finish",String(i))}>{part.label}</button>)}</div>:<h3>{finishParts[0].label}</h3>}
      {finishParts.map((part,i)=><div key={i} className="course-finish-panel" role={finishParts.length>1?"tabpanel":undefined} id={`${finishId}-panel-${i}`} aria-labelledby={finishParts.length>1?`${finishId}-tab-${i}`:undefined} hidden={finishParts.length>1&&finishSelected!==i}>{part.body}</div>)}
    </section>:null}
    <p className="notice" role="note">Your activity choices and lesson progress are saved in this browser. Keep any personal reflection notes in your own document.</p>
    <label className="course-choice"><input type="checkbox" checked={state.completed} onChange={event=>save({...state,completed:event.target.checked})}/>Mark this lesson complete</label>
    <button onClick={()=>{if(window.confirm("Clear your answers and progress for this lesson?"))save(blank());}}>Reset this lesson</button></fieldset><p role="status">{message}</p><nav aria-label="Lesson navigation">{previous?<Link href={previous}>Previous lesson</Link>:<Link href={overviewHref}>Course overview</Link>}{next?<Link href={next}>Next lesson</Link>:<Link href={overviewHref}>Back to course</Link>}</nav></article>;
}
