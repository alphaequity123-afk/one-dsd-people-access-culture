begin;

-- Voluntary outcome records, schema 2 (owner decision 2026-11-16).
-- A record keeps the month it was shared, never a day or time, and no identity.
-- The registered program_outcome contract gains schema 2 only. Schema 1 records,
-- and every other registered family, keep their existing contracts unchanged.
-- No idempotency receipt is required: the record id comes from the browser's
-- random submission id, so a retry reaches the same primary key and the
-- immutable-record trigger keeps it to one record.
alter function pac.assert_runtime_work_object_contract(text,text,jsonb) rename to assert_runtime_work_object_contract_pre_outcome_v2;

create function pac.assert_runtime_work_object_contract(requested_kind text, requested_object_id text, payload jsonb)
returns void language plpgsql immutable set search_path=pg_catalog,pac as $$
declare field_name text; item jsonb;
begin
  perform pac.assert_no_prohibited_profile_fields(payload);
  if requested_kind is distinct from 'decision' or requested_object_id is null
    or not starts_with(requested_object_id,'program_outcome:')
    or payload is null or jsonb_typeof(payload) <> 'object'
    or payload->'schemaVersion' is distinct from '2'::jsonb then
    perform pac.assert_runtime_work_object_contract_pre_outcome_v2(requested_kind,requested_object_id,payload); return;
  end if;
  if length(requested_object_id)>180 then raise exception 'Invalid program work object' using errcode='22023'; end if;
  perform pac.assert_allowed_jsonb_keys(payload,array['schemaVersion','id','month','evidenceStatus','programScope','problem','action','adoptedChange','observedResult','evidenceUrl','followUp','decision','consent','outcomeId','goalActionIds','reviewMonth']);
  if not (payload ?& array['schemaVersion','id','month','evidenceStatus','programScope','problem','action','adoptedChange','observedResult','followUp','decision','consent']) then raise exception 'Incomplete program outcome' using errcode='22023'; end if;
  perform pac.assert_jsonb_scalar_types(payload,array['id','month','evidenceStatus','programScope','decision','outcomeId','reviewMonth'],array['consent'],array['schemaVersion']);
  if payload->'consent' is distinct from 'true'::jsonb
    or payload->>'id' !~ '^program-outcome-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or requested_object_id is distinct from 'program_outcome:'||(payload->>'id')
    or payload->>'month' !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
    or (payload ? 'reviewMonth' and payload->>'reviewMonth' !~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
    or payload->>'evidenceStatus' is distinct from 'self_reported'
    or payload->>'programScope' not in ('one-dhs','dsd')
    or payload->>'decision' not in ('retain','revise','stop','not_yet_known')
    or (payload ? 'outcomeId' and payload->>'outcomeId' not in ('staff_capability','capability_transfer','access','workplace_culture','institutional_application','organizational_memory','agency_coherence')) then raise exception 'Invalid program outcome' using errcode='22023'; end if;
  foreach field_name in array array['problem','action','adoptedChange','followUp'] loop
    perform pac.assert_program_string(payload,field_name,1,1500);
    if btrim(payload->>field_name)='' then raise exception 'Blank program outcome' using errcode='22023'; end if;
  end loop;
  perform pac.assert_program_string(payload,'observedResult',1,2000);
  if btrim(payload->>'observedResult')='' then raise exception 'Blank program outcome' using errcode='22023'; end if;
  perform pac.assert_program_string(payload,'evidenceUrl',1,1000,false);
  if payload ? 'evidenceUrl' and (
    payload->>'evidenceUrl' !~ '^https://[^/@?#[:space:]]+(/[^?#[:space:]]*)?$'
    or payload->>'evidenceUrl' ~* '^https://(localhost([:/]|$)|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|\[|[^/]*\.(local|internal)([:/]|$))'
  ) then raise exception 'Invalid public outcome evidence link' using errcode='22023'; end if;
  if payload ? 'goalActionIds' then
    perform pac.assert_jsonb_string_array(payload->'goalActionIds');
    if jsonb_array_length(payload->'goalActionIds')>28
      or (select count(distinct value) from jsonb_array_elements(payload->'goalActionIds'))<>jsonb_array_length(payload->'goalActionIds') then raise exception 'Invalid action selections' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(payload->'goalActionIds') loop
      if item#>>'{}' !~ '^ADSA-(1\.[1-5]|2\.[1-5]|3\.[1-8]|4\.[1-3]|5\.[1-3]|6\.[1-4])$' then raise exception 'Unknown supplied action' using errcode='22023'; end if;
    end loop;
  end if;
end $$;

-- Outcome rows keep only the month in their own storage times as well.
-- The trigger name sorts after immutable_program_record, so an identical retry
-- is compared before the times are coarsened; coarsening is idempotent.
create function pac.coarsen_program_outcome_times()
returns trigger language plpgsql set search_path=pg_catalog,pac as $$
begin
  if starts_with(new.object_id,'program_outcome:') then
    new.created_at := date_trunc('month', new.created_at, 'UTC');
    new.updated_at := date_trunc('month', new.updated_at, 'UTC');
  end if;
  return new;
end $$;
create trigger program_outcome_month_only before insert or update on pac.runtime_work_objects
for each row execute function pac.coarsen_program_outcome_times();

revoke all on function pac.assert_runtime_work_object_contract(text,text,jsonb) from public,pac_app_runtime,pac_contributor_runtime,pac_authentication_broker;
revoke all on function pac.assert_runtime_work_object_contract_pre_outcome_v2(text,text,jsonb) from public,pac_app_runtime,pac_contributor_runtime,pac_authentication_broker;
revoke all on function pac.coarsen_program_outcome_times() from public,pac_app_runtime,pac_contributor_runtime,pac_authentication_broker;

comment on function pac.coarsen_program_outcome_times() is 'Privacy: a voluntary outcome record keeps the month it was shared, never a day or time, in its value and in its storage times.';

commit;
