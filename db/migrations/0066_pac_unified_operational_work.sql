begin;
-- Forward-only: align hosted durable work with the unified application.
alter function pac.assert_runtime_work_object_contract(text,text,jsonb) rename to assert_runtime_work_object_contract_pre_unified_v1;
create function pac.assert_runtime_work_object_contract(requested_kind text, requested_object_id text, payload jsonb)
returns void language plpgsql immutable set search_path=pg_catalog,pac as $$
declare field_name text; item jsonb;
begin
  perform pac.assert_no_prohibited_profile_fields(payload);
  if requested_kind='decision' and requested_object_id ~ '^program_(task|event):' then perform pac.assert_no_collaboration_surveillance_text(payload); end if;
  if requested_kind is distinct from 'decision' or requested_object_id !~ '^program_(task|event|outcome):' then
    perform pac.assert_runtime_work_object_contract_pre_unified_v1(requested_kind,requested_object_id,payload); return;
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or requested_object_id is null or length(requested_object_id)>180 then raise exception 'Invalid program work object' using errcode='22023'; end if;
  if requested_object_id like 'program_task:%' then
    perform pac.assert_allowed_jsonb_keys(payload,array['recordType','id','createdAt','functionId','outcomeIds','kind','title','objective','agentId','sourceId','dueAt','eligible','exclusionReason','source','evidenceMode','executionMode','goalActionIds']);
    if not (payload ?& array['recordType','id','createdAt','functionId','outcomeIds','kind','title','objective','agentId','dueAt','eligible','source','evidenceMode']) then raise exception 'Incomplete program task' using errcode='22023'; end if;
    perform pac.assert_jsonb_scalar_types(payload,array['recordType','id','functionId','kind','agentId','source','evidenceMode'],array['eligible'],array[]::text[]);
    if payload->>'recordType' is distinct from 'program_task' or payload->>'id' !~ '^task-[a-f0-9]{32}$' or requested_object_id is distinct from 'program_task:'||(payload->>'id')
      or payload->>'kind' not in ('work_preparation','cadence_review','outcome_followup','source_review','resource_review')
      or payload->>'agentId' not in ('program_orchestrator','ask_concierge','ci_guide','librarian','a11y_reviewer','consult_intake','graduation_coach','embed_advisor','content_sentinel','eval_steward')
      or payload->>'source' not in ('owner','cadence','staff_result','program_maintenance')
      or payload->>'evidenceMode' not in ('operational','verification')
      or (payload->>'eligible'='false' and coalesce(payload->>'exclusionReason','')='') then raise exception 'Invalid program task' using errcode='22023'; end if;
    perform pac.assert_program_string(payload,'functionId',1,60);
    perform pac.assert_program_string(payload,'title',5,180);
    perform pac.assert_program_string(payload,'objective',10,3000);
    perform pac.assert_program_string(payload,'sourceId',0,180,false);
    perform pac.assert_program_string(payload,'exclusionReason',0,300,false);
    perform pac.assert_program_instant(payload,'createdAt');
    perform pac.assert_program_instant(payload,'dueAt');
    perform pac.assert_jsonb_string_array(payload->'outcomeIds');
    if jsonb_array_length(payload->'outcomeIds')>7 then raise exception 'Too many program outcomes' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(payload->'outcomeIds') loop
      if length(item#>>'{}')>60 then raise exception 'Invalid program outcome identifier' using errcode='22023'; end if;
    end loop;
    if payload ? 'executionMode' and payload->>'executionMode' not in ('manual','assisted') then raise exception 'Invalid preparation mode'; end if;
    if payload ? 'goalActionIds' then
      perform pac.assert_jsonb_string_array(payload->'goalActionIds');
      if jsonb_array_length(payload->'goalActionIds')>28 or (select count(distinct value) from jsonb_array_elements(payload->'goalActionIds'))<>jsonb_array_length(payload->'goalActionIds') then raise exception 'Invalid action selections'; end if;
      for item in select value from jsonb_array_elements(payload->'goalActionIds') loop
        if item#>>'{}' !~ '^ADSA-(1\.[1-5]|2\.[1-5]|3\.[1-8]|4\.[1-3]|5\.[1-3]|6\.[1-4])$' then raise exception 'Unknown supplied action'; end if;
      end loop;
    end if;
    return;
  end if;  if requested_object_id like 'program_event:%' then
    perform pac.assert_allowed_jsonb_keys(payload,array['recordType','id','taskId','at','phase','attempt','actor','note','receipt','disposition','followUpAt','humanMinutes','preparationPlan','decisionOwner','decisionReference','nextAction','implementationOwner','resultObservation','resultEvidence','resultLimitations','resultConfidence']);
    if not (payload ?& array['recordType','id','taskId','at','phase','attempt','actor','note']) then raise exception 'Incomplete program event' using errcode='22023'; end if;
    perform pac.assert_jsonb_scalar_types(payload,array['recordType','id','taskId','phase','actor','disposition'],array[]::text[],array['attempt','humanMinutes']);
    if payload->>'recordType' is distinct from 'program_event'
      or payload->>'id' !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
      or requested_object_id is distinct from 'program_event:'||(payload->>'id')
      or payload->>'taskId' !~ '^task-[a-f0-9]{32}$'
      or payload->>'phase' not in ('started','completed','prepared','decision_recorded','results_recorded','failed','applied','reviewed','cancelled','retry_requested')
      or payload->>'actor' not in ('agent','owner')
      or pac.jsonb_is_safe_integer(payload->'attempt',0) is distinct from true
      or (payload->>'attempt')::numeric>10000
      or (payload->>'phase'='completed' and not (payload ? 'receipt'))
      or (payload->>'phase' in ('prepared','decision_recorded','results_recorded','applied','reviewed','cancelled','retry_requested') and payload->>'actor'<>'owner')
      or (payload ? 'disposition' and payload->>'disposition' not in ('retain','revise','stop','not_yet_known'))
      or (payload ? 'humanMinutes' and (payload->>'humanMinutes')::numeric not between 0 and 100000) then raise exception 'Invalid program event' using errcode='22023'; end if;
    perform pac.assert_program_string(payload,'note',0,3000);
    perform pac.assert_program_instant(payload,'at');
    perform pac.assert_program_instant(payload,'followUpAt',false);
    if payload ? 'receipt' then perform pac.assert_program_receipt(payload->'receipt'); end if;
    if payload->>'phase'='prepared' and (jsonb_typeof(payload->'preparationPlan') is distinct from 'object' or payload->'receipt'->>'method' is distinct from 'owner_report' or payload->'receipt'->>'evidenceLevel' is distinct from 'delivery') then raise exception 'Manual draft receipt required'; end if;
    foreach field_name in array array['decisionOwner','decisionReference','nextAction','implementationOwner'] loop
      if payload ? field_name or payload->>'phase'='decision_recorded' then perform pac.assert_program_string(payload,field_name,case when field_name in ('decisionOwner','implementationOwner') then 2 else 5 end,case when field_name in ('decisionOwner','implementationOwner') then 240 else 1500 end); end if;
    end loop;
    foreach field_name in array array['resultObservation','resultEvidence','resultLimitations'] loop
      if payload ? field_name or payload->>'phase'='results_recorded' then perform pac.assert_program_string(payload,field_name,10,1500); end if;
    end loop;
    if payload->>'phase'='results_recorded' or payload ? 'resultConfidence' then
      if payload->>'resultConfidence' is null or payload->>'resultConfidence' not in ('early_observation','supported_observation','not_yet_known') then raise exception 'Result confidence required'; end if;
    end if;
    if payload ? 'preparationPlan' then
      perform pac.assert_allowed_jsonb_keys(payload->'preparationPlan',array['reviewNeeds','measure','reportBack','measureDefinition']);
      perform pac.assert_program_string(payload->'preparationPlan','reviewNeeds',10,1500);
      perform pac.assert_program_string(payload->'preparationPlan','measure',10,1500);
      perform pac.assert_program_string(payload->'preparationPlan','reportBack',5,1000);
      if payload->'preparationPlan' ? 'measureDefinition' then
        item:=payload->'preparationPlan'->'measureDefinition';
        perform pac.assert_allowed_jsonb_keys(item,array['id','version','status','title','calculation','population','evidenceSource','period','comparison','differencesPrivacy','targetReference','reviewReference','nextTrigger']);
        if item->>'status' is distinct from 'proposed' or item->>'id' is distinct from 'measure-'||substring(payload->>'taskId' from 6) or pac.jsonb_is_safe_integer(item->'version',1) is distinct from true or (item->>'version')::numeric>100000 then raise exception 'Invalid proposed measure identity'; end if;
        foreach field_name in array array['title','calculation','population','evidenceSource','period','comparison','differencesPrivacy','targetReference','reviewReference','nextTrigger'] loop perform pac.assert_program_string(item,field_name,case when field_name in ('calculation','population','evidenceSource','comparison','differencesPrivacy') then 10 else 5 end,case when field_name='title' then 240 when field_name='period' then 500 when field_name in ('population','nextTrigger') then 1000 else 1500 end); end loop;
      end if;
    end if;

    return;
  end if;
  perform pac.assert_runtime_work_object_contract_pre_unified_v1(requested_kind,requested_object_id,payload);
end $$;
create or replace function pac.program_event_transition_valid(payload jsonb)
returns boolean language plpgsql volatile security definer set search_path=pg_catalog,pac as $$
declare task jsonb; latest jsonb; execution jsonb; current_status text; current_attempt integer; phase text; actor text; attempted integer;
begin
  perform pac.assert_runtime_work_object_contract('decision','program_event:'||(payload->>'id'),payload);
  select value into task from pac.runtime_work_objects
    where work_kind='decision' and object_id='program_task:'||(payload->>'taskId') for update;
  if task is null then return false; end if;
  select value into latest from pac.runtime_work_objects
    where work_kind='decision' and object_id like 'program_event:%' and value->>'taskId'=payload->>'taskId'
    order by value->>'at' desc, (value->>'attempt')::integer desc, value->>'id' desc limit 1;
  select value into execution from pac.runtime_work_objects
    where work_kind='decision' and object_id like 'program_event:%' and value->>'taskId'=payload->>'taskId'
      and value->>'phase' in ('started','completed','prepared','failed','cancelled','retry_requested')
    order by value->>'at' desc, (value->>'attempt')::integer desc, value->>'id' desc limit 1;
  select coalesce(max((value->>'attempt')::integer),0) into current_attempt from pac.runtime_work_objects
    where work_kind='decision' and object_id like 'program_event:%' and value->>'taskId'=payload->>'taskId';
  if latest is not null and payload->>'at'<=latest->>'at' then return false; end if;
  current_status:=coalesce(execution->>'phase','queued');
  phase:=payload->>'phase';actor:=payload->>'actor';attempted:=(payload->>'attempt')::integer;
  if payload ? 'receipt' and payload->'receipt'->>'contentHash' is distinct from encode(sha256(convert_to(payload->'receipt'->>'body','UTF8')),'hex') then return false; end if;
  if payload->'preparationPlan' ? 'measureDefinition' then
    if phase<>'prepared' or (payload->'preparationPlan'->'measureDefinition'->>'version')::integer<>(select coalesce(max((value->'preparationPlan'->'measureDefinition'->>'version')::integer),0)+1 from pac.runtime_work_objects where work_kind='decision' and value->>'taskId'=payload->>'taskId') then return false; end if;
  end if;
  if phase='prepared' then return actor='owner' and task->>'executionMode'='manual' and attempted=current_attempt and current_status in ('queued','retry_requested','failed') and payload->'receipt'->>'method'='owner_report' and payload->'receipt'->>'evidenceLevel'='delivery'; end if;
  if phase='started' then
    if task->>'executionMode'='manual' then return false; end if;
    return actor='agent' and attempted=current_attempt+1 and (
      current_status in ('queued','retry_requested') or (current_status='failed' and current_attempt<3) or
      (current_status='started' and (payload->>'at')::timestamptz-(execution->>'at')::timestamptz>=interval '10 minutes'));
  end if;
  if phase in ('completed','failed') then
    return actor='agent' and current_status='started' and attempted=current_attempt and
      (phase<>'completed' or payload->'receipt'->>'evidenceLevel'='delivery');
  end if;
  if actor<>'owner' or attempted<>current_attempt or payload ? 'receipt' then return false; end if;
  if phase='cancelled' then return current_status<>'cancelled'; end if;
  if phase='retry_requested' then return current_status in ('failed','cancelled','completed','prepared'); end if;
  if phase in ('applied','results_recorded') and not exists(select 1 from pac.runtime_work_objects where work_kind='decision' and value->>'taskId'=payload->>'taskId' and value->>'phase'=case when phase='applied' then 'decision_recorded' else 'applied' end and value->>'at'>execution->>'at') then return false; end if;
  return phase in ('decision_recorded','results_recorded','applied','reviewed') and current_status in ('completed','prepared') and execution ? 'receipt';
end $$;

revoke all on function pac.assert_runtime_work_object_contract(text,text,jsonb) from public,pac_app_runtime;
commit;
