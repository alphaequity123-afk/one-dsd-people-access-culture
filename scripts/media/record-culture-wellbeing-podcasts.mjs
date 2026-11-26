#!/usr/bin/env node
/**
 * Record the Culture and Well-Being and Cultural Navigation course podcasts with the approved voices.
 *
 *   npm run record:culture-wellbeing-podcasts            record them all (resumes where it stopped)
 *   npm run record:culture-wellbeing-podcasts -- --check  check the voice service only; records nothing
 *   npm run record:culture-wellbeing-podcasts -- --course cw-everyday-norms
 *
 * Each turn of docs/media-scripts/<folder>/<course>.podcast.json (SCRIPT_FOLDERS) is spoken by the hosted
 * overview voice service (cloud/voice/overview_app.py) in its approved voice: host1 (Host, female)
 * or geffen (Co-host, male). Every clip must arrive verified by the service, in order, as 16-bit
 * 24 kHz mono WAV. Finished clips are cached under output/, so a stopped run resumes without
 * paying for the same line twice.
 *
 * Output per course, in public/learning/course-podcasts/<course>/: episode.mp3, captions.vtt,
 * transcript.txt, transcript.json and episode.json. The course is then registered in
 * lib/content/courses/completed-podcasts.json, which is what puts the player on the course page.
 *
 * Credentials come from the environment or from .env.local / .env in the repository root:
 * PAC_OVERVIEW_VOICE_URL (the https://….modal.run/speech address of the overview app),
 * PAC_HOSTED_VOICE_KEY and PAC_HOSTED_VOICE_SECRET (the Modal proxy token). They are never printed.
 */
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const COURSES = [
  "cw-everyday-norms",
  "cw-sustainable-pace",
  "cw-pace-pressure-decisions",
  "cw-workload-burnout",
  "cw-learning-organization",
  "cw-trauma-informed-teams",
  "cn-what-a-navigator-does",
  "cn-working-alongside-a-navigator",
  "cn-navigating-disability-services-with-a-family",
  "cn-culture-in-informed-choice",
  "cn-building-a-navigator-role",
  "cn-navigators-and-system-change",
  "cn-sustaining-the-navigator",
];
/** Where each course's script lives under docs/media-scripts; courses not listed use culture-wellbeing. */
export const SCRIPT_FOLDERS = Object.fromEntries(COURSES.filter((id) => id.startsWith("cn-")).map((id) => [id, "cultural-navigation"]));
const scriptFolder = (id) => SCRIPT_FOLDERS[id] ?? "culture-wellbeing";
export const VOICES = { host1: "Host", geffen: "Co-host" };
const SAMPLE_RATE = 24_000;
const BYTES_PER_FRAME = 2;
const LEAD_SECONDS = 0.25;
const PAUSE_SECONDS = 0.45;
const TAIL_SECONDS = 0.6;
const MAX_PACKET = 3_000_000;
const MAX_CLIP_SECONDS = 150;
const CACHE_VERSION = 1;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const clean = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

/* ---------- credentials and endpoint ---------- */

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const values = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?(PAC_OVERVIEW_VOICE_URL|PAC_HOSTED_VOICE_KEY|PAC_HOSTED_VOICE_SECRET)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2").trim();
  }
  return values;
}

export function voiceConfiguration(root, env = process.env) {
  const files = { ...readEnvFile(path.join(root, ".env")), ...readEnvFile(path.join(root, ".env.local")) };
  const pick = (name) => (env[name] || files[name] || "").trim();
  const endpoint = pick("PAC_OVERVIEW_VOICE_URL");
  const key = pick("PAC_HOSTED_VOICE_KEY");
  const secret = pick("PAC_HOSTED_VOICE_SECRET");
  const missing = [
    !endpoint && "PAC_OVERVIEW_VOICE_URL",
    !key && "PAC_HOSTED_VOICE_KEY",
    !secret && "PAC_HOSTED_VOICE_SECRET",
  ].filter(Boolean);
  if (missing.length) return { error: "Missing " + missing.join(", ") + "." };
  let url;
  try { url = new URL(endpoint); } catch { return { error: "PAC_OVERVIEW_VOICE_URL is not a web address." }; }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".modal.run") || url.port || url.username || url.password ||
      url.search || url.hash || !url.pathname.endsWith("/speech")) {
    return { error: "PAC_OVERVIEW_VOICE_URL must be the overview app's https://….modal.run/speech address." };
  }
  const health = new URL(url);
  health.pathname = url.pathname.replace(/\/speech$/, "/health");
  return { speech: url, health, headers: { "Modal-Key": key, "Modal-Secret": secret } };
}

