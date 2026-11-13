"use client";
import { SourceLink } from "@/components/app-link";

import { useEffect, useState } from "react";
import { LearningAudio } from "@/components/learning-audio";
import { FeaturedMediaPanel } from "@/components/featured-media-panel";
type Guidance = {kind?:string;id:string;title:string;text:string;src?:string;afterBlock?:number;beforeScenario?:boolean};
type Discussion = { guidance?:Guidance[]; checkIn?:string; title:string; src:string; before:string; after:string; turns:{host:string;text:string}[] };
export function CourseAudioDiscussion({id}:{id:string}) {
 const [discussion,setDiscussion]=useState<Discussion>();
 useEffect(()=>{let active=true; fetch(`/learning/audio-discussions/${encodeURIComponent(id)}.json`).then(r=>r.ok?r.json():null).then(value=>{if(active&&value)setDiscussion(value);}).catch(()=>{});return()=>{active=false;};},[id]);
 if(!discussion)return null;
 return <FeaturedMediaPanel kind="audio"><section aria-label="Listen and reflect"><h2>{discussion.title}</h2><p>{discussion.before}</p><p>You can listen or read the conversation below, at your own pace.</p><LearningAudio src={discussion.src} title={discussion.title} /><p><SourceLink href={discussion.src} download>Download the discussion</SourceLink></p><details><summary>Read the complete conversation</summary>{discussion.turns.map((turn,index)=><p key={index}><strong>{turn.host==="host1"?"Host":"Co-host"}</strong><br/>{turn.text}</p>)}</details><p>{discussion.after}</p>{discussion.checkIn ? <details><summary>A moment to reflect</summary><p>{discussion.checkIn}</p></details> : null}</section></FeaturedMediaPanel>;
}

export function CourseAudioGuidance({id,afterBlock,beforeScenario}:{id:string;afterBlock?:number;beforeScenario?:boolean}) {
 const [clips,setClips]=useState<Guidance[]>([]);
 useEffect(()=>{let active=true;fetch(`/learning/audio-discussions/${encodeURIComponent(id)}.json`).then(r=>r.ok?r.json():null).then(d=>{if(active)setClips(d?.guidance??[]);}).catch(()=>{});return()=>{active=false;};},[id]);
 const selected=clips.filter(c=>beforeScenario?c.beforeScenario:afterBlock!==undefined&&c.afterBlock===afterBlock);
 if(!selected.length)return null;
 return <aside aria-label="A little more to consider">{selected.map(c=><section key={c.id}><h2>{c.title}</h2>{c.src?<><LearningAudio src={c.src} title={c.title} /><p><SourceLink href={c.src} download>Download audio</SourceLink></p></>:null}<details open={!c.src}><summary>{c.kind==="explainer"?"Read this explanation":"Read this reflection"}</summary><p>{c.text}</p></details></section>)}</aside>;
}
