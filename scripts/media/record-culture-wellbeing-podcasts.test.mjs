// Plain Node check of the podcast recorder against a stand-in voice service. Records nothing real.
// Run: node scripts/media/record-culture-wellbeing-podcasts.test.mjs
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  COURSES, captions, checkService, loadScript, readSpeech, readWav, recordLine, register, requestParts,
  voiceConfiguration, wavFile, writeEpisode,
} from "./record-culture-wellbeing-podcasts.mjs";

const repo = process.cwd();
const root = mkdtempSync(path.join(tmpdir(), "cw-recorder-"));
try {
  cpSync(path.join(repo, "docs/media-scripts/culture-wellbeing"), path.join(root, "docs/media-scripts/culture-wellbeing"), { recursive: true });
  cpSync(path.join(repo, "docs/media-scripts/cultural-navigation"), path.join(root, "docs/media-scripts/cultural-navigation"), { recursive: true });
  mkdirSync(path.join(root, "lib/content/courses"), { recursive: true });
  cpSync(path.join(repo, "lib/content/courses/completed-podcasts.json"), path.join(root, "lib/content/courses/completed-podcasts.json"));
  cpSync(path.join(repo, "package.json"), path.join(root, "package.json"));

  // Every course has a script the recorder accepts, in the two approved voices.
  for (const id of COURSES) {
    const { script } = loadScript(root, id);
    for (const turn of script.turns) assert.ok(requestParts(turn.text).length >= 1);
  }

  // Credentials: missing values and wrong addresses are refused before any request.
  assert.match(voiceConfiguration(root, {}).error, /Missing PAC_OVERVIEW_VOICE_URL/);
  const env = { PAC_OVERVIEW_VOICE_URL: "https://example--one-pac-overview-voices-web.modal.run/speech", PAC_HOSTED_VOICE_KEY: "k", PAC_HOSTED_VOICE_SECRET: "s" };
  assert.match(voiceConfiguration(root, { ...env, PAC_OVERVIEW_VOICE_URL: "https://evil.example.com/speech" }).error, /modal\.run/);
  const config = voiceConfiguration(root, env);
  assert.equal(config.health.pathname, "/health");

  // A stand-in service: one slow-start 303, then two verified half-second clips per line.
  const tone = (seconds) => { const pcm = Buffer.alloc(Math.round(seconds * 24000) * 2); for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(Math.round(3000 * Math.sin(i / 10)), i * 2); return pcm; };
  let requests = 0;
  const sse = (packets) => new Response(packets.map((p) => "data: " + JSON.stringify(p) + "\n\n").join(""), { headers: { "content-type": "text/event-stream" } });
  const fakeFetch = async (url, init) => {
    assert.equal(init.headers["Modal-Key"], "k");
    assert.equal(init.redirect, "manual");
    requests++;
    if (String(url).endsWith("/health")) return Response.json({ ready: true, voices: ["geffen", "host1", "host2"] });
    if (init.method === "POST") return new Response(null, { status: 303, headers: { location: "/speech?__modal_function_call_id=fc-123" } });
    assert.match(String(url), /\?__modal_function_call_id=fc-123$/);
    return sse([
      { audio: wavFile(tone(0.5)).toString("base64"), voice: "host1", sequence: 0, verified: true, text: "a" },
      { audio: wavFile(tone(0.5)).toString("base64"), voice: "host1", sequence: 1, verified: true, text: "b" },
      { done: true, voice: "host1" },
    ]);
  };
  await checkService(config, fakeFetch);
  const cache = path.join(root, "cache");
  mkdirSync(cache);
  const pcm = await recordLine(config, cache, "Hello there.", "host1", fakeFetch);
  assert.equal(pcm.length, 24000 * 2);
  const before = requests;
  await recordLine(config, cache, "Hello there.", "host1", fakeFetch);
  assert.equal(requests, before, "a cached line is not requested again");

  // Clips in the wrong voice, unverified, or out of order are refused.
  const body = (packets) => sse(packets).body;
  await assert.rejects(readSpeech(body([{ audio: wavFile(tone(0.1)).toString("base64"), voice: "geffen", sequence: 0, verified: true }, { done: true, voice: "geffen" }]), "host1"), /wrong voice/);
  await assert.rejects(readSpeech(body([{ audio: wavFile(tone(0.1)).toString("base64"), voice: "host1", sequence: 0, verified: false }, { done: true, voice: "host1" }]), "host1"), /unverified/);
  await assert.rejects(readSpeech(body([{ audio: wavFile(tone(0.1)).toString("base64"), voice: "host1", sequence: 1, verified: true }]), "host1"), /unverified/);
  await assert.rejects(readSpeech(body([{ audio: wavFile(tone(0.1)).toString("base64"), voice: "host1", sequence: 0, verified: true }]), "host1"), /stopped before/);
  await assert.rejects(recordLine(config, cache, "Refused.", "host1", async () => new Response(null, { status: 401 })), /refused the key/);
  assert.throws(() => readWav(Buffer.from("not audio")), /not WAV/);

  // A whole episode: files, timings, captions and the course page registry.
  const { file, script } = loadScript(root, "cw-everyday-norms");
  const clips = script.turns.map(() => tone(1.2));
  const entry = await writeEpisode(root, file, script, clips);
  const folder = path.join(root, "public/learning/course-podcasts/cw-everyday-norms");
  for (const name of ["episode.mp3", "captions.vtt", "transcript.txt", "transcript.json", "episode.json"]) assert.ok(existsSync(path.join(folder, name)), name);
  const episode = JSON.parse(readFileSync(path.join(folder, "episode.json"), "utf8"));
  assert.equal(episode.status, "ready");
  assert.equal(episode.turns.length, script.turns.length);
  assert.equal(episode.turns[0].start, 0.25);
  assert.ok(episode.turns.every((t, i) => t.end > t.start && (i === 0 || t.start > episode.turns[i - 1].end)));
  assert.match(entry.src, /^\/learning\/course-podcasts\/cw-everyday-norms\/episode\.mp3\?v=[0-9a-f]{12}$/);
  assert.equal(episode.audioSrc, entry.src);
  assert.ok(entry.transcript.startsWith(script.title + "\n\nHost: "));
  const vtt = readFileSync(path.join(folder, "captions.vtt"), "utf8");
  assert.ok(vtt.startsWith("WEBVTT\n\n1\n00:00:00.250 --> "));
  assert.match(captions([{ text: "One two three four five six seven eight nine ten", start: 1, end: 3 }]), /One two three four five six seven eight nine ten/);
  assert.equal(readFileSync(path.join(folder, "episode.mp3")).subarray(0, 3).toString("latin1") === "ID3" || readFileSync(path.join(folder, "episode.mp3"))[0] === 0xff, true);
  register(root, { "cw-everyday-norms": entry });
  const registry = JSON.parse(readFileSync(path.join(root, "lib/content/courses/completed-podcasts.json"), "utf8"));
  assert.deepEqual(registry["cw-everyday-norms"], entry);
  assert.ok(registry["ipe-18-cross-division-coordination"], "existing podcasts are kept");
  console.log("Recorder check passed: credentials, redirects, verification, cache, episode files and registry.");
} finally {
  rmSync(root, { recursive: true, force: true });
}
