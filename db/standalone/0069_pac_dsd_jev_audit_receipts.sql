-- Register the existing bounded Jev decision tool in the finite audit contract.
-- Do not change agent permissions, autonomy, review outcomes, or stored payloads.
begin;
do $$
declare target regprocedure; definition text; updated integer := 0;
  previous text := '''citation.attach''';
  replacement text := '''decision.jev'', ''citation.attach''';
begin
  foreach target in array array_remove(array[
    to_regprocedure('pac_dsd.assert_runtime_audit_event_contract(jsonb)'),
    to_regprocedure('pac_dsd.assert_runtime_audit_event_contract_pre_program_v1(jsonb)')
  ], null) loop
    definition := pg_get_functiondef(target);
    if position(previous in definition) = 0 then continue; end if;
    if position('''decision.jev''' in definition) = 0 then
      execute replace(definition, previous, replacement);
    end if;
    updated := updated + 1;
  end loop;
  if updated <> 1 then raise exception 'Expected one finite audit tool validator, found %', updated; end if;
end;
$$;
commit;
