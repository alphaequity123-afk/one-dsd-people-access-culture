-- Synthetic fixtures only, inside a disposable local standalone PostgreSQL cluster.
begin;
alter table pac_dsd.content_items disable trigger user;
alter table pac_dsd.content_revisions disable trigger user;
alter table pac_dsd.publication_decisions disable trigger user;
insert into pac_dsd.content_items(content_item_id,content_kind,default_scope_id,staff_label,restricted,created_by,sensitivity_class)
select id,'resource','dsd',id,id='restricted','synthetic','S1'
from unnest(array['approved','withdrawn','restricted','private','draft','no-model']) id;
insert into pac_dsd.content_revisions(revision_id,content_item_id,revision_number,canonical_payload,change_summary,created_by,sensitivity_class,ordinary_indexing_allowed,model_context_allowed)
select ('00000000-0000-4000-8000-' || lpad(row_number() over(order by id)::text,12,'0'))::uuid,id,1,'{"status":"approved"}'::jsonb,'synthetic','synthetic',case when id='private' then 'S2' else 'S1' end,true,id<>'no-model'
from unnest(array['approved','withdrawn','restricted','private','draft','no-model']) id;
insert into pac_dsd.publication_decisions(content_item_id,revision_id,scope_id,decision,gate_snapshot,decided_by,reason,sensitivity_class,unauthenticated_exposure_permitted,exposure_reason)
select content_item_id,revision_id,'dsd','publish','{}'::jsonb,'synthetic','fixture','S1',true,'synthetic public fixture'
from pac_dsd.content_revisions where content_item_id<>'draft';
insert into pac_dsd.publication_decisions(content_item_id,revision_id,scope_id,decision,gate_snapshot,decided_by,reason,sensitivity_class,unauthenticated_exposure_permitted,exposure_reason)
select content_item_id,revision_id,'dsd','withdraw','{}'::jsonb,'synthetic','fixture','S1',true,'synthetic public fixture'
from pac_dsd.content_revisions where content_item_id='withdrawn';
insert into pac_dsd.resource_media(content_item_id,kind,external_url,title,script)
select id,'audio','https://example.invalid/test.mp3','Synthetic recording',jsonb_build_array(jsonb_build_object('start',0,'end',1,'text',id || ' visible line one'), jsonb_build_object('start',1,'end',2,'text',id || ' visible line two'))
from unnest(array['approved','withdrawn','restricted','private','draft','no-model']) id;
insert into pac_dsd.resource_media(content_item_id,kind,external_url,title,script)
values ('approved','video','https://example.invalid/video.mp4','Synthetic video','[{"text":"video private sentinel"}]');
alter table pac_dsd.content_items enable trigger user;
alter table pac_dsd.content_revisions enable trigger user;
alter table pac_dsd.publication_decisions enable trigger user;
commit;