/** Modal answers a slow start with 303 to the same endpoint plus one opaque parameter. */
export function modalContinuation(endpoint, location) {
  if (!location || location.length > 2048 || !/^[!-~]+$/.test(location) || location.includes("\\") || location.includes("#")) return null;
  try {
    const next = new URL(location, endpoint);
    if (next.origin !== endpoint.origin || next.pathname !== endpoint.pathname || next.username || next.password ||
      !/^\?[A-Za-z0-9_-]{1,64}=[A-Za-z0-9._~-]{1,1024}$/.test(next.search)) return null;
    return next;
  } catch { return null; }
}

async function modalRequest(endpoint, headers, init, fetchImpl) {
  const base = { cache: "no-store", redirect: "manual", signal: init.signal };
  let response = await fetchImpl(endpoint, { ...base, ...init, headers: { ...headers, ...(init.headers || {}) } });
  for (let followed = 0; response.status === 303; followed++) {
    const next = followed < 3 ? modalContinuation(endpoint, response.headers.get("location")) : null;
    await response.body?.cancel?.();
    if (!next) throw new Error("The voice service sent an unexpected redirect.");
    response = await fetchImpl(next, { ...base, method: "GET", headers });
  }
  return response;
}

/* ---------- audio ---------- */

export function readWav(buffer) {
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("The voice service returned audio that is not WAV.");
  }
  let offset = 12;
  let format = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ") {
      format = { code: buffer.readUInt16LE(body), channels: buffer.readUInt16LE(body + 2), rate: buffer.readUInt32LE(body + 4), bits: buffer.readUInt16LE(body + 14) };
    } else if (id === "data") {
      if (!format || format.code !== 1 || format.channels !== 1 || format.rate !== SAMPLE_RATE || format.bits !== 16) {
        throw new Error("The voice service returned audio in an unexpected format.");
      }
      const end = Math.min(buffer.length, body + size);
      return buffer.subarray(body, end - ((end - body) % BYTES_PER_FRAME));
    }
    offset = body + size + (size % 2);
  }
  throw new Error("The voice service returned WAV audio with no sound data.");
}

