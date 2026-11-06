import { ResourceDownloads } from '@/components/resource-downloads';
import ClasCurriculum from '@/components/clas-curriculum';
import { loadClasFrontPageData } from '@/lib/content/clas-curriculum-page-data';
export const metadata={title:'National Culturally and Linguistically Appropriate Services Standards: putting equity into your work'};
export default function Page(){return <><div className="mx-auto max-w-[1120px] px-4 pt-6 sm:px-6 print:hidden"><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this curriculum</summary><ResourceDownloads kind="clas-curriculum" id="curriculum" noun="curriculum" /></details></div><ClasCurriculum front={loadClasFrontPageData()}/></>;}
