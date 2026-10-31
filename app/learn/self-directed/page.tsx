import {redirect} from 'next/navigation';
export default async function SelfDirectedPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams;
  const query=new URLSearchParams();
  if(typeof params.course==='string'&&/^[FIA](0[1-9]|1[0-9]|2[0-4])$/.test(params.course))query.set('course',params.course);
  if(params.curriculum==='policy')query.set('curriculum','policy');
  redirect('/learning/self-directed/index.html'+(query.size?'?'+query.toString():''));
}
