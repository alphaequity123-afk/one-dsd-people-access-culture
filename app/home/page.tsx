import Image from "next/image";
import Link from "next/link";
import { CultureCalendarSection } from "@/components/culture-calendar-section";
import { HomeTaskFinder } from "@/components/home-task-finder";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import "./task-home.css";

export default async function HomePage() {
  const culturalIntelligenceAvailable = await culturalIntelligenceHubAvailable();
  return <div className="dsd-home">
    <section className="dsd-shell dsd-welcome" aria-labelledby="home-title">
      <div><p className="dsd-eyebrow">One DSD People, Access and Culture</p><h1 id="home-title">People, access<br />and culture.</h1></div>
      <div className="dsd-welcome-copy"><p>Make equity part of the work and the workplace.</p><p>Find learning, guidance and tools to apply equity in the work and workplace of the Disability Services Division. Connect service delivery, policy, community knowledge and employee experience within Minnesota DHS.</p><div className="dsd-home-actions"><Link href="/one-dsd/programs">Explore DSD programs and services <span aria-hidden="true">→</span></Link><Link href="#start-here">Find a resource for your work <span aria-hidden="true">↓</span></Link></div></div>
    </section>
    <div className="dsd-shell"><Image className="dsd-home-photo" src="/images/people-access-culture-hero-20261025.webp" width={3840} height={1748} alt="Eight colleagues sharing perspectives around a conference table." preload quality={90} sizes="(max-width: 760px) calc(100vw - 36px), (max-width: 1224px) calc(100vw - 64px), 1160px" /></div>
    <div className="dsd-shell"><CultureCalendarSection /></div>
<div className="od">
  <div className="start" id="start-here"><div className="w">
    <h2>Find a resource for your work</h2>
    <p className="lead">Tell us what you're doing and we'll take you to the right place.</p>
    <HomeTaskFinder />
  </div></div>

  <div className="blk"><div className="w">
    <h2 className="sh">Find what you need</h2><p className="sd">Everything on the site, organized by what you're doing.</p>
    <div className="topics">
      <div className="topic"><div className="bar"></div><div className="in"><h3>Learn</h3><p>Build your understanding.</p><ul><li><Link href="/learn">Browse learning</Link></li>{culturalIntelligenceAvailable && <li><Link href="/learn/cultural-intelligence">Explore Cultural Intelligence</Link></li>}<li><Link href="/operationalizing-equity">Operationalizing equity</Link></li><li><Link href="/learn/collaboration">Work better across teams</Link></li><li><Link href="/library">Resource library</Link></li></ul></div></div>
      <div className="topic"><div className="bar"></div><div className="in"><h3>Apply a tool</h3><p>Work through a real decision.</p><ul><li><Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link></li><li><Link href="/equity-review">Review a policy or service change</Link></li><li><Link href="/practice/gp-3">Prepare for community engagement</Link></li><li><Link href="/one-dsd#scenarios">DSD scenarios</Link></li></ul></div></div>
      <div className="topic"><div className="bar"></div><div className="in"><h3>Get support</h3><p>Guidance, people and answers.</p><ul><li><Link href="/support/right-person">Find the right person or office</Link></li><li><Link href="/ask">Ask</Link></li><li><Link href="/one-dsd/team">One DSD Team</Link></li><li><Link href="/user-guide">How to use this site</Link></li></ul></div></div>
    </div>
  </div></div>

  <div className="blk band"><div className="w feature">
    <div className="copy"><p className="kicker">FROM SHARED PURPOSE TO EVERYDAY WORK</p><h2>Equity in practice</h2><p>Understand the Equity Outcome Map, then follow DSD examples that connect the six goals of the Aging and Disability Services Administration with useful tools and learning.</p><Link className="btn" href="/learn/equity-in-practice">Watch the two-part story</Link></div>
    <div className="pair">
      <Link className="pc" href="/operationalizing-equity"><h3>Operationalizing equity</h3><p>Turn an intention into practical action: consider how work is designed, whose perspectives shape it, and where barriers can be reduced.</p></Link>
      <Link className="pc" href="/learn/equity-toolkit"><h3>Equity Analysis Toolkit</h3><p>Examine a proposal or decision: consider its effects, compare alternatives, and involve the people who will be affected.</p></Link>
    </div>
  </div></div>

  <div className="blk"><div className="w">
    <h2 className="sh">Explore DSD and the program</h2><p className="sd">How equity connects to the Division's services and the program behind this site.</p>
    <div className="links">
      <Link href="/one-dsd/programs">DSD programs and services</Link><Link href="/one-dsd/amplify">Amplify Equity</Link><Link href="/one-dsd/planning">Planning and progress</Link><Link href="/start">Getting started</Link><Link href="/leading">For supervisors and managers</Link>
      <Link href="/program/model">How the program works</Link><Link href="/program-foundation">Program charter</Link><Link href="/equity-policy">DHS equity policy</Link><Link href="/program/impact">Long-term impact</Link>
    </div>
  </div></div>
</div>
  </div>;
}
