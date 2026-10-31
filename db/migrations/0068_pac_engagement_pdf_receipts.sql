-- Admit only the four approved public resources and pages present in their PDFs.
-- Preserve all other receipt fields, privacy exclusions, roles, and ACLs.
begin;
do $$
declare target regprocedure; definition text; audit_updated integer := 0; work_updated integer := 0;
  previous text := 'somali|hmong|karen|oromo';
  addition text := 'ref-clas-implementation-checklist(-pdf-page-[1-8])?|ref-adsa-engagement-guide(-pdf-page-([1-9]|[1-5][0-9]|60))?|ref-adsa-engagement-checklist(-pdf-page-[1-3])?|ref-adsa-engagement-presentation(-pdf-page-([1-9]|[12][0-9]|3[0-3]))?|';
begin
  foreach target in array array_remove(array[
    to_regprocedure('pac.assert_runtime_audit_event_contract(jsonb)'),
    to_regprocedure('pac.assert_runtime_audit_event_contract_pre_program_v1(jsonb)'),
    to_regprocedure('pac.assert_runtime_work_object_contract(text,text,jsonb)'),
    to_regprocedure('pac.assert_runtime_work_object_contract_pre_program_v1(text,text,jsonb)')
  ], null) loop
    definition := pg_get_functiondef(target);
    if position(previous in definition) = 0 then continue; end if;
    if position(addition in definition) = 0 then
      if position('ref-adsa-engagement-guide' in definition) > 0 then
        raise exception 'Unexpected engagement receipt definition in %', target;
      end if;
      execute replace(definition, previous, addition || previous);
    end if;
    if target::text like '%audit_event%' then audit_updated := audit_updated + 1;
    else work_updated := work_updated + 1; end if;
  end loop;
  if audit_updated <> 1 or work_updated <> 1 then
    raise exception 'Expected one resource validator for audit and work; found %, %', audit_updated, work_updated;
  end if;
end;
$$;
commit;
