import styles from "@/components/dsd-experience.module.css";
import { LearningJourneyLink } from "@/components/learning-journey-link";
import Link from "next/link";
import guideMedia from "@/lib/program/end-user-guide-media.json";
import { EngagementRouteMap } from "@/components/multimedia/engagement-route-map";

/** The former orientation page, now a section of Start. Several doors into the same program, in no required order. */
const doors = [
["Understand the setting", "See how DHS is organized, where the Disability Services Division fits within the Aging and Disability Services Administration, and how decisions travel between them.", "/understanding-dhs", "Understanding DHS"],
["Ground the work in equity", "Follow how equity moves from a value statement into decisions, everyday practice, service design, and the way we learn from results.", "/operationalizing-equity", "Operationalizing equity"],
["Find your work in the program", "Explore the division’s programs, the people who rely on them, and the decisions that shape their experience of services.", "/one-dsd/programs", "DSD programs and services"],
["Learn something useful", "Courses, readings, and recordings organized around real questions, from a first conversation about bias to the design of an accessible system.", "/learn", "Explore learning"],
["Put an idea into practice", "Work through a real decision with a guided practice, from a ten-minute equity check to an in-depth review.", "/practice", "Explore practice"],
["Help shape practical change", "Connect a work question with evidence, the people affected, and a next step you can actually take.", "/my-work/plan", "Plan and review your work"],
["Explore a different perspective", "Choose a reading, weigh its ideas against your own experience, and bring a sharper question into your work or a team conversation.", "/learn/readings/pathways", "Find a reading path"],
["Find community and shared perspective", "DHS employee resource groups and the statewide network, each with links to their own information.", "/employee-resource-groups", "Explore employee resource groups"],
["Learn about Minnesota communities", "Community perspectives and context that can inform relationships, engagement, and service decisions, without reducing anyone to a profile.", "/minnesota-communities", "Explore Minnesota Communities"],
["Grow your leadership practice", "Find your starting point as an aspiring or current leader, build a development map, and look at equity across the whole employee life cycle.", "/practice/gp-11", "Explore leadership practice"],
["Bring your questions", "Ask a question in your own words and get a considered answer, with its sources and limits made clear.", "/ask", "Ask a question"],
["Find the right support", "Connect with professional support when a conversation or an extra pair of hands would make the work easier.", "/support", "Explore support"]];

function renderDoor([title, body, href, label]: string[]) {
  return <article key={href} className={styles.orientationItem}><h3 className="text-2xl font-semibold">{title}</h3><p className="my-4 leading-7">{body}</p><Link className="font-semibold" href={href}>{label}</Link></article>;
}

export function NewToDsd() {
  return <section id="new-to-dsd" className={`${styles.orientationPage} scroll-mt-24 space-y-7 border-t border-line pt-8`}>
    <div>
      <h2 className="text-3xl font-semibold">New to DSD, or taking a fresh look?</h2>
      <p className="mt-4 max-w-3xl text-lg leading-8">Welcome. Whether you joined the division last week or have years of experience behind you, this program is built to meet you where you are. It brings together learning, practical tools, and the people and perspectives that shape disability services in Minnesota. Taking part is voluntary; existing agency requirements, including required equity analysis, still apply.</p>
      <p className="mt-4 max-w-3xl leading-7">A few ways to get your bearings: <Link href="/user-guide">how to use this site</Link>, <Link href="/program/model#work-examples">everyday examples of the program at work</Link>{guideMedia.ready ? <>, or <Link href="/user-guide#welcome-video">a short video introduction</Link></> : null}.</p>
    </div>
    <LearningJourneyLink compact />
    <div id="program-directory" className="scroll-mt-24">
      <h3 className="text-2xl font-semibold">Several doors into the same program</h3>
      <p className="mt-3 max-w-3xl leading-7">There is no required order. Choose the door that matches your question today; every one of them leads back to the same shared work.</p>
      <EngagementRouteMap doors={doors.map(([title, , href, label]) => ({ title, href, label }))} />
      <div className={styles.orientationDirectory}>{doors.slice(0, 5).map(renderDoor)}</div>
      <details className="mt-7 border-y border-line py-5"><summary className="cursor-pointer text-xl font-semibold">More ways to connect, lead, and find support</summary><div className={styles.orientationDirectory}>{doors.slice(5).map(renderDoor)}</div></details>
    </div>
    <div id="find-your-division" className={`${styles.welcomeNote} scroll-mt-24 rounded-xl border border-line p-7`}>
      <h3 className="text-2xl font-semibold">Your place in One DSD</h3>
      <p className="mt-4 leading-8">You belong to a division with its own programs, colleagues, and shared commitments. Explore the division’s programs, connect with people through the One DSD Team and Amplify Equity, and use the learning and tools here to strengthen a real piece of work. DSD sits within the Aging and Disability Services Administration at Minnesota DHS, and agency policy and delegated responsibilities continue to guide decisions.</p>
      <p className="mt-4"><Link href="/one-dsd/team">Explore the One DSD Team</Link> · <Link href="/one-dsd/amplify">Amplify Equity</Link></p>
    </div>
  </section>;
}
