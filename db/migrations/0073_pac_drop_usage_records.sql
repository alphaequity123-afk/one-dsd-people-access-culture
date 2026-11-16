begin;

-- Usage records removed (owner decision 2026-11-16: Ask and learning activity
-- are never stored or counted, not even anonymous totals).
-- The application no longer writes or reads either table. Both drops are
-- written so they are safe on a database that never had the tables.
-- Owner work keeps its own audit table; this migration does not touch it.

-- Restore preparation no longer reaches Ask records, because there are none.
-- Its receipt keeps the same columns; ask_records_excluded is now always 0.
-- CREATE OR REPLACE keeps the function's owner and its revoked execute grants.
create or replace function pac.prepare_isolated_program_restore(p_environment text,p_recovery_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,pac set row_security=off as $$
declare prior pac.program_recovery_preparations%rowtype; activation pac.protected_feature_activation_events%rowtype;
  revoked integer; invitations integer; credentials integer;
begin
  if p_environment is null or p_environment not in ('local','preview','production') or p_recovery_id is null then
    raise exception 'Invalid isolated recovery preparation' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('pac-isolated-program-restore',0));
  select * into prior from pac.program_recovery_preparations where recovery_id=p_recovery_id;
  if found then
    if prior.environment<>p_environment then raise exception 'Recovery boundary mismatch'; end if;
    return to_jsonb(prior);
  end if;
  if exists(select 1 from pac.program_accounts where environment<>p_environment) then
    raise exception 'Recovery target contains a different named identity environment' using errcode='42501'; end if;
  for activation in
    select distinct on(feature_key) * from pac.protected_feature_activation_events
    where environment=p_environment order by feature_key,activation_event_id desc
  loop
    perform pac.record_protected_feature_activation(p_environment,activation.feature_key,'inactive',activation.evidence_id,activation.activation_bundle_sha256,'Isolated restore: current authority must be reconciled before access.');
  end loop;
  insert into pac.program_account_session_revocations(session_id,reason)
    select session_id,'Old backup session invalidated during isolated restore.'
    from pac.program_account_sessions where environment=p_environment on conflict(session_id) do nothing;
  get diagnostics revoked=row_count;
  insert into pac.program_account_invitation_closures(invitation_id,outcome,recovery_evidence_id,reason)
    select i.invitation_id,'superseded','restore:'||p_recovery_id::text,'Old backup invitation invalidated during isolated restore.'
    from pac.program_account_invitations i join pac.program_account_invitation_secrets s using(invitation_id)
    where i.environment=p_environment on conflict(invitation_id) do nothing;
  delete from pac.program_account_invitation_secrets s using pac.program_account_invitations i where s.invitation_id=i.invitation_id and i.environment=p_environment;
  get diagnostics invitations=row_count;
  delete from pac.program_account_credential_secrets s using pac.program_account_credentials c,pac.program_accounts a
    where s.credential_id=c.credential_id and c.account_id=a.account_id and a.environment=p_environment;
  get diagnostics credentials=row_count;
  insert into pac.program_recovery_preparations(recovery_id,environment,ask_records_excluded,named_sessions_revoked,invitation_secrets_removed,credential_secrets_removed)
    values(p_recovery_id,p_environment,0,revoked,invitations,credentials);
  select * into prior from pac.program_recovery_preparations where recovery_id=p_recovery_id;
  return to_jsonb(prior);
end $$;

-- The four functions that wrote, listed, deleted and expired Ask response records.
drop function if exists pac.append_ask_response_record(jsonb);
drop function if exists pac.list_ask_response_records(integer,timestamptz,uuid,timestamptz);
drop function if exists pac.delete_ask_response_records(jsonb);
drop function if exists pac.purge_expired_ask_response_records(timestamptz);

-- The table goes with its indexes, row-level security and its record contract.
drop table if exists pac.ask_response_records;

-- Validators used only by that record contract.
drop function if exists pac.valid_ask_evidence_claims(jsonb);
drop function if exists pac.valid_ask_source_evidence(jsonb);
drop function if exists pac.valid_ask_practice_artifact(jsonb);

-- Anonymous counters: the table goes with its grants, policies and scope check.
drop table if exists pac.runtime_counters;

commit;
