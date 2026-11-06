import {notFound} from 'next/navigation';
import { ResourceDownloads } from '@/components/resource-downloads';
import ClasCurriculum from '@/components/clas-curriculum';
import curriculum from '@/lib/content/clas-curriculum.json';
import { loadClasLessonPageData } from '@/lib/content/clas-curriculum-page-data';
export function generateStaticParams(){return curriculum.modules.map(m=>({lesson:m.id}));}
export async function generateMetadata({params}:{params:Promise<{lesson:string}>}){const {lesson}=await params;return {title:curriculum.modules.find(m=>m.id===lesson)?.title||'CLAS learning'};}
export default async function Page({params}:{params:Promise<{lesson:string}>}){const {lesson}=await params;if(!curriculum.modules.some(m=>m.id===lesson))notFound();return <><div className="mx-auto max-w-[1120px] px-4 pt-6 sm:px-6 print:hidden"><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this lesson</summary><ResourceDownloads kind="clas-lesson" id={lesson} noun="lesson" /></details></div><ClasCurriculum key={lesson} lessonId={lesson} data={loadClasLessonPageData(lesson)}/></>;}
