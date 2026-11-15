
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import SequenceVideo from "@/app/learn/equity-in-practice/sequence-video";
import { PageIntro } from "@/components/ui";
import { Hub2Choices, Hub2More } from "@/components/hub2-choices";
import { PrintOpenPanels } from "@/components/rp-print-open-panels";
import guideMedia from "@/lib/program/end-user-guide-media.json";
import { USER_GUIDE } from "@/lib/program/user-guide";

export const metadata = { title: USER_GUIDE.title };

/** The end-user guide: three ways in, then one closed panel per topic. Its words match the download. */
export default function UserGuide() {
  return <>
    <PageIntro kicker="Help when you need it" title={USER_GUIDE.title} lede={USER_GUIDE.lede}>
      <p className="mt-4"><SourceLink href={USER_GUIDE.download} download>Download this guide as text</SourceLink></p>
    </PageIntro>
    <div className="wrap space-y-6 py-8">
      <Hub2Choices label="Three places to start" className="lg:grid-cols-3" choices={USER_GUIDE.choices.map(choice => ({ ...choice }))} />
      {guideMedia.ready ? <Hub2More id="welcome-video" title={guideMedia.title}>
        <p className="my-3">{guideMedia.runtime}</p>
        <SequenceVideo className="block aspect-video w-full rounded-lg bg-white" src={guideMedia.src} poster={guideMedia.poster} title={guideMedia.title} />
        <p className="mt-4"><SourceLink href={guideMedia.transcript}>Read the transcript</SourceLink> · <SourceLink href={guideMedia.captions}>Download the captions</SourceLink></p>
      </Hub2More> : null}
      <div>
        {USER_GUIDE.sections.map(section => <Hub2More key={section.id} id={section.id} title={section.title}>
          {section.paras.map(text => <p key={text} className="max-w-3xl leading-7">{text}</p>)}
          {section.links.length ? <p className="flex flex-wrap gap-x-6 gap-y-2">{section.links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</p> : null}
        </Hub2More>)}
      </div>
    </div>
    <PrintOpenPanels />
  </>;
}
