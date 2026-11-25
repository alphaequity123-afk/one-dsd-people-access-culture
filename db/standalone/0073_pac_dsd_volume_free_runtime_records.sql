-- Records that used to need the One DSD service's persistent volume: the owner's page edits and
-- the Ask pilot's operational counts (runs, voice use, the daily review claim). No prompts, names,
-- answers or audio are kept. The application uses these only when PAC_RUNTIME_RECORDS=postgres;
-- until then nothing reads or writes them.
--
-- Readers and the Ask ledger use pac_dsd_app_runtime. Page edit saves use pac_dsd_owner_writer, as
-- every other owner edit does. Tables are reachable only through these definer functions.
begin;

do $$ begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname='pac_dsd_owner_writer') then
    create role pac_dsd_owner_writer login noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
  end if;
end; $$;
grant usage on schema pac_dsd to pac_dsd_owner_writer;

-- One document, the same JSON shape as .data/page-edits/page-edits.json (version 1).
create table if not exists pac_dsd.page_edit_documents (
  document_id text primary key check (document_id = 'page-edits'),
  revision bigint not null check (revision > 0),
  body jsonb not null check (
    jsonb_typeof(body) = 'object'
    and body->'version' = '1'::jsonb
    and jsonb_typeof(body->'pages') = 'object'
    and jsonb_typeof(body->'log') = 'array'
    and octet_length(body::text) <= 16777216
  ),
  updated_at timestamptz not null default now()
);
-- The last 40 versions before each save, as the file store's backups folder keeps.
create table if not exists pac_dsd.page_edit_document_history (
  history_id bigint generated always as identity primary key,
  document_id text not null check (document_id = 'page-edits'),
  revision bigint not null,
  body jsonb not null,
  archived_at timestamptz not null default now()
);
create index if not exists page_edit_document_history_recent_idx on pac_dsd.page_edit_document_history(document_id, history_id desc);

create table if not exists pac_dsd.clone_agent_runs (
  run_id uuid primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check (status in ('running','interrupted','completed','needs_review','refused','failed')),
  route text check (route is null or route in ('resources','learning','equity','accessibility','development','support','general')),
  jev_calls integer not null default 0 check (jev_calls >= 0)
);
create index if not exists clone_agent_runs_started_idx on pac_dsd.clone_agent_runs(started_at);
create index if not exists clone_agent_runs_running_idx on pac_dsd.clone_agent_runs(started_at) where status = 'running';

create table if not exists pac_dsd.clone_voice_usage (
  usage_id bigint generated always as identity primary key,
  used_at timestamptz not null,
  kind text not null check (kind in ('speech','transcribe')),
  units integer not null check (units between 1 and 1000000)
);

create table if not exists pac_dsd.clone_daily_reviews (
  review_day date primary key,
  status text not null check (status in ('running','completed','needs_review','failed'))
);

alter table pac_dsd.page_edit_documents enable row level security;
alter table pac_dsd.page_edit_document_history enable row level security;
alter table pac_dsd.clone_agent_runs enable row level security;
alter table pac_dsd.clone_voice_usage enable row level security;
alter table pac_dsd.clone_daily_reviews enable row level security;
revoke all on pac_dsd.page_edit_documents, pac_dsd.page_edit_document_history, pac_dsd.clone_agent_runs,
  pac_dsd.clone_voice_usage, pac_dsd.clone_daily_reviews from public, pac_dsd_app_runtime, pac_dsd_owner_writer;

-- Page edits. A read names the revision the server already holds, so an unchanged document is not resent.
create or replace function pac_dsd.read_page_edit_document(known_revision bigint)
returns table(revision bigint, body jsonb)
language sql stable security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
  select d.revision, case when d.revision = known_revision then null else d.body end
  from pac_dsd.page_edit_documents d where d.document_id = 'page-edits';
$$;

