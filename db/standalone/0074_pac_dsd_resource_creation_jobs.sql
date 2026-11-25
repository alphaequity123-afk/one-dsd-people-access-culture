-- The owner's resource creation queue (study guides, quizzes, slides, audio and video overview
-- drafts), which used to be a SQLite file on the One DSD service's persistent volume. Rendered
-- audio and video go to the private media bucket; this table keeps only the job, its draft script
-- and the names of its files. The application uses it only when PAC_RUNTIME_RECORDS=postgres.
-- Reachable only through these definer functions, by pac_dsd_app_runtime.
begin;

create table if not exists pac_dsd.resource_creation_jobs (
  job_id uuid primary key,
  scope text not null check (scope in ('one-dhs','dsd')),
  resource_path text not null check (length(resource_path) between 1 and 480),
  title text not null check (length(title) <= 1000),
  kind text not null check (kind in ('study-guide','quiz','flashcards','mind-map','slides','infographic','audio-overview','video-overview')),
  revision text not null check (length(revision) <= 200),
  status text not null check (status in ('queued','generating','rendering','ready','failed','stale')),
  artifact text check (artifact is null or octet_length(artifact) <= 4194304),
  files text check (files is null or octet_length(files) <= 1000),
  error text check (error is null or length(error) <= 1000),
  created_at_ms bigint not null,
  updated_at_ms bigint not null,
  lease_token uuid,
  lease_until_ms bigint,
  attempts integer not null default 0 check (attempts >= 0)
);
create index if not exists resource_creation_jobs_queue_idx on pac_dsd.resource_creation_jobs(status, created_at_ms);
create index if not exists resource_creation_jobs_scope_idx on pac_dsd.resource_creation_jobs(scope, created_at_ms desc);
alter table pac_dsd.resource_creation_jobs enable row level security;
revoke all on pac_dsd.resource_creation_jobs from public, pac_dsd_app_runtime;

create or replace function pac_dsd.resource_creation_job_json(j pac_dsd.resource_creation_jobs)
returns jsonb language sql immutable set search_path=pg_catalog,pac_dsd as $$
  select jsonb_build_object(
    'id', j.job_id::text, 'scope', j.scope, 'resourcePath', j.resource_path, 'title', j.title, 'kind', j.kind,
    'revision', j.revision, 'status', j.status, 'artifact', j.artifact, 'files', j.files, 'error', j.error,
    'createdAt', j.created_at_ms, 'updatedAt', j.updated_at_ms, 'token', j.lease_token::text,
    'leaseUntil', j.lease_until_ms, 'attempts', j.attempts);
$$;

-- Same limits as before: 4 active jobs, 24 a day, 4 media overviews a day. Null means the queue is full.
create or replace function pac_dsd.enqueue_resource_creation(requested_scope text, requested_path text, requested_title text, requested_kind text, requested_revision text, now_ms bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare existing pac_dsd.resource_creation_jobs;
declare created pac_dsd.resource_creation_jobs;
declare active integer; declare daily integer; declare media integer;
begin
  if now_ms is null or now_ms <= 0 then raise exception 'Invalid time' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('pac_dsd.resource_creation_jobs', 0));
  select * into existing from pac_dsd.resource_creation_jobs j
    where j.scope = requested_scope and j.resource_path = requested_path and j.kind = requested_kind and j.revision = requested_revision
      and j.status in ('queued','generating','rendering','ready') order by j.created_at_ms desc limit 1;
  if found then return jsonb_build_object('job', pac_dsd.resource_creation_job_json(existing), 'reused', true); end if;
  select count(*) filter (where status in ('queued','generating','rendering')),
         count(*) filter (where created_at_ms >= now_ms - 86400000),
         count(*) filter (where created_at_ms >= now_ms - 86400000 and kind in ('audio-overview','video-overview'))
    into active, daily, media from pac_dsd.resource_creation_jobs;
  if active >= 4 or daily >= 24 or (requested_kind in ('audio-overview','video-overview') and media >= 4) then return null; end if;
  insert into pac_dsd.resource_creation_jobs(job_id, scope, resource_path, title, kind, revision, status, created_at_ms, updated_at_ms)
    values (gen_random_uuid(), requested_scope, requested_path, requested_title, requested_kind, requested_revision, 'queued', now_ms, now_ms)
    returning * into created;
  return jsonb_build_object('job', pac_dsd.resource_creation_job_json(created), 'reused', false);
