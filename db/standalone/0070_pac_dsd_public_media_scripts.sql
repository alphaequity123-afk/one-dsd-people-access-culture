-- Standalone forward migration. Review and test locally before any controlled
-- production application; never replay the legacy shared-schema migrations.
begin;
create or replace function pac_dsd.read_published_media_script_lines(
  requested_scope text, requested_ids text[], after_item text,
  after_media uuid, after_line bigint, page_size integer
)
returns table(content_item_id text, revision_id uuid, publication_hash text, publication_scope text,
              resource_media_id uuid, media_title text, line_number bigint, line_text text)
language plpgsql stable security definer
set search_path = pg_catalog, pac_dsd
set row_security = off
as $$
begin
  if requested_scope not in ('one-dhs','dsd') or requested_ids is null
     or cardinality(requested_ids) > 5000 or after_item is null or length(after_item) > 200
     or after_media is null or after_line is null or after_line < 0
     or page_size is null or page_size < 1 or page_size > 250 then
    raise exception 'Invalid public media request' using errcode = '22023';
  end if;
  return query
    with published as materialized (
      select p.content_item_id, p.revision_id, p.payload_sha256, p.scope_id
      from pac_dsd.read_staff_publications(requested_scope, null) p
      join pac_dsd.content_revisions rev on rev.revision_id = p.revision_id and rev.model_context_allowed = true
      where p.content_item_id = any(requested_ids)
    )
    select p.content_item_id, p.revision_id, p.payload_sha256, p.scope_id,
           r.resource_media_id, r.title, part.ordinality, part.item ->> 'text'
    from published p
    join pac_dsd.resource_media r on r.content_item_id = p.content_item_id and r.kind = 'audio'
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(r.script) = 'array' then r.script else '[]'::jsonb end
    ) with ordinality as part(item, ordinality)
    where jsonb_typeof(part.item) = 'object'
      and jsonb_typeof(part.item -> 'text') = 'string'
      and length(part.item ->> 'text') between 1 and 2000
      and (p.content_item_id, r.resource_media_id, part.ordinality) > (after_item, after_media, after_line)
    order by p.content_item_id, r.resource_media_id, part.ordinality
    limit page_size;
end;
$$;
revoke all on function pac_dsd.read_published_media_script_lines(text,text[],text,uuid,bigint,integer) from public;
grant execute on function pac_dsd.read_published_media_script_lines(text,text[],text,uuid,bigint,integer) to pac_dsd_app_runtime;
commit;
