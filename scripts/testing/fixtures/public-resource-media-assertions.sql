-- Assertions run only against the disposable local fixture cluster.
set role pac_dsd_app_runtime;
do $$
declare n integer; first_row record; second_row record;
begin
  select count(*) into n from pac_dsd.read_published_media_script_lines('dsd', array['approved','withdrawn','restricted','private','draft','no-model'], '', '00000000-0000-0000-0000-000000000000'::uuid, 0, 250);
  if n <> 2 then raise exception 'public, private, withdrawn or model-context gating failed: %',n; end if;
  select count(*) into n from pac_dsd.read_published_media_script_lines('one-dhs', array['approved'], '', '00000000-0000-0000-0000-000000000000'::uuid, 0, 250);
  if n <> 0 then raise exception 'division-scoped media escaped into agency scope'; end if;
  select * into first_row from pac_dsd.read_published_media_script_lines('dsd', array['approved'], '', '00000000-0000-0000-0000-000000000000'::uuid, 0, 1);
  select * into second_row from pac_dsd.read_published_media_script_lines('dsd', array['approved'], first_row.content_item_id, first_row.resource_media_id, first_row.line_number, 1);
  if first_row.line_number<>1 or second_row.line_number<>2 or second_row.line_text <> 'approved visible line two' then raise exception 'pagination failed'; end if;
  if has_table_privilege(current_user, 'pac_dsd.resource_media', 'select') then raise exception 'runtime gained direct table access'; end if;
  if has_function_privilege('public','pac_dsd.read_published_media_script_lines(text,text[],text,uuid,bigint,integer)','execute') then raise exception 'public gained function access'; end if;
  begin
    perform * from pac_dsd.read_published_media_script_lines('dsd', array['approved'], '', '00000000-0000-0000-0000-000000000000'::uuid, 0, 251);
    raise exception 'unbounded page size accepted';
  exception when invalid_parameter_value then null; end;
end $$;
reset role;
alter table pac_dsd.publication_decisions disable trigger user;
insert into pac_dsd.publication_decisions(content_item_id,revision_id,scope_id,decision,gate_snapshot,decided_by,reason,sensitivity_class,unauthenticated_exposure_permitted,exposure_reason)
select content_item_id,revision_id,'dsd','withdraw','{}'::jsonb,'synthetic','fixture','S1',true,'synthetic public fixture'
from pac_dsd.content_revisions where content_item_id='approved';
alter table pac_dsd.publication_decisions enable trigger user;
set role pac_dsd_app_runtime;
do $$
begin
  if exists(select 1 from pac_dsd.read_published_media_script_lines('dsd', array['approved'], '', '00000000-0000-0000-0000-000000000000'::uuid, 0, 250)) then
    raise exception 'withdrawal remained visible';
  end if;
end $$;
reset role;
