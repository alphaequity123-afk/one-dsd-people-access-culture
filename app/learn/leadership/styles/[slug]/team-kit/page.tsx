import Link from "next/link";
import { notFound } from "next/navigation";
import { getStyle, leadershipStyles, styleHref } from "@/lib/dsd-live/leadership/styles";
import { momentFor } from "@/lib/dsd-live/leadership/in-the-moment";
import { currentUnit } from "@/lib/dsd-live/unit";
import { PrintButton } from "@/components/dsd-live/print-button";

const FIT_WORDS = { strong: "A strong fit for this moment", partial: "Helps in part", risky: "Likely to backfire" } as const;

export function generateStaticParams() {
  return leadershipStyles.map(style => ({ slug: style.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const style = getStyle(slug);
  return { title: style ? `Team discussion kit: ${style.name}` : "Team discussion kit" };
}

/** A printable 20-minute team discussion built on the style's "In the moment" situation (owner decision 2026-11-22). */
export default async function TeamKit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const style = getStyle(slug);
  const unit = currentUnit();
  const moment = style ? momentFor(style.slug, unit.id) : undefined;
  if (!style || !moment) notFound();
  const name = style.name;
  return <div className="team-kit">
    <p className="team-kit-back no-print"><Link href={styleHref(style.slug)}>{name}</Link> · <Link href="/learn/leadership/team-kits">All team discussion kits</Link></p>
    <header>
      <p className="eyebrow">Team discussion kit · about 20 minutes</p>
      <h1>{name}: in the moment</h1>
      <p>A short discussion for a team meeting. One person guides it; no preparation is needed beyond reading this page once.</p>
      <p className="no-print"><PrintButton /></p>
    </header>

    <section aria-labelledby="kit-plan">
      <h2 id="kit-plan">The plan</h2>
      <ol className="team-kit-plan">
        <li><strong>2 minutes · Set the tone.</strong> Explain that this is practice, not a test. There are no wrong answers, and nobody&apos;s choice is judged.</li>
        <li><strong>3 minutes · Read the situation.</strong> Read it aloud, then give everyone a minute to choose a response on their own.</li>
        <li><strong>5 minutes · Talk in pairs.</strong> Each person explains their choice and what they were weighing.</li>
        <li><strong>6 minutes · Compare all three.</strong> Read the notes on each response together. Ask what surprised people.</li>
        <li><strong>4 minutes · Bring it home.</strong> Discuss the reflection question, and invite each person to name one thing to try this week.</li>
      </ol>
    </section>

    <section aria-labelledby="kit-situation" className="team-kit-situation">
      <h2 id="kit-situation">The situation</h2>
      <p>{moment.situation}</p>
      <p><strong>{moment.question}</strong></p>
      <ol type="A">{moment.responses.map(r => <li key={r.id}>{r.text}</li>)}</ol>
    </section>

    <section aria-labelledby="kit-notes">
      <h2 id="kit-notes">Notes on each response</h2>
      <p>Share these after people have chosen and talked.</p>
      <div className="team-kit-notes">{moment.responses.map((r, i) => <div key={r.id} className={`moment-result moment-${r.fit}`}>
        <p className="moment-fit">{String.fromCharCode(65 + i)} · {FIT_WORDS[r.fit]}</p>
        <p>{r.feedback}</p>
        <dl>
          <div><dt>For staff</dt><dd>{r.staff}</dd></div>
          <div><dt>For fair service</dt><dd>{r.service}</dd></div>
        </dl>
      </div>)}</div>
    </section>

    <section aria-labelledby="kit-questions">
      <h2 id="kit-questions">Questions for the group</h2>
      <ul>
        <li>Which response felt most natural to you, and why?</li>
        <li>What would the people we serve notice about each response?</li>
        <li>What makes the strongest response hard to do on a busy day?</li>
        <li>{moment.reflection}</li>
      </ul>
    </section>

    <section aria-labelledby="kit-close">
      <h2 id="kit-close">Close with one commitment</h2>
      <p>Invite each person to finish this sentence, privately or aloud: <em>&ldquo;This week, I&apos;ll…&rdquo;</em></p>
      <p>An example: {moment.tryThisWeek}</p>
    </section>

    <section aria-labelledby="kit-guide" className="team-kit-guide">
      <h2 id="kit-guide">For the person guiding</h2>
      <ul>
        <li>Go first when the room is quiet. Share a time you chose the weaker response.</li>
        <li>Keep the focus on approaches, not on anyone&apos;s character.</li>
        <li>Offer a way to take part without speaking: writing, pointing to a letter, or passing.</li>
        <li>If an interpreter or captioning is in the room, slow the pace and share this page beforehand.</li>
      </ul>
    </section>
  </div>;
}
