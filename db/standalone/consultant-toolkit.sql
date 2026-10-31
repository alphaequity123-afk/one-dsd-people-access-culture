-- Additive owner-private consultant case store for an EXISTING isolated One DSD database.
-- Apply with a privileged migration connection, never the app runtime connection.
-- Payloads, titles, source text, results and prior revisions are AES-256-GCM encrypted by the application.
-- This file contains no credentials and does not alter staff APIs, public media, or runtime work-object contracts.
begin;
create table if not exists pac_dsd.consultant_toolkit_cases (
  id uuid primary key,
  version integer not null check (version > 0),
  status text not null check (status in ('draft','review','final')),
  encrypted_payload text not null check (length(encrypted_payload) between 60 and 4200000 and encrypted_payload like 'v1:%'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  finalized_at timestamptz,
  check (updated_at >= created_at),
  check ((status = 'final') = (finalized_at is not null))
);
create table if not exists pac_dsd.consultant_toolkit_case_revisions (
  case_id uuid not null references pac_dsd.consultant_toolkit_cases(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null check (status in ('draft','review','final')),
  encrypted_payload text not null check (length(encrypted_payload) between 60 and 4200000 and encrypted_payload like 'v1:%'),
  created_at timestamptz not null,
  primary key(case_id, version)
);
create index if not exists consultant_toolkit_cases_recent on pac_dsd.consultant_toolkit_cases(updated_at desc,id);
alter table pac_dsd.consultant_toolkit_cases enable row level security;
alter table pac_dsd.consultant_toolkit_cases force row level security;
alter table pac_dsd.consultant_toolkit_case_revisions enable row level security;
alter table pac_dsd.consultant_toolkit_case_revisions force row level security;
revoke all on pac_dsd.consultant_toolkit_cases,pac_dsd.consultant_toolkit_case_revisions from public,pac_dsd_app_runtime,pac_dsd_contributor_runtime,pac_dsd_authentication_broker,pac_dsd_owner_writer;
do $$ declare role_name text; begin
  foreach role_name in array array['anon','authenticated','service_role','pac_app_runtime','pac_owner_writer','pac_contributor_runtime','pac_authentication_broker'] loop
    if exists(select 1 from pg_roles where rolname=role_name) then
      execute format('revoke all on pac_dsd.consultant_toolkit_cases,pac_dsd.consultant_toolkit_case_revisions from %I',role_name);
    end if;
  end loop;
end $$;
grant select,insert,update,delete on pac_dsd.consultant_toolkit_cases to pac_dsd_owner_writer;
grant select,insert,delete on pac_dsd.consultant_toolkit_case_revisions to pac_dsd_owner_writer;
drop policy if exists consultant_owner_cases on pac_dsd.consultant_toolkit_cases;
create policy consultant_owner_cases on pac_dsd.consultant_toolkit_cases to pac_dsd_owner_writer using (true) with check (true);
drop policy if exists consultant_owner_case_revisions on pac_dsd.consultant_toolkit_case_revisions;
create policy consultant_owner_case_revisions on pac_dsd.consultant_toolkit_case_revisions to pac_dsd_owner_writer using (true) with check (true);
comment on table pac_dsd.consultant_toolkit_cases is 'Owner-only consultant cases. Application authenticated encryption protects the payload. No public content or staff read permission.';
comment on table pac_dsd.consultant_toolkit_case_revisions is 'Encrypted immutable-by-application versions. Removed with the parent case; backup retention is separately managed.';
commit;