end; $$;

create or replace function pac_dsd.list_resource_creation_jobs(requested_scope text)
returns setof jsonb language sql stable security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
  select pac_dsd.resource_creation_job_json(j) - 'artifact' - 'token' - 'leaseUntil' - 'attempts'
  from pac_dsd.resource_creation_jobs j where j.scope = requested_scope order by j.created_at_ms desc limit 40;
$$;

create or replace function pac_dsd.find_resource_creation_job(requested_id uuid, requested_scope text)
returns jsonb language sql stable security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
  select pac_dsd.resource_creation_job_json(j) from pac_dsd.resource_creation_jobs j where j.job_id = requested_id and j.scope = requested_scope;
$$;

create or replace function pac_dsd.resource_creation_claimable(now_ms bigint)
returns boolean language sql stable security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
  select exists(select 1 from pac_dsd.resource_creation_jobs j where j.status = 'queued' or (j.status in ('generating','rendering') and j.lease_until_ms <= now_ms));
$$;

-- One job at a time across every server. A job interrupted three times fails for good.
create or replace function pac_dsd.claim_resource_creation(now_ms bigint, lease_ms bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare picked pac_dsd.resource_creation_jobs;
declare new_token uuid := gen_random_uuid();
declare new_status text;
begin
  if now_ms is null or lease_ms is null or lease_ms <= 0 or lease_ms > 600000 then raise exception 'Invalid lease' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('pac_dsd.resource_creation_jobs', 0));
  update pac_dsd.resource_creation_jobs set status = 'failed', error = 'This job was interrupted several times. Start a new draft when ready.',
    updated_at_ms = now_ms, lease_token = null, lease_until_ms = null
    where status in ('generating','rendering') and lease_until_ms <= now_ms and attempts >= 3;
  if exists(select 1 from pac_dsd.resource_creation_jobs where status in ('generating','rendering') and lease_until_ms > now_ms) then return null; end if;
  select * into picked from pac_dsd.resource_creation_jobs j
    where j.status = 'queued' or (j.status in ('generating','rendering') and j.lease_until_ms <= now_ms) order by j.created_at_ms limit 1;
  if not found then return null; end if;
  new_status := case when picked.artifact is null then 'generating' else 'rendering' end;
  update pac_dsd.resource_creation_jobs set status = new_status, lease_token = new_token, lease_until_ms = now_ms + lease_ms,
    attempts = attempts + 1, updated_at_ms = now_ms where job_id = picked.job_id returning * into picked;
  return pac_dsd.resource_creation_job_json(picked);
end; $$;

create or replace function pac_dsd.renew_resource_creation(requested_id uuid, held_token uuid, now_ms bigint, lease_ms bigint)
returns boolean language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare changed integer;
begin
  if lease_ms is null or lease_ms <= 0 or lease_ms > 600000 then raise exception 'Invalid lease' using errcode='22023'; end if;
  update pac_dsd.resource_creation_jobs set lease_until_ms = now_ms + lease_ms
    where job_id = requested_id and lease_token = held_token and lease_until_ms > now_ms;
  get diagnostics changed = row_count;
  return changed > 0;
end; $$;

create or replace function pac_dsd.save_resource_creation_artifact(requested_id uuid, held_token uuid, artifact_json text, now_ms bigint)
returns boolean language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare changed integer;
begin
  update pac_dsd.resource_creation_jobs set artifact = artifact_json, status = 'rendering', updated_at_ms = now_ms
    where job_id = requested_id and lease_token = held_token and lease_until_ms > now_ms;
  get diagnostics changed = row_count;
  return changed > 0;
