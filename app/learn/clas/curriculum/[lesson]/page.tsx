import {notFound} from 'next/navigation';
import ClasCurriculum from '@/components/clas-curriculum';
import curriculum from '@/lib/content/clas-curriculum.json';
import { loadClasLessonPageData } from '@/lib/content/clas-curriculum-page-data';
export function generateStaticParams(){return curriculum.modules.map(m=>({lesson:m.id}));}
export async function generateMetadata({params}:{params:Promise<{lesson:string}>}){const {lesson}=await params;return {title:curriculum.modules.find(m=>m.id===lesson)?.title||'CLAS learning'};}
export default async function Page({params}:{params:Promise<{lesson:string}>}){const {lesson}=await params;if(!curriculum.modules.some(m=>m.id===lesson))notFound();return <ClasCurriculum key={lesson} lessonId={lesson} data={loadClasLessonPageData(lesson)}/>;}