export function wavFile(pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24); header.writeUInt32LE(SAMPLE_RATE * BYTES_PER_FRAME, 28);
  header.writeUInt16LE(BYTES_PER_FRAME, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Read the service's server-sent events and return the verified clip as raw PCM. */
export async function readSpeech(body, voice) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const chunks = [];
  let frames = 0;
  let pending = "";
  let done = false;
  const packet = (line) => {
    line = line.replace(/\r$/, "");
    if (!line.startsWith("data:")) return;
    if (done || line.length > MAX_PACKET) throw new Error("The voice service sent an unexpected packet.");
    const value = JSON.parse(line.slice(5).trim());
    if (value.error) throw new Error("The voice service could not finish this line.");
    if (value.voice !== voice) throw new Error("The voice service answered in the wrong voice.");
    if (value.done === true) { done = true; return; }
    if (value.verified !== true || typeof value.audio !== "string" || value.sequence !== chunks.length ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(value.audio)) throw new Error("The voice service sent an unverified clip.");
    const pcm = readWav(Buffer.from(value.audio, "base64"));
    frames += pcm.length / BYTES_PER_FRAME;
    if (frames > SAMPLE_RATE * MAX_CLIP_SECONDS) throw new Error("The voice service sent a clip that is too long.");
    chunks.push(pcm);
  };
  try {
    for (;;) {
      const { value, done: ended } = await reader.read();
      if (ended) break;
      pending += decoder.decode(value, { stream: true });
      let newline;
      while ((newline = pending.indexOf("\n")) >= 0) { packet(pending.slice(0, newline)); pending = pending.slice(newline + 1); }
      if (pending.length > MAX_PACKET) throw new Error("The voice service sent an unexpected packet.");
    }
    packet(pending + decoder.decode());
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  if (!done || !chunks.length) throw new Error("The voice service stopped before the line was finished.");
  return Buffer.concat(chunks);
}

/** The service takes at most 100 words and 1,300 characters per request; split longer turns at sentences. */
export function requestParts(text) {
  const sentences = clean(text).split(/(?<=[.!?])\s+/);
  const parts = [];
  let current = "";
  for (const sentence of sentences) {
    const joined = current ? current + " " + sentence : sentence;
    if (current && (joined.split(" ").length > 90 || joined.length > 1200)) { parts.push(current); current = sentence; } else current = joined;
  }
  if (current) parts.push(current);
  for (const part of parts) if (part.split(" ").length > 100 || part.length > 1300) throw new Error("A sentence is too long for the voice service: " + part.slice(0, 60));
  return parts;
}

/* ---------- episode files ---------- */

const time = (seconds) => {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
};

/** Short caption lines for each turn, timed in proportion to their length within the turn. */
export function captions(turns) {
  const cues = [];
  for (const turn of turns) {
    const words = clean(turn.text).split(" ");
    const lines = [];
    for (let i = 0; i < words.length; i += 9) lines.push(words.slice(i, i + 9).join(" "));
    if (lines.length > 1 && lines.at(-1).split(" ").length < 3) lines[lines.length - 2] += " " + lines.pop();
    const total = lines.reduce((sum, line) => sum + line.length, 0);
    let start = turn.start;
    for (const line of lines) {
      const end = start + (turn.end - turn.start) * (line.length / total);
      cues.push({ start, end: Math.max(start + 0.2, end - 0.02), text: line });
      start = end;
    }
  }
  return "WEBVTT\n\n" + cues.map((cue, i) => `${i + 1}\n${time(cue.start)} --> ${time(cue.end)}\n${cue.text}\n`).join("\n");
}

export function transcriptText(title, turns) {
  return [title, ...turns.map((turn) => `${VOICES[turn.speaker]}: ${clean(turn.text)}`)].join("\n\n") + "\n";
}

/** Lay the clips end to end with short pauses and return the episode PCM and each turn's times. */
export function assemble(clips) {
  const silence = (seconds) => Buffer.alloc(Math.round(seconds * SAMPLE_RATE) * BYTES_PER_FRAME);
  const parts = [silence(LEAD_SECONDS)];
  const timings = [];
  let frames = Math.round(LEAD_SECONDS * SAMPLE_RATE);
  clips.forEach((pcm, i) => {
    if (i) { parts.push(silence(PAUSE_SECONDS)); frames += Math.round(PAUSE_SECONDS * SAMPLE_RATE); }
    const start = frames / SAMPLE_RATE;
    parts.push(pcm);
    frames += pcm.length / BYTES_PER_FRAME;
    timings.push({ start, end: frames / SAMPLE_RATE });
  });
  parts.push(silence(TAIL_SECONDS));
  frames += Math.round(TAIL_SECONDS * SAMPLE_RATE);
  return { pcm: Buffer.concat(parts), seconds: frames / SAMPLE_RATE, timings };
}

function ffmpegPath(root) {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  try {
    const found = createRequire(path.join(root, "package.json"))("ffmpeg-static");
    if (found && existsSync(found)) return found;
  } catch { /* fall back to ffmpeg on PATH */ }
  return "ffmpeg";
}

export function encodeMp3(root, pcm) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath(root), ["-hide_banner", "-loglevel", "error", "-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", "1", "-i", "pipe:0",
      "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", "-map_metadata", "-1", "-f", "mp3", "pipe:1"]);
    const out = [];
    let errors = "";
    child.stdout.on("data", (chunk) => out.push(chunk));
    child.stderr.on("data", (chunk) => { errors += chunk; });
    child.on("error", () => reject(new Error("ffmpeg is needed to make the MP3. Run npm install, or install ffmpeg.")));
    child.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error("ffmpeg could not make the MP3: " + errors.trim()))));
    child.stdin.end(pcm);
  });
}

