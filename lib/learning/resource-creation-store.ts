import "server-only";

import { randomUUID } from "node:crypto";
import { lstatSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { ResourceArtifact, ResourceArtifactKind } from "./resource-artifact-types";

export const creationJobId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const creationFileNames = {
  audio: { name: "overview.mp3", mime: "audio/mpeg" },
  video: { name: "overview.mp4", mime: "video/mp4" },
  captions: { name: "captions.vtt", mime: "text/vtt; charset=utf-8" },
  transcript: { name: "transcript.txt", mime: "text/plain; charset=utf-8" },
} as const;
export type CreationFileKind = keyof typeof creationFileNames;
type Status = "queued" | "generating" | "rendering" | "ready" | "failed" | "stale";
type JobRow = {
  id: string;
  scope: StaffProgramScope;
  resourcePath: string;
  title: string;
  kind: ResourceArtifactKind;
  revision: string;
  status: Status;
  artifact: string | null;
  files: string | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
  token: string | null;
  leaseUntil: number | null;
  attempts: number;
};
type JobInput = Pick<JobRow, "scope" | "resourcePath" | "title" | "kind" | "revision">;
export type CreationLease = JobRow & { token: string };
const LEASE_MS = 120_000;

export function creationRoot() {
  const durableRoot = resolve(".data");
  if (process.env.RAILWAY_DEPLOYMENT_ID &&
    (process.env.RAILWAY_VOLUME_MOUNT_PATH !== durableRoot || !process.env.RAILWAY_VOLUME_ID)) return null;
  return join(durableRoot, "resource-creation");
}

function checkedDirectory(dir: string) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const stat = lstatSync(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Resource creation storage is unavailable");
  return dir;
}

const globalStore = globalThis as typeof globalThis & { resourceCreationDatabase?: DatabaseSync };

function database() {
  if (globalStore.resourceCreationDatabase) return globalStore.resourceCreationDatabase;
  const root = creationRoot();
  if (!root) throw new Error("Resource creation storage is unavailable");
  checkedDirectory(root);
  const db = new DatabaseSync(join(root, "jobs.sqlite"));
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS resource_creation_jobs (
      id TEXT PRIMARY KEY, scope TEXT NOT NULL, resourcePath TEXT NOT NULL,
      title TEXT NOT NULL, kind TEXT NOT NULL, revision TEXT NOT NULL, status TEXT NOT NULL,
      artifact TEXT, files TEXT, error TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      token TEXT, leaseUntil INTEGER, attempts INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS resource_creation_ready_queue ON resource_creation_jobs(status, createdAt);
  `);
  globalStore.resourceCreationDatabase = db;
  return db;
}

export function creationOutputDirectory(id: string) {
  const root = creationRoot();
  if (!root || !creationJobId.test(id)) throw new Error("Unknown resource creation job");
  return join(root, id);
}

export function ensureCreationOutputDirectory(id: string) {
  return checkedDirectory(creationOutputDirectory(id));
}

function transaction<T>(operation: (db: DatabaseSync) => T): T {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = operation(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function enqueueCreation(input: JobInput): { job: JobRow; reused: boolean } | null {
  return transaction(db => {
    const existing = db.prepare(`
      SELECT * FROM resource_creation_jobs
      WHERE scope=? AND resourcePath=? AND kind=? AND revision=?
        AND status IN ('queued','generating','rendering','ready') ORDER BY createdAt DESC LIMIT 1
    `).get(input.scope, input.resourcePath, input.kind, input.revision) as JobRow | undefined;
    if (existing) return { job: existing, reused: true };
    const now = Date.now();
    const usage = db.prepare(`
      SELECT count(*) FILTER (WHERE status IN ('queued','generating','rendering')) AS active,
        count(*) FILTER (WHERE createdAt >= ?) AS daily,
        count(*) FILTER (WHERE createdAt >= ? AND kind IN ('audio-overview','video-overview')) AS media
      FROM resource_creation_jobs
    `).get(now - 86_400_000, now - 86_400_000) as { active: number; daily: number; media: number };
    if (usage.active >= 4 || usage.daily >= 24 ||
      ((input.kind === "audio-overview" || input.kind === "video-overview") && usage.media >= 4)) return null;
    const id = randomUUID();
    db.prepare(`
      INSERT INTO resource_creation_jobs (id, scope, resourcePath, title, kind, revision, status, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?,'queued',?,?)
    `).run(id, input.scope, input.resourcePath, input.title, input.kind, input.revision, now, now);
    return { job: db.prepare("SELECT * FROM resource_creation_jobs WHERE id=?").get(id) as JobRow, reused: false };
  });
}

export function listCreationJobs(scope: StaffProgramScope) {
  return database().prepare(`
    SELECT id, scope, resourcePath, title, kind, revision, status, files, error, createdAt, updatedAt
    FROM resource_creation_jobs WHERE scope=? ORDER BY createdAt DESC LIMIT 40
  `).all(scope) as JobRow[];
}

export function findCreationJob(id: string, scope: StaffProgramScope) {
  return database().prepare("SELECT * FROM resource_creation_jobs WHERE id=? AND scope=?").get(id, scope) as JobRow | undefined;
}

export function creationJobView(row: JobRow) {
  const files = row.status === "ready" && row.files ? JSON.parse(row.files) as CreationFileKind[] : [];
  return {
    id: row.id, resourcePath: row.resourcePath, title: row.title, kind: row.kind, status: row.status,
    createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString(),
    ...(row.error ? { error: row.error } : {}),
    ...(row.artifact ? { artifact: JSON.parse(row.artifact) as ResourceArtifact } : {}),
    ...(files.length ? { files: files.map(kind => ({
      kind, href: `/api/consultant/resource-creation/${row.id}/file?kind=${kind}`, mime: creationFileNames[kind].mime,
    })) } : {}),
  };
}

export function hasClaimableCreation() {
  return !!database().prepare(`
    SELECT 1 FROM resource_creation_jobs WHERE status='queued' OR
      (status IN ('generating','rendering') AND leaseUntil <= ?) LIMIT 1
  `).get(Date.now());
}

export function claimCreation(): CreationLease | null {
  return transaction(db => {
    const now = Date.now();
    db.prepare(`
      UPDATE resource_creation_jobs SET status='failed', error=?, updatedAt=?, token=NULL, leaseUntil=NULL
      WHERE status IN ('generating','rendering') AND leaseUntil <= ? AND attempts >= 3
    `).run("This job was interrupted several times. Start a new draft when ready.", now, now);
    if (db.prepare("SELECT 1 FROM resource_creation_jobs WHERE status IN ('generating','rendering') AND leaseUntil > ? LIMIT 1").get(now)) return null;
    const row = db.prepare(`
      SELECT * FROM resource_creation_jobs WHERE status='queued' OR
        (status IN ('generating','rendering') AND leaseUntil <= ?) ORDER BY createdAt LIMIT 1
    `).get(now) as JobRow | undefined;
    if (!row) return null;
    const token = randomUUID();
    const status = row.artifact ? "rendering" : "generating";
    db.prepare(`
      UPDATE resource_creation_jobs SET status=?, token=?, leaseUntil=?, attempts=attempts+1, updatedAt=? WHERE id=?
    `).run(status, token, now + LEASE_MS, now, row.id);
    return { ...row, token, status };
  });
}

export function renewCreation(lease: CreationLease) {
  const now = Date.now();
  return !!database().prepare(`
    UPDATE resource_creation_jobs SET leaseUntil=? WHERE id=? AND token=? AND leaseUntil > ?
  `).run(now + LEASE_MS, lease.id, lease.token, now).changes;
}

export function saveCreationArtifact(lease: CreationLease, artifact: ResourceArtifact) {
  const now = Date.now();
  return !!database().prepare(`
    UPDATE resource_creation_jobs SET artifact=?, status='rendering', updatedAt=?
    WHERE id=? AND token=? AND leaseUntil > ?
  `).run(JSON.stringify(artifact), now, lease.id, lease.token, now).changes;
}

export function finishCreation(lease: CreationLease, status: "ready" | "failed" | "stale", files: CreationFileKind[] = [], error?: string) {
  const now = Date.now();
  return !!database().prepare(`
    UPDATE resource_creation_jobs SET status=?, files=?, error=?, updatedAt=?, token=NULL, leaseUntil=NULL
    WHERE id=? AND token=? AND leaseUntil > ?
  `).run(status, JSON.stringify(files), error ?? null, now, lease.id, lease.token, now).changes;
}