end; $$;

create or replace function pac_dsd.finish_resource_creation(requested_id uuid, held_token uuid, final_status text, file_list text, failure text, now_ms bigint)
returns boolean language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare changed integer;
begin
  if final_status not in ('ready','failed','stale') then raise exception 'Invalid job status' using errcode='22023'; end if;
  update pac_dsd.resource_creation_jobs set status = final_status, files = file_list, error = failure, updated_at_ms = now_ms,
    lease_token = null, lease_until_ms = null
    where job_id = requested_id and lease_token = held_token and lease_until_ms > now_ms;
  get diagnostics changed = row_count;
  return changed > 0;
end; $$;

revoke all on function
  pac_dsd.resource_creation_job_json(pac_dsd.resource_creation_jobs),
  pac_dsd.enqueue_resource_creation(text,text,text,text,text,bigint), pac_dsd.list_resource_creation_jobs(text),
  pac_dsd.find_resource_creation_job(uuid,text), pac_dsd.resource_creation_claimable(bigint),
  pac_dsd.claim_resource_creation(bigint,bigint), pac_dsd.renew_resource_creation(uuid,uuid,bigint,bigint),
  pac_dsd.save_resource_creation_artifact(uuid,uuid,text,bigint), pac_dsd.finish_resource_creation(uuid,uuid,text,text,text,bigint)
from public, pac_dsd_app_runtime;
grant execute on function
  pac_dsd.enqueue_resource_creation(text,text,text,text,text,bigint), pac_dsd.list_resource_creation_jobs(text),
  pac_dsd.find_resource_creation_job(uuid,text), pac_dsd.resource_creation_claimable(bigint),
  pac_dsd.claim_resource_creation(bigint,bigint), pac_dsd.renew_resource_creation(uuid,uuid,bigint,bigint),
  pac_dsd.save_resource_creation_artifact(uuid,uuid,text,bigint), pac_dsd.finish_resource_creation(uuid,uuid,text,text,text,bigint)
to pac_dsd_app_runtime;

-- Checks, inside the same transaction: nothing here is kept.
do $verify$
declare
  first jsonb; again jsonb; claimed jsonb; marker text := 'verify-' || gen_random_uuid()::text;
begin
  if has_table_privilege('pac_dsd_app_runtime', 'pac_dsd.resource_creation_jobs', 'select') then
    raise exception 'Resource creation jobs must be reachable only through their functions';
  end if;
  first := pac_dsd.enqueue_resource_creation('dsd', '/library/' || marker, 'Check', 'quiz', marker, 1000);
  again := pac_dsd.enqueue_resource_creation('dsd', '/library/' || marker, 'Check', 'quiz', marker, 1001);
  if first is null or (first->>'reused')::boolean or not (again->>'reused')::boolean or again->'job'->>'id' <> first->'job'->>'id' then
    raise exception 'Repeated drafts are not reused';
  end if;
  if exists(select 1 from pac_dsd.resource_creation_jobs where status in ('generating','rendering') and lease_until_ms > 2000) then
    delete from pac_dsd.resource_creation_jobs where revision = marker;
  else
    claimed := pac_dsd.claim_resource_creation(2000, 120000);
    if claimed is not null and claimed->>'id' = first->'job'->>'id' then
      if not pac_dsd.finish_resource_creation((claimed->>'id')::uuid, (claimed->>'token')::uuid, 'ready', '[]', null, 2001) then
        raise exception 'A claimed job could not finish';
      end if;
      if pac_dsd.finish_resource_creation((claimed->>'id')::uuid, (claimed->>'token')::uuid, 'ready', '[]', null, 2002) then
        raise exception 'A finished lease was accepted again';
      end if;
    end if;
    delete from pac_dsd.resource_creation_jobs where revision = marker;
  end if;
end;
$verify$;

commit;