function writeAtomic(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + ".tmp";
  writeFileSync(temporary, value);
  renameSync(temporary, file);
}

/** Write the five episode files and return the registry entry for the course page. */
export async function writeEpisode(root, scriptFile, script, clips, encode = encodeMp3) {
  const { pcm, seconds, timings } = assemble(clips);
  const mp3 = await encode(root, pcm);
  const version = sha256(mp3).slice(0, 12);
  const folder = path.join(root, "public", "learning", "course-podcasts", script.id);
  const web = `/learning/course-podcasts/${script.id}`;
  const turns = script.turns.map((turn, i) => ({
    speaker: turn.speaker, chapter: turn.chapter, text: clean(turn.text), speakerLabel: VOICES[turn.speaker],
    start: Number(timings[i].start.toFixed(3)), end: Number(timings[i].end.toFixed(3)),
  }));
  const text = transcriptText(script.title, turns);
  const rest = { ...script };
  delete rest.status;
  writeAtomic(path.join(folder, "episode.mp3"), mp3);
  writeAtomic(path.join(folder, "captions.vtt"), captions(turns));
  writeAtomic(path.join(folder, "transcript.txt"), text);
  writeAtomic(path.join(folder, "transcript.json"), JSON.stringify({ title: script.title, speakerLabels: VOICES, turns }, null, 2) + "\n");
  writeAtomic(path.join(folder, "episode.json"), JSON.stringify({
    ...rest, turns, speakerLabels: VOICES, durationSeconds: Number(seconds.toFixed(3)),
    scriptSha256: sha256(readFileSync(scriptFile)), status: "ready", speakers: VOICES,
    audioSrc: `${web}/episode.mp3?v=${version}`, transcriptSrc: `${web}/transcript.txt?v=${version}`,
    transcriptJsonSrc: `${web}/transcript.json?v=${version}`, captionsSrc: `${web}/captions.vtt?v=${version}`,
  }, null, 2) + "\n");
  return { src: `${web}/episode.mp3?v=${version}`, transcript: text, seconds: Number(seconds.toFixed(3)) };
}

export function register(root, entries) {
  const file = path.join(root, "lib", "content", "courses", "completed-podcasts.json");
  const registry = JSON.parse(readFileSync(file, "utf8"));
  for (const [id, entry] of Object.entries(entries)) registry[id] = entry;
  writeAtomic(file, JSON.stringify(registry, null, 2) + "\n");
}

/* ---------- recording ---------- */

export async function recordLine(config, cacheDir, text, voice, fetchImpl = fetch) {
  const file = path.join(cacheDir, sha256(JSON.stringify({ v: CACHE_VERSION, voice, text })) + ".wav");
  if (existsSync(file)) return readWav(readFileSync(file));
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await modalRequest(config.speech, config.headers, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, voice }),
        signal: AbortSignal.timeout(590_000),
      }, fetchImpl);
      if (response.status === 401 || response.status === 403) throw Object.assign(new Error("The voice service refused the key and secret."), { final: true });
      if (!response.ok || !response.body || !String(response.headers.get("content-type")).startsWith("text/event-stream")) {
        await response.body?.cancel?.();
        throw new Error(`The voice service answered ${response.status}.`);
      }
      const pcm = await readSpeech(response.body, voice);
      writeAtomic(file, wavFile(pcm));
      return pcm;
    } catch (error) {
      lastError = error;
      if (error.final) break;
    }
  }
  throw lastError;
}

