begin;
do $$ begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname='pac_owner_writer') then
    create role pac_owner_writer login noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
  end if;
end; $$;
grant usage on schema pac to pac_owner_writer;
alter table pac.page_text_overrides enable row level security;
create table if not exists pac.page_text_snapshots (
  snapshot_id bigint generated always as identity primary key,
  scope_id text not null check(scope_id in ('one-dhs','dsd')),
  route text not null,
  entries jsonb not null check(jsonb_typeof(entries)='array'),
  archived_at timestamptz not null default now()
);
alter table pac.page_text_snapshots enable row level security;
revoke all on pac.page_text_snapshots, pac.page_text_overrides from public, pac_app_runtime, pac_owner_writer;

create or replace function pac.save_page_text_overrides(requested_scope_id text, requested_route text, entries jsonb)
returns integer language plpgsql security definer set search_path=pg_catalog,pac set row_security=off as $$
declare saved integer;
begin
  if requested_scope_id not in ('one-dhs','dsd') or requested_route !~ '^/[A-Za-z0-9_./-]*$' or length(requested_route)>300 then
    raise exception 'Invalid page' using errcode='22023';
  end if;
  if jsonb_typeof(entries) <> 'array' or jsonb_array_length(entries)>2000 then raise exception 'Invalid entries' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(entries) e where
    not(e ? 'key' and e ? 'original' and e ? 'text') or jsonb_typeof(e->'key') <> 'string'
    or jsonb_typeof(e->'original') <> 'string' or jsonb_typeof(e->'text') <> 'string'
    or length(e->>'key') not between 1 and 200 or length(e->>'original')>20000
    or length(e->>'text')>20000 or length(btrim(e->>'text'))=0) then
    raise exception 'Invalid entry' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(requested_scope_id||':'||requested_route,0));
  insert into pac.page_text_snapshots(scope_id,route,entries)
  select requested_scope_id,requested_route,coalesce(jsonb_agg(jsonb_build_object('key',o.element_key,'original',o.original_text,'text',o.replacement_text,'updatedAt',o.updated_at,'updatedBy',o.updated_by)),'[]'::jsonb)
  from pac.page_text_overrides o where o.scope_id=requested_scope_id and o.route=requested_route;
  delete from pac.page_text_overrides o where o.scope_id=requested_scope_id and o.route=requested_route;
  insert into pac.page_text_overrides(scope_id,route,element_key,original_text,replacement_text)
  select requested_scope_id,requested_route,e->>'key',e->>'original',e->>'text' from jsonb_array_elements(entries) e where e->>'text' is distinct from e->>'original';
  get diagnostics saved=row_count;
  return saved;
end; $$;

create or replace function pac.read_page_text_history(requested_scope_id text,requested_route text)
returns table(element_key text,original_text text,replacement_text text,updated_at timestamptz,updated_by text,superseded_at timestamptz,superseded_by text)
language sql stable security definer set search_path=pg_catalog,pac set row_security=off as $$
  select e->>'key',e->>'original',e->>'text',(e->>'updatedAt')::timestamptz,e->>'updatedBy',s.archived_at,'consultant'::text
  from pac.page_text_snapshots s cross join lateral jsonb_array_elements(s.entries) e
  where s.scope_id=requested_scope_id and s.route=requested_route order by s.snapshot_id desc limit 200;
$$;

create or replace function pac.restore_page_text_route(requested_scope_id text,requested_route text)
returns integer language plpgsql security definer set search_path=pg_catalog,pac set row_security=off as $$
declare previous jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(requested_scope_id||':'||requested_route,0));
  select s.entries into previous from pac.page_text_snapshots s where s.scope_id=requested_scope_id and s.route=requested_route order by s.snapshot_id desc limit 1;
  if previous is null then return 0; end if;
  return pac.save_page_text_overrides(requested_scope_id,requested_route,previous);
end; $$;
revoke all on function pac.save_page_text_overrides(text,text,jsonb),pac.read_page_text_history(text,text),pac.restore_page_text_route(text,text) from public,pac_app_runtime;
grant execute on function pac.save_page_text_overrides(text,text,jsonb),pac.read_page_text_history(text,text),pac.restore_page_text_route(text,text) to pac_owner_writer;

-- Repair installations that previously gave media publication rights to runtime.
revoke all on function pac.save_media_file(text,text,bytea,text),pac.save_page_image_overrides(text,text,jsonb),pac.add_resource_media(text,text,uuid,text,text,text),pac.delete_resource_media(uuid),pac.create_resource_outright(text,jsonb),pac.set_resource_media_script(uuid,jsonb),pac.delete_content_item_outright(text,text),pac.restore_content_item(text) from public,pac_app_runtime;
grant execute on function pac.save_media_file(text,text,bytea,text),pac.save_page_image_overrides(text,text,jsonb),pac.add_resource_media(text,text,uuid,text,text,text),pac.delete_resource_media(uuid),pac.create_resource_outright(text,jsonb),pac.set_resource_media_script(uuid,jsonb),pac.delete_content_item_outright(text,text),pac.restore_content_item(text) to pac_owner_writer;
commit;
