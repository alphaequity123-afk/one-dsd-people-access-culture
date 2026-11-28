-- Administrative installation artifact, exclusively for project htdefyecztafxkvfbrlo.
-- This installs PRIVATE monitoring functions. It does not start either job.
-- Install the matching CRON_SECRET in Railway and Vault before scheduling.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists pac.dsd_retention_job_receipts (
  receipt_id bigint generated always as identity primary key,
  requested_at timestamptz not null default now(),
  request_id bigint unique,
  completed_at timestamptz,
  state text not null default 'pending' check (state in ('pending', 'completed', 'failed')),
  reason text check (reason in ('missing_secret', 'dispatch_failed', 'no_response', 'transport_failed', 'http_failed', 'invalid_receipt', 'retention_incomplete', 'cleanup_incomplete', 'expired_records_remain')),
  http_status integer,
  due_before bigint,
  due_after bigint,
  redacted_count bigint,
  exception_count bigint
);
alter table pac.dsd_retention_job_receipts enable row level security;
revoke all on pac.dsd_retention_job_receipts from public, anon, authenticated, pac_app_runtime;
revoke all on sequence pac.dsd_retention_job_receipts_receipt_id_seq from public, anon, authenticated, pac_app_runtime;

-- Counts only. No requester identifiers or submitted text leaves this function.
-- Invalid expiry text is counted as due, matching the application's fail-closed handling.
create or replace function pac.dsd_retention_due_count(cutoff timestamptz)
returns bigint language sql stable security invoker set search_path = '' as $function$
  select count(*) from pac.runtime_work_objects
  where work_kind = 'consult_request'
    and coalesce(value->>'record_type', '') <> 'consultation_tombstone'
    and case
      when value->>'retention_expires_at' is null then true
      when value->>'retention_expires_at' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' then true
      when not pg_catalog.pg_input_is_valid(value->>'retention_expires_at', 'timestamp with time zone') then true
      else (value->>'retention_expires_at')::timestamptz <= cutoff
    end;
$function$;
revoke all on function pac.dsd_retention_due_count(timestamptz) from public, anon, authenticated, pac_app_runtime;

create or replace function pac.dsd_dispatch_daily_retention()
returns bigint language plpgsql security invoker set search_path = '' as $function$
declare
  credential text;
  receipt bigint;
  network_request bigint;
  dispatch_at timestamptz := clock_timestamp();
begin
  -- A repeated manual call or overlapping job cannot dispatch a concurrent cycle.
  perform pg_catalog.pg_advisory_xact_lock(1864052026, 1);
  if exists (select 1 from pac.dsd_retention_job_receipts where state='pending' and requested_at > dispatch_at - interval '10 minutes') then
    return null;
  end if;
  insert into pac.dsd_retention_job_receipts(requested_at, due_before)
    values(dispatch_at, pac.dsd_retention_due_count(dispatch_at)) returning receipt_id into receipt;
  -- The bearer credential never appears in cron.job.command or a receipt.
  select decrypted_secret into credential from vault.decrypted_secrets
    where name='one_dsd_railway_cron_secret' limit 1;
  if credential is null or length(credential) < 32 then
    update pac.dsd_retention_job_receipts set state='failed',reason='missing_secret',completed_at=clock_timestamp() where receipt_id=receipt;
    return receipt;
  end if;
  begin
    select net.http_get(
      url := 'https://one-people-access-culture.up.railway.app/api/cron/orchestrate?mode=retention',
      headers := jsonb_build_object('Authorization','Bearer ' || credential,'Accept','application/json'),
      timeout_milliseconds := 300000
    ) into network_request;
    update pac.dsd_retention_job_receipts set request_id=network_request where receipt_id=receipt;
  exception when others then
    -- Do not log SQLERRM: an HTTP or extension error might include request headers.
    update pac.dsd_retention_job_receipts set state='failed',reason='dispatch_failed',completed_at=clock_timestamp() where receipt_id=receipt;
  end;
  return receipt;
end;
$function$;
revoke all on function pac.dsd_dispatch_daily_retention() from public, anon, authenticated, pac_app_runtime;

create or replace function pac.dsd_verify_retention_responses()
returns integer language plpgsql security invoker set search_path = '' as $function$
declare
  receipt record;
  response record;
  payload jsonb;
  reason_code text;
  remaining bigint;
  verified integer := 0;
begin
  perform pg_catalog.pg_advisory_xact_lock(1864052026, 2);
  for receipt in select * from pac.dsd_retention_job_receipts where state='pending' order by requested_at loop
    select status_code, timed_out, error_msg is not null as transport_error, content
      into response from net._http_response where id=receipt.request_id;
    if not found then
      if receipt.requested_at < clock_timestamp() - interval '10 minutes' then
        update pac.dsd_retention_job_receipts set state='failed',reason='no_response',completed_at=clock_timestamp() where receipt_id=receipt.receipt_id;
        verified := verified + 1;
      end if;
      continue;
    end if;
    reason_code := null;
    payload := null;
    if response.timed_out is true or response.transport_error then
      reason_code := 'transport_failed';
    elsif response.status_code is distinct from 200 then
      reason_code := 'http_failed';
    else
      begin payload := response.content::jsonb;
      exception when others then reason_code := 'invalid_receipt'; end;
      if reason_code is null then
        if jsonb_typeof(payload) is distinct from 'object'
           or jsonb_typeof(payload->'retention') is distinct from 'object'
           or jsonb_typeof(payload->'expired_consultations') is distinct from 'number'
           or jsonb_typeof(payload->'exceptions') is distinct from 'number'
           or coalesce(payload->>'expired_consultations','') !~ '^[0-9]{1,12}$'
           or coalesce(payload->>'exceptions','') !~ '^[0-9]{1,12}$' then
          reason_code := 'invalid_receipt';
        elsif payload->'retention'->'completed' is distinct from 'true'::jsonb then
          reason_code := 'retention_incomplete';
        elsif payload->'retention'->'security_cleanup_completed' is distinct from 'true'::jsonb then
          reason_code := 'cleanup_incomplete';
        elsif payload->'retention'->'named_session_cleanup_completed' is distinct from 'true'::jsonb then
          reason_code := 'cleanup_incomplete';
        elsif payload->'retention'->'ask_response_cleanup_completed' is distinct from 'true'::jsonb then
          reason_code := 'cleanup_incomplete';
        end if;
      end if;
    end if;
    -- A returned success alone is insufficient. Confirm that every payload due
    -- at dispatch is gone from storage, including failed CAS/conflict scenarios.
    remaining := pac.dsd_retention_due_count(receipt.requested_at);
    if reason_code is null and remaining > 0 then reason_code := 'expired_records_remain'; end if;
    update pac.dsd_retention_job_receipts
      set completed_at=clock_timestamp(), state=case when reason_code is null then 'completed' else 'failed' end,
          reason=reason_code, http_status=response.status_code, due_after=remaining,
          redacted_count=case when coalesce(payload->>'expired_consultations','') ~ '^[0-9]{1,12}$' then (payload->>'expired_consultations')::bigint end,
          exception_count=case when coalesce(payload->>'exceptions','') ~ '^[0-9]{1,12}$' then (payload->>'exceptions')::bigint end
      where receipt_id=receipt.receipt_id;
    verified := verified + 1;
  end loop;
  -- Receipts contain counts only, and follow the owner's two-year duration.
  delete from pac.dsd_retention_job_receipts where state <> 'pending' and requested_at < clock_timestamp() - interval '2 years';
  return verified;
end;
$function$;
revoke all on function pac.dsd_verify_retention_responses() from public, anon, authenticated, pac_app_runtime;
commit;
