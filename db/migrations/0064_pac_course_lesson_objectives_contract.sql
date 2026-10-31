-- Match the existing application course contract without changing course copy.
-- Lesson learning may include 3–5 explicit objectives as well as its existing
-- single objective. Strict object keys and all other limits remain unchanged.
begin;
do $migration$
declare
  existing_schema jsonb := pac.course_pack_schema();
  objectives_schema constant jsonb := '{"type":"array","minItems":3,"maxItems":5,"items":{"type":"string","minLength":1,"maxLength":100000,"pattern":"(?s)."}}'::jsonb;
  field_path constant text[] := array['properties','course','properties','lessons','items','properties','learning','properties','objectives'];
  revised_schema jsonb;
begin
  if existing_schema #>> '{properties,course,properties,lessons,items,properties,learning,type}' is distinct from 'object'
    or existing_schema #> '{properties,course,properties,lessons,items,properties,learning,additionalProperties}' is distinct from 'false'::jsonb
    or not (existing_schema #> '{properties,course,properties,lessons,items,properties,learning,properties}')
      ?& array['objective','takeaways','evidence','appliedNextStep'] then
    raise exception 'Expected lesson learning contract is unavailable' using errcode='55000';
  end if;
  if existing_schema #> field_path is not null then
    if existing_schema #> field_path is distinct from objectives_schema then
      raise exception 'Existing lesson objectives contract requires reconciliation' using errcode='55000';
    end if;
    return;
  end if;
  -- The existing SQL validator enforces patterns; (?s). also enforces the
  -- nonempty-string minimum across line breaks without widening any other field.
  revised_schema := jsonb_set(existing_schema,field_path,objectives_schema,true);
  execute format(
    'create or replace function pac.course_pack_schema() returns jsonb language sql immutable set search_path=pg_catalog as $schema_function$ select %L::jsonb $schema_function$',
    revised_schema::text
  );
end;
$migration$;
commit;
