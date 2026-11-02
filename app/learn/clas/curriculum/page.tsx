import ClasCurriculum from '@/components/clas-curriculum';
import { loadClasFrontPageData } from '@/lib/content/clas-curriculum-page-data';
export const metadata={title:'National CLAS Standards: putting equity into your work'};
export default function Page(){return <ClasCurriculum front={loadClasFrontPageData()}/>;}