export async function checkService(config, fetchImpl = fetch) {
  const response = await modalRequest(config.health, config.headers, { method: "GET", signal: AbortSignal.timeout(590_000) }, fetchImpl);
  if (response.status === 401 || response.status === 403) throw new Error("The voice service refused the key and secret.");
  if (!response.ok) throw new Error(`The voice service health check answered ${response.status}. Is the overview app deployed?`);
  const health = await response.json();
  if (!Array.isArray(health.voices) || !health.voices.includes("host1") || !health.voices.includes("geffen")) {
    throw new Error("That address is not the overview voice service with both podcast voices.");
  }
}

export function loadScript(root, id) {
  const file = path.join(root, "docs", "media-scripts", scriptFolder(id), `${id}.podcast.json`);
  const script = JSON.parse(readFileSync(file, "utf8"));
  if (script.id !== id || !Array.isArray(script.turns) || !script.turns.length) throw new Error(`The script for ${id} is not complete.`);
  for (const turn of script.turns) {
    if (!VOICES[turn.speaker] || !clean(turn.text)) throw new Error(`The script for ${id} has a turn without an approved voice or words.`);
  }
  return { file, script };
}

async function main() {
  const root = process.cwd();
  if (!existsSync(path.join(root, "docs", "media-scripts", "culture-wellbeing"))) {
    throw new Error("Run this from the one-dsd-people-access-culture folder.");
  }
  const args = process.argv.slice(2);
  const only = args.includes("--course") ? args[args.indexOf("--course") + 1] : null;
  if (only && !COURSES.includes(only)) throw new Error("Choose one of: " + COURSES.join(", "));
  const courses = only ? [only] : COURSES;
  const scripts = courses.map((id) => loadScript(root, id));
  const lines = scripts.reduce((sum, { script }) => sum + script.turns.length, 0);

  const config = voiceConfiguration(root);
  if (config.error) {
    throw new Error(config.error + "\nAdd the overview voice service's address and the Modal proxy key and secret to .env.local " +
      "(see docs/media-scripts/culture-wellbeing/README.md).");
  }
  console.log("Checking the voice service. A first request can take a few minutes while it starts.");
  await checkService(config);
  console.log("The voice service is ready with both podcast voices.");
  if (args.includes("--check")) {
    console.log(`Check only: ${courses.length} episodes, ${lines} lines ready to record. Nothing was recorded.`);
    return;
  }

  const cacheDir = path.join(root, "output", "culture-wellbeing-recording", "clips");
  mkdirSync(cacheDir, { recursive: true });
  const entries = {};
  let done = 0;
  for (const { file, script } of scripts) {
    const clips = [];
    for (const turn of script.turns) {
      done++;
      process.stdout.write(`\r${script.id}: line ${done} of ${lines}          `);
      const parts = requestParts(turn.text);
      const pcm = [];
      for (const part of parts) pcm.push(await recordLine(config, cacheDir, part, turn.speaker));
      clips.push(Buffer.concat(pcm));
    }
    entries[script.id] = await writeEpisode(root, file, script, clips);
    register(root, { [script.id]: entries[script.id] });
    process.stdout.write(`\r${script.id}: recorded, ${Math.round(entries[script.id].seconds)} seconds.          \n`);
  }
  console.log(`\nDone: ${Object.keys(entries).length} episodes are in public/learning/course-podcasts and registered on their course pages.`);
  console.log("Next: listen to each episode.mp3, then send the new files with:\n" +
    "  git checkout -b media/culture-wellbeing-podcasts\n" +
    "  git add public/learning/course-podcasts/cw-* public/learning/course-podcasts/cn-* lib/content/courses/completed-podcasts.json\n" +
    "  git commit -m \"Record the course podcasts\"\n" +
    "  git push -u origin media/culture-wellbeing-podcasts");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("\n" + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
}
