"use client";
import { useState } from "react";

const clips = [
  { file: "first-contact-dead-end", version: "891577709c23", title: "When support comes after the barrier", transcript: "Imagine calling for help and hearing a message you cannot understand. The voicemail asks you to leave your name, number, and reason for calling, but language support is only offered after someone calls you back. The person needs help getting through the very first step. As you listen, consider what your team could put in place before that call arrives." },
  { file: "first-contact-supported", version: "9c85ba2adaa6", title: "Connect support with the first contact", transcript: "Now consider a first contact designed around the caller’s needs. The person can request language support and reach a staff member with qualified interpretation. The worker says: I can help with the next step. Let’s confirm the language support you requested and the best way to contact you. What would you like us to clarify before we continue? Behind that conversation, the team needs a tested way to connect the caller, the right staffing, and reliable follow-up." },
];

function Clip({ file, version, title, transcript }: typeof clips[number]) {
  const [failed, setFailed] = useState(false);
  return <figure className="m-0 rounded-xl border border-slate-300 bg-white p-5"><figcaption className="font-semibold">{title}</figcaption>
    <audio controls preload="none" aria-label={title} className="my-4 w-full" onError={() => setFailed(true)} onPlay={event => document.querySelectorAll<HTMLMediaElement>("audio, video").forEach(other => { if (other !== event.currentTarget) other.pause(); })}><source src={"/audio/learning-examples/" + file + ".wav?v=" + version} type="audio/wav" />Read the complete transcript below.</audio>
    {failed && <p role="status">This recording could not be played. The complete transcript is available below.</p>}
    <details><summary className="cursor-pointer font-semibold">Read the complete transcript</summary><p className="mt-3 leading-7">{transcript}</p></details>
  </figure>;
}

export function DsdFirstContactAudio() {
  return <section aria-labelledby="first-contact-listening-title" className="my-6 rounded-xl border border-slate-300 bg-[#f5f8fa] p-5"><h3 id="first-contact-listening-title" className="text-xl font-semibold">Listen for where the route breaks down</h3>
    <p className="my-4 leading-7">Two practice examples you can read or listen to. Both describe language-access arrangements in English; neither performs translation or interpretation.</p>
    <div className="grid gap-5 md:grid-cols-2">{clips.map(clip => <Clip key={clip.file} {...clip} />)}</div>
    <p className="mt-4 leading-7">Which arrangement must exist before a caller can use the first contact? Identify who would verify it and own the follow-up.</p>
  </section>;
}
