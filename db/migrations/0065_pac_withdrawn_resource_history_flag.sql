-- A withdrawn resource has no effective publication. History entries still
-- need a boolean current flag so owner withdrawal responses remain readable.
-- Read contract only: no resource, decision, or history records are changed.
begin;
do $migration$
declare
  definition text := pg_get_functiondef('pac.read_resource_release_state(text,text)'::regprocedure);
  previous constant text := E'''isCurrent'', history.revision_id = publication.revision_id\n          and history.scope_id = publication.scope_id';
  replacement constant text := '''isCurrent'', coalesce(history.revision_id = publication.revision_id and history.scope_id = publication.scope_id, false)';
begin
  if position(replacement in definition)>0 then return; end if;
  if position(previous in definition)=0 then
    raise exception 'Expected resource history flag contract is unavailable' using errcode='55000';
  end if;
  execute replace(definition,previous,replacement);
end;
$migration$;
commit;