-- A save names the revision it started from (0 when there was no document) and fails with 40001
-- when another save came first, so no edit is ever overwritten unseen.
create or replace function pac_dsd.write_page_edit_document(expected_revision bigint, new_body jsonb)
returns bigint language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare current_revision bigint;
declare current_body jsonb;
begin
  if expected_revision is null or expected_revision < 0 or new_body is null then
    raise exception 'Invalid page edit document' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pac_dsd.page_edit_documents', 0));
  select d.revision, d.body into current_revision, current_body from pac_dsd.page_edit_documents d where d.document_id = 'page-edits';
  if coalesce(current_revision, 0) <> expected_revision then
    raise exception 'Page edits changed since they were read' using errcode='40001';
  end if;
  if current_revision is null then
    insert into pac_dsd.page_edit_documents(document_id, revision, body) values ('page-edits', 1, new_body);
    return 1;
  end if;
  insert into pac_dsd.page_edit_document_history(document_id, revision, body) values ('page-edits', current_revision, current_body);
  delete from pac_dsd.page_edit_document_history h where h.document_id = 'page-edits' and h.history_id not in (
    select k.history_id from pac_dsd.page_edit_document_history k where k.document_id = 'page-edits' order by k.history_id desc limit 40
  );
  update pac_dsd.page_edit_documents set revision = current_revision + 1, body = new_body, updated_at = now() where document_id = 'page-edits';
  return current_revision + 1;
end; $$;

-- Ask pilot ledger. Runs still running after four minutes are marked interrupted when the next run starts.
create or replace function pac_dsd.admit_clone_agent_run(admitted_at timestamptz)
returns uuid language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare new_id uuid := gen_random_uuid();
begin
  if admitted_at is null then raise exception 'Invalid run time' using errcode='22023'; end if;
  update pac_dsd.clone_agent_runs set status = 'interrupted', finished_at = admitted_at
    where status = 'running' and started_at < admitted_at - interval '240 seconds';
  insert into pac_dsd.clone_agent_runs(run_id, started_at, status) values (new_id, admitted_at, 'running');
  return new_id;
end; $$;

create or replace function pac_dsd.finish_clone_agent_run(target_run uuid, final_status text)
returns void language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
begin
  if final_status is null or final_status not in ('completed','needs_review','refused','failed') then
    raise exception 'Invalid run status' using errcode='22023';
  end if;
  update pac_dsd.clone_agent_runs set status = final_status, finished_at = now() where run_id = target_run and status = 'running';
end; $$;

create or replace function pac_dsd.record_clone_agent_decision(target_run uuid, decided_route text)
returns void language sql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
  update pac_dsd.clone_agent_runs set jev_calls = jev_calls + 1, route = coalesce(decided_route, route) where run_id = target_run;
$$;

create or replace function pac_dsd.record_clone_voice_use(voice_kind text, used_units integer, used_at timestamptz)
returns boolean language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
begin
  if used_units is null or used_units <= 0 then return false; end if;
  if voice_kind is null or voice_kind not in ('speech','transcribe') or used_at is null or used_units > 1000000 then
    raise exception 'Invalid voice use' using errcode='22023';
  end if;
  insert into pac_dsd.clone_voice_usage(used_at, kind, units) values (used_at, voice_kind, used_units);
  return true;
end; $$;

create or replace function pac_dsd.claim_clone_daily_review(claimed_day date)
returns boolean language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
declare claimed integer;
begin
  if claimed_day is null then raise exception 'Invalid review day' using errcode='22023'; end if;
  insert into pac_dsd.clone_daily_reviews(review_day, status) values (claimed_day, 'running') on conflict (review_day) do nothing;
  get diagnostics claimed = row_count;
  return claimed > 0;
end; $$;

create or replace function pac_dsd.settle_clone_daily_review(claimed_day date, final_status text)
returns void language plpgsql security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
begin
  if final_status is null or final_status not in ('completed','needs_review','failed') then
    raise exception 'Invalid review status' using errcode='22023';
  end if;
  update pac_dsd.clone_daily_reviews set status = final_status where review_day = claimed_day;
end; $$;

create or replace function pac_dsd.summarize_clone_agent_runs(since timestamptz)
returns table(status text, count bigint, jev_calls bigint)
language sql stable security definer set search_path=pg_catalog,pac_dsd set row_security=off as $$
  select r.status, count(*), coalesce(sum(r.jev_calls), 0)::bigint from pac_dsd.clone_agent_runs r
  where r.started_at >= since group by r.status order by r.status;
$$;

revoke all on function
  pac_dsd.read_page_edit_document(bigint), pac_dsd.write_page_edit_document(bigint,jsonb),
  pac_dsd.admit_clone_agent_run(timestamptz), pac_dsd.finish_clone_agent_run(uuid,text),
  pac_dsd.record_clone_agent_decision(uuid,text), pac_dsd.record_clone_voice_use(text,integer,timestamptz),
  pac_dsd.claim_clone_daily_review(date), pac_dsd.settle_clone_daily_review(date,text),
  pac_dsd.summarize_clone_agent_runs(timestamptz)
