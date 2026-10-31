-- Admit only the four published planning/reporting resource IDs that can
-- occur in cycle, stale-content and audit receipts. No policy level, role,
-- row access or arbitrary guide-* namespace is changed.
begin;

do $$
declare target regprocedure; definition text; audit_updated integer := 0; work_updated integer := 0;
  previous text := 'somali|hmong|karen|oromo';
  replacement text := 'guide-one-dsd-quarterly-report|guide-one-dsd-measures|guide-one-dsd-work-plan|guide-one-dsd-implementation-plan|somali|hmong|karen|oromo';
begin
  -- Later contracts delegate to preserved validators. Update the validator
  -- that actually owns the resource list, without replacing its wrappers.
  foreach target in array array_remove(array[
    to_regprocedure('pac.assert_runtime_audit_event_contract(jsonb)'),
    to_regprocedure('pac.assert_runtime_audit_event_contract_pre_program_v1(jsonb)'),
    to_regprocedure('pac.assert_runtime_work_object_contract(text,text,jsonb)'),
    to_regprocedure('pac.assert_runtime_work_object_contract_pre_program_v1(text,text,jsonb)')
  ], null) loop
    definition := pg_get_functiondef(target);
    if position(previous in definition) = 0 then continue; end if;
    if position('guide-one-dsd-quarterly-report' in definition) = 0 then
      definition := replace(definition, previous, replacement);
    end if;
    -- Also preserve the four program references intended by migration 0061
    -- when an installation uses the later delegating contract wrappers.
    if position('ref-one-dsd-three-year-plan' in definition) = 0 then
      definition := replace(definition, previous,
        'ref-one-dsd-three-year-plan|ref-dhs-equity-landscape|ref-minnesota-equity-research|ref-one-dsd-policy-analysis-presentation|' || previous);
    end if;
    execute definition;
    if target::text like '%audit_event%' then audit_updated := audit_updated + 1;
    else work_updated := work_updated + 1; end if;
  end loop;
  if audit_updated <> 1 or work_updated <> 1 then
    raise exception 'Expected one resource validator for audit and one for work objects; found %, %', audit_updated, work_updated;
  end if;
end;
$$;
commit;
