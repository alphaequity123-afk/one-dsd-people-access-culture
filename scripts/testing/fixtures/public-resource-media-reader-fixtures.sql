-- Only synthetic data in the isolated local cluster created for this audit.
alter table pac_dsd.publication_decisions disable trigger user;
insert into pac_dsd.publication_decisions(content_item_id,revision_id,scope_id,decision,gate_snapshot,decided_by,reason,sensitivity_class,unauthenticated_exposure_permitted,exposure_reason)
select content_item_id,revision_id,'dsd','publish','{}'::jsonb,'synthetic','fixture','S1',true,'synthetic public fixture'
from pac_dsd.content_revisions where content_item_id='approved';
alter table pac_dsd.publication_decisions enable trigger user;
update pac_dsd.resource_media set script = (
  select jsonb_agg(jsonb_build_object('start', n, 'end', n + 1, 'text', 'synthetic public line ' || n) order by n)
  from generate_series(1, 301) n
) where content_item_id='approved' and kind='audio';
