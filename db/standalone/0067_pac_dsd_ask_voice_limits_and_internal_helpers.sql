begin;

-- Forward-only: retain existing request scopes and their exact limits while adding ASK voice.
create or replace function pac_dsd.assert_runtime_rate_limit_request(requested_scope text, requested_subject_hash text, requested_limit integer, requested_window_seconds integer)
returns void language plpgsql immutable security invoker set search_path=pg_catalog,pac_dsd as $function$
begin
  if requested_scope in ('ask-voice','ask-transcribe') then
    if requested_subject_hash is null or requested_subject_hash !~ '^[a-f0-9]{64}$'
      or requested_window_seconds is distinct from 600
      or requested_limit is distinct from (case requested_scope when 'ask-voice' then 30 else 20 end) then
      raise exception 'Invalid voice rate limit' using errcode='22023';
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
alter table pac_dsd.runtime_rate_limits drop constraint runtime_rate_limits_registered_identity;
alter table pac_dsd.runtime_rate_limits add constraint runtime_rate_limits_registered_identity check(
 scope in ('staff-ask','owner-login','consultation-intake','consultation-tracking','staff-program-outcome','program-login-network','program-login-account','program-invitation-network','program-invitation-code','staff-equity-analysis','staff-equity-register','ask-voice','ask-transcribe')
 and subject_hash ~ '^[a-f0-9]{64}$'
);

-- These helpers run inside owner-owned protected functions or triggers.
-- Preserve owner and explicit ACLs; do not inherit direct access through PUBLIC.
revoke execute on function pac_dsd.surface_document_hash(text) from public;
revoke execute on function pac_dsd.protected_action_fingerprint(text,jsonb) from public;
revoke execute on function pac_dsd.assert_protected_action_authorization_shape() from public;

commit;