from public, pac_dsd_app_runtime, pac_dsd_owner_writer;
grant execute on function
  pac_dsd.read_page_edit_document(bigint),
  pac_dsd.admit_clone_agent_run(timestamptz), pac_dsd.finish_clone_agent_run(uuid,text),
  pac_dsd.record_clone_agent_decision(uuid,text), pac_dsd.record_clone_voice_use(text,integer,timestamptz),
  pac_dsd.claim_clone_daily_review(date), pac_dsd.settle_clone_daily_review(date,text),
  pac_dsd.summarize_clone_agent_runs(timestamptz)
to pac_dsd_app_runtime;
grant execute on function pac_dsd.read_page_edit_document(bigint), pac_dsd.write_page_edit_document(bigint,jsonb) to pac_dsd_owner_writer;

-- Checks, inside the same transaction: nothing here is kept.
do $verify$
declare
  first_run uuid;
  stale_run uuid;
  claimed boolean;
  saved bigint;
begin
  if has_function_privilege('pac_dsd_app_runtime', 'pac_dsd.write_page_edit_document(bigint,jsonb)', 'execute') then
    raise exception 'The runtime role must not save page edits';
  end if;
  if not has_function_privilege('pac_dsd_owner_writer', 'pac_dsd.write_page_edit_document(bigint,jsonb)', 'execute') then
    raise exception 'The owner writer must be able to save page edits';
  end if;
  if has_table_privilege('pac_dsd_app_runtime', 'pac_dsd.clone_agent_runs', 'select')
    or has_table_privilege('pac_dsd_app_runtime', 'pac_dsd.page_edit_documents', 'select') then
    raise exception 'Runtime records must be reachable only through their functions';
  end if;

  stale_run := pac_dsd.admit_clone_agent_run('2000-01-01T00:00:00Z');
  first_run := pac_dsd.admit_clone_agent_run('2000-01-01T00:05:00Z');
  if (select status from pac_dsd.clone_agent_runs where run_id = stale_run) <> 'interrupted' then
    raise exception 'A stale run was not marked interrupted';
  end if;
  perform pac_dsd.record_clone_agent_decision(first_run, 'learning');
  perform pac_dsd.finish_clone_agent_run(first_run, 'completed');
  if (select jev_calls from pac_dsd.summarize_clone_agent_runs('2000-01-01T00:00:00Z') where status = 'completed') <> 1 then
    raise exception 'The run summary is wrong';
  end if;
  begin
    perform pac_dsd.finish_clone_agent_run(first_run, 'running');
    raise exception 'An invalid run status was accepted';
  exception when sqlstate '22023' then null;
  end;
  if pac_dsd.record_clone_voice_use('speech', 0, now()) or not pac_dsd.record_clone_voice_use('speech', 12, now()) then
    raise exception 'Voice use was recorded wrongly';
  end if;
  claimed := pac_dsd.claim_clone_daily_review('2000-01-01');
  if not claimed or pac_dsd.claim_clone_daily_review('2000-01-01') then
    raise exception 'A daily review was claimed twice';
  end if;
  perform pac_dsd.settle_clone_daily_review('2000-01-01', 'completed');

  if not exists (select 1 from pac_dsd.page_edit_documents) then
    saved := pac_dsd.write_page_edit_document(0, '{"version":1,"updatedAt":null,"pages":{},"log":[]}');
    if saved <> 1 or (select body from pac_dsd.read_page_edit_document(1)) is not null then
      raise exception 'An unchanged page edit document was resent';
    end if;
    begin
      perform pac_dsd.write_page_edit_document(0, '{"version":1,"updatedAt":null,"pages":{},"log":[]}');
      raise exception 'A stale page edit save was accepted';
    exception when sqlstate '40001' then null;
    end;
    saved := pac_dsd.write_page_edit_document(1, '{"version":1,"updatedAt":"2000-01-01T00:00:00.000Z","pages":{},"log":[]}');
    if saved <> 2 or (select count(*) from pac_dsd.page_edit_document_history) <> 1 then
      raise exception 'A page edit save did not keep the earlier version';
    end if;
    delete from pac_dsd.page_edit_document_history;
    delete from pac_dsd.page_edit_documents;
  end if;

  delete from pac_dsd.clone_agent_runs where run_id in (stale_run, first_run);
  delete from pac_dsd.clone_voice_usage where used_at > now() - interval '1 minute' and units = 12;
  delete from pac_dsd.clone_daily_reviews where review_day = '2000-01-01';
end;
$verify$;

commit;
