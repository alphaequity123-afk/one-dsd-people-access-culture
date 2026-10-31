"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./policy-presentation-reader.module.css";

export type PolicySlide = { number: number; title: string; text: string[]; image: string };

export function PolicyPresentationReader({ slides }: { slides: PolicySlide[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  if (!slide) return <p>The presentation is available through the downloads above.</p>;
  const previous = () => setIndex(value => Math.max(0, value - 1));
  const next = () => setIndex(value => Math.min(slides.length - 1, value + 1));
  return <section className={styles.reader} aria-label="Policy review presentation">
    <div className={styles.controls}>
      <button type="button" onClick={previous} disabled={index === 0}>← Previous</button>
      <label>Choose a slide<select value={index} onChange={event => setIndex(Number(event.target.value))}>{slides.map((item, position) => <option value={position} key={item.number}>{item.number}. {item.title}</option>)}</select></label>
      <button type="button" onClick={next} disabled={index === slides.length - 1}>Next →</button>
    </div>
    <p role="status" className={styles.position}>Slide {index + 1} of {slides.length}</p>
    <h2>{slide.title}</h2>
    <div className={styles.frame} role="group" tabIndex={0} aria-label={`Slide ${index + 1}. Use the left and right arrow keys to move between slides. Home goes to the first slide; End goes to the last.`} onKeyDown={event => {
      if (event.key === "ArrowLeft") { event.preventDefault(); previous(); }
      if (event.key === "ArrowRight") { event.preventDefault(); next(); }
      if (event.key === "Home") { event.preventDefault(); setIndex(0); }
      if (event.key === "End") { event.preventDefault(); setIndex(slides.length - 1); }
    }}><Image src={slide.image} alt={`Slide ${index + 1}: ${slide.title}. The slide text is available below.`} width={1600} height={900} unoptimized className={styles.image} /></div>
    <details className={styles.transcript} key={slide.number}><summary>Read slide {index + 1} text</summary><div>{slide.text.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div></details>
  </section>;
}
