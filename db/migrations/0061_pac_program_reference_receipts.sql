-- Admit only the four published program-reference IDs to resource receipt
-- contracts. All field, privacy, audit and runtime-role restrictions remain.
begin;
do $$
declare target regprocedure; definition text;
  previous text := 'somali|hmong|karen|oromo';
  replacement text := 'ref-one-dsd-three-year-plan|ref-dhs-equity-landscape|ref-minnesota-equity-research|ref-one-dsd-policy-analysis-presentation|somali|hmong|karen|oromo';
begin
  foreach target in array array[
    'pac.assert_runtime_audit_event_contract(jsonb)'::regprocedure,
    'pac.assert_runtime_work_object_contract(text,text,jsonb)'::regprocedure
  ] loop
    definition := pg_get_functiondef(target);
    if position(previous in definition) = 0 then
      raise exception 'Expected canonical resource identifiers are missing from %', target;
    end if;
    if position('ref-one-dsd-three-year-plan' in definition) > 0 then
      raise exception 'Program references already present in %; verify migration ledger', target;
    end if;
    execute replace(definition, previous, replacement);
  end loop;
end;
$$;
commit;
