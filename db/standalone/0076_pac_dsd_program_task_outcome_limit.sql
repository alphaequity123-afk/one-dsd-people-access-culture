-- Program tasks carry their program area's outcome identifiers. The program model now has eight
-- outcomes (cultural_development was added), and the evaluation area lists all eight, but the
-- runtime work-object contract still refused more than seven. Every daily cycle therefore failed
-- at "complete assigned program work" with "Too big: expected array to have <=7 items" when it
-- prepared the evaluation area's resource review. This raises the stored limit to eight, matching
-- lib/program/work-schema.ts, in the current contract and in the earlier contract versions it
-- delegates to (pac_dsd.assert_runtime_work_object_contract and its _pre_* chain). Nothing else in
-- the contract changes; owner and grants are kept by CREATE OR REPLACE. Apply through a privileged
-- migration connection; it checks itself and is safe to re-run.
begin;

do $$
declare
  old_check constant text := 'jsonb_array_length(payload->''outcomeIds'')>7';
  new_check constant text := 'jsonb_array_length(payload->''outcomeIds'')>8';
  fn regprocedure;
  definition text;
  changed integer := 0;
begin
  for fn in
    select p.oid::regprocedure from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pac_dsd' and p.proname like 'assert\_runtime\_work\_object\_contract%'
  loop
    definition := pg_catalog.pg_get_functiondef(fn);
    continue when position(old_check in definition) = 0;
    if (length(definition) - length(replace(definition, old_check, ''))) / length(old_check) <> 1 then
      raise exception 'Unexpected definition of %; the outcome limit was not changed', fn;
    end if;
    execute replace(definition, old_check, new_check);
    if position(old_check in pg_catalog.pg_get_functiondef(fn)) > 0 then
      raise exception 'The outcome limit of % did not change', fn;
    end if;
    changed := changed + 1;
  end loop;
  if position(new_check in pg_catalog.pg_get_functiondef('pac_dsd.assert_runtime_work_object_contract(text,text,jsonb)'::regprocedure)) = 0 then
    raise exception 'The current runtime work-object contract does not allow eight program outcomes';
  end if;
  raise notice 'program task outcome limit raised to eight in % function(s)', changed;
end;
$$;

commit;
