-- One-time import of the records the One DSD service kept on its persistent volume (the Ask pilot
-- counts and the resource creation queue) into the tables from 0073 and 0074. Used once by
-- scripts/storage/copy-to-volume-free.mjs, through pac_dsd_owner_writer. Every import is
-- idempotent: rows already present are left alone, and voice use is imported once only.
begin;

create table if not exists pac_dsd.volume_record_imports (
  import_kind text primary key check (import_kind in ('clone_voice_usage')),
  imported_at timestamptz not null default now(),
  row_count integer not null check (row_count >= 0)
);
alter table pac_dsd.volume_record_imports enable row level security;
revoke all on pac_dsd.volume_record_imports from public, pac_dsd_app_runtime, pac_dsd_owner_writer;

-- runs: [{id, started, finished, status, route, jev_calls}], voice: [{at, kind, units}], reviews: [{day, status}]
create or replace function pac_dsd.import_volume_clone_records(runs jsonb, voice jsonb, reviews jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare runs_added integer; reviews_added integer; voice_added integer := 0;
begin
  if jsonb_typeof(runs) <> 'array' or jsonb_typeof(voice) <> 'array' or jsonb_typeof(reviews) <> 'array'
    or jsonb_array_length(runs) > 500000 or jsonb_array_length(voice) > 500000 or jsonb_array_length(reviews) > 10000 then
    raise exception 'Invalid volume records' using errcode='22023';
  end if;
  insert into pac_dsd.clone_agent_runs(run_id, started_at, finished_at, status, route, jev_calls)
    select (r->>'id')::uuid, (r->>'started')::timestamptz, (r->>'finished')::timestamptz, r->>'status',
      case when r->>'route' in ('resources','learning','equity','accessibility','development','support','general') then r->>'route' end,
      greatest(coalesce((r->>'jev_calls')::integer, 0), 0)
    from jsonb_array_elements(runs) r
    on conflict (run_id) do nothing;
  get diagnostics runs_added = row_count;
  insert into pac_dsd.clone_daily_reviews(review_day, status)
    select (r->>'day')::date, r->>'status' from jsonb_array_elements(reviews) r
    on conflict (review_day) do nothing;
  get diagnostics reviews_added = row_count;
  if not exists (select 1 from pac_dsd.volume_record_imports where import_kind = 'clone_voice_usage') then
    insert into pac_dsd.clone_voice_usage(used_at, kind, units)
      select (v->>'at')::timestamptz, v->>'kind', (v->>'units')::integer from jsonb_array_elements(voice) v where (v->>'units')::integer > 0;
    get diagnostics voice_added = row_count;
    insert into pac_dsd.volume_record_imports(import_kind, row_count) values ('clone_voice_usage', voice_added);
  end if;
  return jsonb_build_object('runsAdded', runs_added, 'reviewsAdded', reviews_added, 'voiceAdded', voice_added);
end; $$;

-- jobs: rows as the SQLite queue stored them (camelCase columns).
create or replace function pac_dsd.import_volume_resource_creation_jobs(jobs jsonb)
returns integer language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare added integer;
begin
  if jsonb_typeof(jobs) <> 'array' or jsonb_array_length(jobs) > 100000 then raise exception 'Invalid volume jobs' using errcode='22023'; end if;
  insert into pac_dsd.resource_creation_jobs(job_id, scope, resource_path, title, kind, revision, status, artifact, files, error,
      created_at_ms, updated_at_ms, lease_token, lease_until_ms, attempts)
    select (j->>'id')::uuid, j->>'scope', j->>'resourcePath', j->>'title', j->>'kind', j->>'revision',
      -- A job that was mid-way when the volume was copied can't resume elsewhere; it fails with a clear note.
      case when j->>'status' in ('queued','generating','rendering') then 'failed' else j->>'status' end,
      j->>'artifact', j->>'files',
      case when j->>'status' in ('queued','generating','rendering') then 'This draft was interrupted while storage moved. Start a new draft when ready.' else j->>'error' end,
      (j->>'createdAt')::bigint, (j->>'updatedAt')::bigint, null, null, coalesce((j->>'attempts')::integer, 0)
    from jsonb_array_elements(jobs) j
    on conflict (job_id) do nothing;
  get diagnostics added = row_count;
  return added;
end; $$;

-- How many of the given volume records are present, for the copy's check.
create or replace function pac_dsd.volume_record_presence(run_ids jsonb, review_days jsonb, job_ids jsonb)
returns jsonb language sql stable security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
  select jsonb_build_object(
    'runs', (select count(*) from pac_dsd.clone_agent_runs where run_id in (select value::uuid from jsonb_array_elements_text(run_ids))),
    'reviews', (select count(*) from pac_dsd.clone_daily_reviews where review_day in (select value::date from jsonb_array_elements_text(review_days))),
    'jobs', (select count(*) from pac_dsd.resource_creation_jobs where job_id in (select value::uuid from jsonb_array_elements_text(job_ids))),
    'voiceImported', exists (select 1 from pac_dsd.volume_record_imports where import_kind = 'clone_voice_usage'));
$$;

revoke all on function pac_dsd.import_volume_clone_records(jsonb,jsonb,jsonb), pac_dsd.import_volume_resource_creation_jobs(jsonb),
  pac_dsd.volume_record_presence(jsonb,jsonb,jsonb) from public, pac_dsd_app_runtime, pac_dsd_owner_writer;
grant execute on function pac_dsd.import_volume_clone_records(jsonb,jsonb,jsonb), pac_dsd.import_volume_resource_creation_jobs(jsonb),
  pac_dsd.volume_record_presence(jsonb,jsonb,jsonb) to pac_dsd_owner_writer;

do $verify$
begin
  if has_function_privilege('pac_dsd_app_runtime', 'pac_dsd.import_volume_clone_records(jsonb,jsonb,jsonb)', 'execute') then
    raise exception 'The runtime role must not import volume records';
  end if;
  if (pac_dsd.volume_record_presence('[]', '[]', '[]')->>'runs')::integer <> 0 then
    raise exception 'Empty presence check is wrong';
  end if;
end;
$verify$;

commit;
