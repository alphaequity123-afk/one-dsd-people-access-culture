begin;
create or replace function pac_dsd.assert_runtime_rate_limit_request(requested_scope text, requested_subject_hash text, requested_limit integer, requested_window_seconds integer)
returns void language plpgsql immutable security invoker set search_path=pg_catalog,pac_dsd as $function$
begin
  if requested_scope in ('staff-ask','ask-voice','ask-transcribe') then
    if requested_subject_hash is null or requested_subject_hash !~ '^[a-f0-9]{64}$'
      or requested_window_seconds is distinct from 600
      or requested_limit is null
      or (requested_scope in ('staff-ask','ask-voice') and requested_limit not in (30,120))
      or (requested_scope = 'ask-transcribe' and requested_limit not in (20,80)) then
      raise exception 'Invalid Ask rate limit' using errcode='22023';
    end if;
    return;
  end if;
  if requested_scope not in ('staff-equity-analysis','staff-equity-register') then
    perform pac_dsd.assert_runtime_rate_limit_request_pre_equity_v1(requested_scope,requested_subject_hash,requested_limit,requested_window_seconds); return;
  end if;
  if requested_subject_hash is null or requested_subject_hash !~ '^[a-f0-9]{64}$'
    or requested_window_seconds is distinct from 600
    or requested_limit is distinct from (case requested_scope when 'staff-equity-analysis' then 10 else 60 end) then
    raise exception 'Invalid equity analysis rate limit' using errcode='22023';
  end if;
end $function$;
do $test$
declare s text; n integer;
begin
  foreach s in array array['staff-ask','ask-voice','ask-transcribe'] loop
    n := case when s='ask-transcribe' then 80 else 120 end;
    perform pac_dsd.assert_runtime_rate_limit_request(s,repeat('a',64),n,600);
    perform pac_dsd.assert_runtime_rate_limit_request(s,repeat('a',64),n/4,600);
    begin
      perform pac_dsd.assert_runtime_rate_limit_request(s,repeat('a',64),999,600);
      raise exception 'Invalid limit accepted';
    exception when sqlstate '22023' then null; end;
    begin
      perform pac_dsd.assert_runtime_rate_limit_request(s,'invalid',n,600);
      raise exception 'Invalid subject accepted';
    exception when sqlstate '22023' then null; end;
  end loop;
  perform pac_dsd.assert_runtime_rate_limit_request('staff-equity-analysis',repeat('a',64),10,600);
  perform pac_dsd.assert_runtime_rate_limit_request('staff-equity-register',repeat('a',64),60,600);
end $test$;
commit;
select 'Ask limits aligned; new and rollback values passed; invalid inputs rejected' as verification;