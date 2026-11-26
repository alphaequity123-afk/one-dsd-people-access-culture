// One-time copy of everything the One DSD service keeps on its persistent volume into the places
// that need no volume: page edits and records into pac_dsd (migrations 0073, 0074, 0075), and the
// public media tree and rendered drafts into the private media bucket.
//
// PAC_STORAGE_COPY=verify  compares and reports; it writes nothing.
// PAC_STORAGE_COPY=copy    copies what is missing or different, then runs the same check.
// PAC_STORAGE_COPY=inventory  lists the size of every top-level folder on the volume; it writes nothing.
//
// It only reads the volume and never deletes from it. Every step can be run again: files already
// in the bucket with the same bytes are skipped, and database rows already present are left alone.
// Each finding is one log line starting "storage_copy"; the last line is "storage_copy_result"
// with ok true only when every file and record is present and identical.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import postgres from "postgres";
import { headObject, mediaBucketConfiguration, putObject } from "./media-bucket.mjs";

const MIME = { ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".png": "image/png", ".vtt": "text/vtt; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };
const md5 = bytes => createHash("md5").update(bytes).digest("hex");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
/** The same object when size matches and either the recorded SHA-256 or the single-part ETag (an MD5) matches. */
const sameObject = (stored, bytes) => Boolean(stored) && stored.size === bytes.length && (stored.sha256 ? stored.sha256 === sha256(bytes) : stored.etag === md5(bytes));
/** JSON with object keys sorted, so a database jsonb copy compares equal to the file it came from. */
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : item);
const log = (event, detail = {}) => console.log(`storage_copy ${event} ${JSON.stringify(detail)}`);

function sslFor(url, configured) {
  const mode = configured?.trim().toLowerCase();
  if (mode && ["disable", "false", "off"].includes(mode)) return false;
  if (mode && ["require", "true", "on"].includes(mode)) return "require";
  return ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname) ? false : "require";
}

/** Every regular file under a folder, skipping hidden temporary files and refusing links. */
async function files(root, relative = "") {
  const found = [];
  for (const name of (await readdir(path.join(root, relative))).sort()) {
    if (name.startsWith(".")) continue;
    const child = relative ? `${relative}/${name}` : name;
    const info = await lstat(path.join(root, child));
    if (info.isSymbolicLink()) { log("skipped_link", { file: child }); continue; }
    if (info.isDirectory()) found.push(...await files(root, child));
    else if (info.isFile()) found.push({ relative: child, size: info.size });
  }
  return found;
}

/** Mirror one folder into the bucket under a prefix. */
async function mirror(bucket, root, prefix, copy, report) {
  if (!existsSync(root)) { log("folder_absent", { prefix }); return; }
  for (const file of await files(root)) {
    const key = `${prefix}/${file.relative}`;
    const bytes = await readFile(path.join(root, file.relative));
    let stored = await headObject(bucket, key);
    if (copy && !sameObject(stored, bytes)) {
      await putObject(bucket, key, bytes, MIME[path.extname(key)] ?? "application/octet-stream");
      report.filesCopied += 1;
      report.bytesCopied += bytes.length;
      stored = await headObject(bucket, key);
    }
    report.files += 1;
    if (!sameObject(stored, bytes)) {
      report.filesDifferent += 1;
      log("file_different", { key, present: Boolean(stored) });
    }
  }
}

function sqliteRows(file, query) {
  if (!existsSync(file)) return [];
  const db = new DatabaseSync(file, { readOnly: true });
  try { return db.prepare(query).all(); } catch { return []; } finally { db.close(); }
}

/** Size and file count of each top-level folder on the volume, hidden ones included, so nothing is left unseen. */
async function inventory(dataRoot) {
  const totals = {};
  async function walk(dir, top) {
    for (const name of await readdir(dir)) {
      const full = path.join(dir, name);
      const info = await lstat(full);
      const key = top ?? name;
      totals[key] ??= { files: 0, bytes: 0 };
      if (info.isDirectory() && !info.isSymbolicLink()) await walk(full, key);
      else { totals[key].files += 1; totals[key].bytes += info.size; }
    }
  }
  if (existsSync(dataRoot)) await walk(dataRoot, null);
  return totals;
}

