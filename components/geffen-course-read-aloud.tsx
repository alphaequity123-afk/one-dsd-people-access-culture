'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { courseReadAloudSections, lessonReadAloudSections, type CourseReadAloudSection } from '@/lib/content/course-read-aloud';
import type { CoursePack, Lesson } from '@/lib/content/courses/source-types';

type Recording = { id: string; voice: 'geffen'; sourceTextHash: string; audioSha256: string; src: string; verified: true; parentSourceTextHash?: string };
type ReadySection = CourseReadAloudSection & { src: string; parentText?: string };
async function hash(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function ReadAloud({ sections, allowFullLesson = false, fullTitle = 'Listen to this lesson', fullAction = 'Listen through the lesson', fullDescription = 'Includes the teaching, examples and reflection prompts. Activities and answer feedback remain separate.' }: { sections: CourseReadAloudSection[]; allowFullLesson?: boolean; fullTitle?: string; fullAction?: string; fullDescription?: string }) {
  const [ready, setReady] = useState<ReadySection[]>([]);
  const [selected, setSelected] = useState('');
  const [failed, setFailed] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const playRequested = useRef(false);
  const [playRequestSignal, setPlayRequestSignal] = useState(0);
  const player = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!globalThis.crypto?.subtle) return;
      const courseKey = sections[0]?.id.split('/')[1];
      if (!courseKey) return;
      const response = await fetch(`/learning/geffen-read-aloud/courses/${courseKey}.json`);
      if (!response.ok || response.status === 204) return;
      const index: { format?: string; recordings?: Recording[] } = await response.json();
      if (index.format !== 'geffen-course-read-aloud-v1' || !Array.isArray(index.recordings)) return;
      const matches: ReadySection[] = [];
      for (const section of sections) {
        const sourceTextHash = await hash(section.text);
        const parent = section.parentId ? sections.find(item => item.id === section.parentId) : undefined;
        const parentHash = parent ? await hash(parent.text) : undefined;
        const clip = index.recordings.find(item => item.id === section.id && item.voice === 'geffen' && item.verified === true && item.sourceTextHash === sourceTextHash && (!section.shortAlternative || (parentHash && item.parentSourceTextHash === parentHash)) && /^[a-f0-9]{64}$/.test(item.audioSha256) && /^\/audio\/geffen-read-aloud\/[a-zA-Z0-9._/-]+\.(mp3|wav)$/.test(item.src) && !item.src.split('/').includes('..'));
        if (clip) matches.push({ ...section, src: clip.src, ...(parent ? { parentText: parent.text } : {}) });
      }
      if (active) { setReady(matches); setSelected(matches[0]?.id ?? ''); setFailed(false); setContinuous(false); playRequested.current = false; }
    }
    void load().catch(() => { if (active) setReady([]); });
    return () => { active = false; };
  }, [sections]);
  const validReady = ready.filter(section => sections.some(source => source.id === section.id && source.text === section.text && (!section.parentId || sections.some(parent => parent.id === section.parentId && parent.text === section.parentText))));
  const current = validReady.find(section => section.id === selected);
  const fullSections = sections.filter(section => !section.shortAlternative);
  const fullReady = validReady.filter(section => !section.shortAlternative);
  const fullLessonReady = allowFullLesson && fullSections.length > 0 && fullReady.length === fullSections.length;
  useEffect(() => {
    if (!playRequested.current || !current || !player.current) return;
    playRequested.current = false;
    void player.current.play().catch(() => { /* Native play remains available if the browser requires another gesture. */ });
  }, [current, playRequestSignal]);
  if (!current) return null;
  return <aside className="my-6 rounded-xl border border-line bg-white p-5" aria-label="Listen to the learning material">
    <h2 className="text-lg font-bold">{fullLessonReady ? fullTitle : 'Listen to a passage'}</h2>
    <p className="mt-2">Listen at your own pace, with the text here whenever you want to return to it.</p>
    {fullLessonReady ? <div className="mt-3"><button type="button" className="btn" onClick={() => { setSelected(fullReady[0].id); setContinuous(true); setFailed(false); playRequested.current = true; setPlayRequestSignal(value => value + 1); }}>{fullAction}</button><p className="mt-2 text-sm">{fullDescription}</p></div> : null}
    {validReady.length > 1 ? <label className="mt-3 block">Choose a passage<select className="mt-1 block w-full" value={selected} onChange={event => { player.current?.pause(); setSelected(event.target.value); setFailed(false); setContinuous(false); playRequested.current = false; }}>{validReady.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label> : <p className="mt-3 font-semibold">{current.title}</p>}
    <audio ref={player} key={current.src} className="mt-3 w-full" controls preload="none" src={current.src} aria-label={`Listen: ${current.title}`} onError={() => { setFailed(true); setContinuous(false); }} onPlay={event => document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(other => { if (other !== event.currentTarget) other.pause(); })} onEnded={() => {
      if (!continuous || !fullLessonReady) return;
      const next = fullReady[fullReady.findIndex(section => section.id === selected) + 1];
      if (next) { setSelected(next.id); playRequested.current = true; setPlayRequestSignal(value => value + 1); } else setContinuous(false);
    }} />
    {failed ? <p role="status" className="mt-2">This recording could not be played. You can continue with the text.</p> : null}
  </aside>;
}

export function GeffenLessonReadAloud({ courseId, lesson, objectives }: { courseId: string; lesson: Lesson; objectives?: readonly string[] }) {
  const sections = useMemo(() => lessonReadAloudSections(courseId, lesson, objectives), [courseId, lesson, objectives]);
  return <ReadAloud sections={sections} allowFullLesson />;
}
export function GeffenCourseReadAloud({ pack }: { pack: CoursePack }) {
  const sections = useMemo(() => courseReadAloudSections(pack), [pack]);
  return <ReadAloud sections={sections} allowFullLesson fullTitle="Listen to this guide" fullAction="Listen through the guide" fullDescription="Includes the course introduction and practical guide." />;
}
