"use client";
import {useCallback,useSyncExternalStore} from "react";
import Link from "next/link";

function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener('pageshow',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('pageshow',callback);};}
const serverSnapshot=()=>"[]";
type Entry={number:string;title:string;page:number;visitedAt:string};
export function SelfDirectedContinue({courses}:{courses:{number:string;title:string}[]}){
 const snapshot=useCallback(()=>{const found:Entry[]=[];for(const course of courses){try{const saved=JSON.parse(localStorage.getItem('one-dsd-learning-'+course.number)||'null');if(saved&&Number.isInteger(saved.page)&&saved.page>0&&saved.page<1000)found.push({number:course.number,title:course.title,page:saved.page,visitedAt:typeof saved.visitedAt==='string'?saved.visitedAt:''});}catch{}}return JSON.stringify(found.sort((a,b)=>b.visitedAt.localeCompare(a.visitedAt)).slice(0,6));},[courses]);
 const raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 const entries=JSON.parse(raw) as Entry[];
 if(!entries.length)return null;
 return <section className="dsd-work-card" aria-labelledby="continue-courses"><h2 id="continue-courses">Continue your learning</h2><p>Pick up a course where you left off. This is a bookmark for you, not a record of completion.</p><ul>{entries.map(entry=><li key={entry.number}><Link href={'/learn/self-directed?course='+entry.number}>{entry.title}</Link> · saved page {entry.page}</li>)}</ul><Link href="/learn/self-directed">Explore the learning series</Link></section>;
}
