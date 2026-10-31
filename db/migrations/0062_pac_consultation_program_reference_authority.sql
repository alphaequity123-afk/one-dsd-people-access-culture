-- Match the existing application citation contract for the reviewed program
-- documents. This changes only the enumerated authority label; every field,
-- length, privacy, timestamp, version, and role restriction remains intact.
begin;
do $$
declare definition text; revised text;
begin
  definition := pg_get_functiondef('pac.assert_consultation_persistence_contract(text,jsonb)'::regprocedure);
  revised := replace(definition, '''partner_informed'', ''local''', '''partner_informed'', ''program_reference'', ''local''');
  if revised = definition then
    raise exception 'Expected consultation authority contract is missing; verify the migration ledger';
  end if;
  execute revised;
end;
$$;
commit;