export async function copyToVolumeFree(environment = process.env, dataRoot = path.resolve(".data")) {
  const mode = environment.PAC_STORAGE_COPY?.trim().toLowerCase();
  if (mode !== "verify" && mode !== "copy" && mode !== "inventory") throw new Error("PAC_STORAGE_COPY must be verify, copy or inventory.");
  if (mode === "inventory") {
    const folders = await inventory(dataRoot);
    console.log(`storage_copy_result ${JSON.stringify({ ok: true, mode, folders })}`);
    return { ok: true, mode, folders };
  }
  const copy = mode === "copy";
  const bucket = mediaBucketConfiguration(environment);
  const ownerUrl = environment.PAC_OWNER_DATABASE_URL?.trim();
  if (!bucket) throw new Error("The media bucket is not configured.");
  if (!ownerUrl || decodeURIComponent(new URL(ownerUrl).username).split(".")[0] !== "pac_dsd_owner_writer") throw new Error("The copy needs the owner writer database connection.");
  const report = { mode, files: 0, filesCopied: 0, bytesCopied: 0, filesDifferent: 0, pageEdits: "absent", runs: 0, runsPresent: 0, reviews: 0, reviewsPresent: 0, voice: 0, voiceImported: false, jobs: 0, jobsPresent: 0 };
  const sql = postgres(ownerUrl, { ssl: sslFor(ownerUrl, environment.PAC_OWNER_DATABASE_SSL), max: 1, prepare: false, connect_timeout: 15 });
  try {
    // Public media: the whole geffen-public tree, mirrored key for key.
    const media = environment.PAC_GEFFEN_PUBLIC_MEDIA_ROOT?.trim() || path.join(dataRoot, "geffen-public");
    await mirror(bucket, media, "geffen-public", copy, report);

    // Rendered resource drafts: resource-creation/<job id>/<file>.
    const creation = path.join(dataRoot, "resource-creation");
    if (existsSync(creation)) {
      for (const name of (await readdir(creation)).sort()) {
        if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(name) && (await lstat(path.join(creation, name))).isDirectory()) {
          await mirror(bucket, path.join(creation, name), `resource-creation/${name}`, copy, report);
        }
      }
    }

    // Page edits: copied only when the database has no document yet; then compared.
    const editsFile = path.join(dataRoot, "page-edits", "page-edits.json");
    if (existsSync(editsFile)) {
      const body = JSON.parse(await readFile(editsFile, "utf8"));
      let [current] = await sql.unsafe("select revision, body from pac_dsd.read_page_edit_document(-1)");
      if (!current && copy) {
        await sql.unsafe("select pac_dsd.write_page_edit_document(0, $1::text::jsonb)", [JSON.stringify(body)]);
        [current] = await sql.unsafe("select revision, body from pac_dsd.read_page_edit_document(-1)");
      }
      const storedBody = current && typeof current.body === "string" ? JSON.parse(current.body) : current?.body;
      report.pageEdits = !current ? "missing" : canonical(storedBody) === canonical(body) ? "same" : "different";
      if (report.pageEdits === "different") log("page_edits_different", { revision: Number(current.revision) });
    }

    // Ask pilot counts.
    const ledger = path.join(dataRoot, "clone-agents.sqlite");
    const runs = sqliteRows(ledger, "SELECT id, started, finished, status, route, jev_calls FROM runs");
    const voice = sqliteRows(ledger, "SELECT at, kind, units FROM voice_usage");
    const reviews = sqliteRows(ledger, "SELECT day, status FROM daily_review");
    // Resource creation queue.
    const jobs = sqliteRows(path.join(dataRoot, "resource-creation", "jobs.sqlite"), "SELECT * FROM resource_creation_jobs");
    if (copy) {
      const [added] = await sql.unsafe("select pac_dsd.import_volume_clone_records($1::text::jsonb, $2::text::jsonb, $3::text::jsonb) as added", [JSON.stringify(runs), JSON.stringify(voice), JSON.stringify(reviews)]);
      log("records_imported", added.added);
      const [jobsAdded] = await sql.unsafe("select pac_dsd.import_volume_resource_creation_jobs($1::text::jsonb) as added", [JSON.stringify(jobs)]);
      log("jobs_imported", { added: jobsAdded.added });
    }
    const [presence] = await sql.unsafe("select pac_dsd.volume_record_presence($1::text::jsonb, $2::text::jsonb, $3::text::jsonb) as present",
      [JSON.stringify(runs.map(r => r.id)), JSON.stringify(reviews.map(r => r.day)), JSON.stringify(jobs.map(j => j.id))]);
    Object.assign(report, {
      runs: runs.length, runsPresent: Number(presence.present.runs), reviews: reviews.length, reviewsPresent: Number(presence.present.reviews),
      voice: voice.length, voiceImported: presence.present.voiceImported === true || voice.length === 0, jobs: jobs.length, jobsPresent: Number(presence.present.jobs),
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
  const ok = report.filesDifferent === 0 && report.pageEdits !== "missing" && report.pageEdits !== "different"
    && report.runsPresent === report.runs && report.reviewsPresent === report.reviews && report.jobsPresent === report.jobs && report.voiceImported;
  console.log(`storage_copy_result ${JSON.stringify({ ok, ...report })}`);
  return { ok, ...report };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  copyToVolumeFree().catch(error => {
    console.log(`storage_copy_result ${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "unknown" })}`);
    process.exitCode = 1;
  });
}
