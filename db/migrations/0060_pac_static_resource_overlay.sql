begin;
-- An absent publication must not resurrect a withdrawn or retired bundled resource.
create or replace function pac.read_static_resource_overlay(requested_scope_id text)
returns table(content_item_id text, revision_id uuid, scope_id text, canonical_payload jsonb, payload_sha256 text, decided_at timestamptz)
language plpgsql stable security definer
set search_path = pg_catalog, pac
set row_security = off
as $$
begin
  if requested_scope_id not in ('one-dhs', 'dsd') then
    raise exception 'Unknown program scope' using errcode = '22023';
  end if;
  return query
  select item.content_item_id, published.revision_id, published.scope_id,
         published.canonical_payload, published.payload_sha256, published.decided_at
  from pac.content_items item
  left join pac.read_staff_publications(requested_scope_id, null) published
    on published.content_item_id = item.content_item_id
  where item.content_kind = 'resource'
    and (item.default_scope_id = 'one-dhs' or (requested_scope_id = 'dsd' and item.default_scope_id = 'dsd'));
end;
$$;
revoke all on function pac.read_static_resource_overlay(text) from public;
grant execute on function pac.read_static_resource_overlay(text) to pac_app_runtime;
commit;
