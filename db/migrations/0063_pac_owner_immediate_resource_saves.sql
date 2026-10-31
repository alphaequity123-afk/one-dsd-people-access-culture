-- Explicit consultant direction: authenticated resource saves publish immediately.
-- Preserve originals and immutable history; record approval without inventing reviews.
begin;
create or replace function pac.save_owner_approved_resource(
  requested_scope_id text, requested_content_item_id text,
  expected_base_revision_id uuid, expected_published_revision_id uuid,
  requested_editable_fields jsonb, requested_change_note text default null
)
returns table(content_item_id text,published_revision_id uuid,base_revision_id uuid,
  editable_fields jsonb,has_unpublished_changes boolean)
language plpgsql security definer set search_path=pg_catalog,pac set row_security=off as $$
declare
  previous pac.content_revisions%rowtype;
  published_trust pac.content_revisions%rowtype;
  published record;
  editing_state record;
  next_payload jsonb;
  next_id uuid;
  next_number integer;
  decision_id bigint;
  note text;
begin
  if requested_scope_id not in ('one-dhs','dsd') or expected_published_revision_id is null then
    raise exception 'Exact publication scope and revision are required' using errcode='22023';
  end if;
  perform pac.assert_valid_resource_edit_fields(requested_editable_fields);
  note:=coalesce(nullif(btrim(requested_change_note),''),'Resource wording saved by the program owner.');
  if length(note)>500 then raise exception 'Change note is too long' using errcode='22023'; end if;
  perform pac.assert_plain_resource_text(note);
  perform 1 from pac.content_items i where i.content_item_id=requested_content_item_id
    and i.content_kind='resource' and not i.restricted and i.retired_at is null for update;
  if not found then raise exception 'Resource is not available' using errcode='P0002'; end if;
  select * into published from pac.read_staff_publications(requested_scope_id,requested_content_item_id);
  if not found then raise exception 'Resource is not published in this view' using errcode='P0002'; end if;
  select r.* into published_trust from pac.content_revisions r where r.revision_id=published.revision_id;
  select * into editing_state from pac.read_resource_editing_state(requested_scope_id,requested_content_item_id);
  select r.* into previous from pac.content_revisions r where r.revision_id=editing_state.base_revision_id;
  if previous.revision_id is distinct from expected_base_revision_id
    or published.revision_id is distinct from expected_published_revision_id then
    raise exception 'Resource wording or publication changed' using errcode='40001';
  end if;
  select coalesce(max(r.revision_number),0)+1 into next_number from pac.content_revisions r
    where r.content_item_id=requested_content_item_id;
  next_payload:=jsonb_strip_nulls(previous.canonical_payload||requested_editable_fields
    ||jsonb_build_object('id',requested_content_item_id,'status','approved','accessibility','reviewed',
      'scope',case when requested_scope_id='dsd' then 'dsd' else 'agencywide' end,
      'version','owner-'||next_number));
  perform pac.assert_exact_resource_scope(requested_scope_id,next_payload);
  insert into pac.content_revisions(content_item_id,revision_number,canonical_payload,change_summary,
    required_review_dimensions,created_by,based_on_revision_id,sensitivity_class,
    ordinary_indexing_allowed,model_context_allowed,limitations)
    values(requested_content_item_id,next_number,next_payload,note,'{}'::text[],
      'pac-consultant-workspace-owner',previous.revision_id,published_trust.sensitivity_class,
      published_trust.ordinary_indexing_allowed,published_trust.model_context_allowed,previous.limitations)
    returning content_revisions.revision_id into next_id;
  insert into pac.revision_sources(revision_id,source_item_id,relationship,note)
    select next_id,s.source_item_id,s.relationship,s.note from pac.revision_sources s where s.revision_id=previous.revision_id;
  insert into pac.revision_assets(revision_id,asset_id,purpose,staff_label,sort_order)
    select next_id,a.asset_id,a.purpose,a.staff_label,a.sort_order from pac.revision_assets a where a.revision_id=previous.revision_id;
  perform pac.assert_resource_staff_release(next_id);
  insert into pac.publication_decisions(content_item_id,revision_id,scope_id,decision,gate_snapshot,
    decided_by,reason,sensitivity_class,unauthenticated_exposure_permitted,exposure_reason)
    values(requested_content_item_id,next_id,requested_scope_id,'publish',
      jsonb_build_object('approvalBasis','standing_owner_approval_on_input','explicitOwnerDecision',true,
        'ownerApprovedCopy',true,'automaticValidationCompleted',true,'independentFactualReviewPerformed',false,
        'independentAccessibilityAuditPerformed',false,'staff_release_explicit',true,
        'basedOnRevisionId',previous.revision_id,'replacedPublishedRevisionId',published.revision_id),
      'pac-consultant-workspace-owner','Resource saved with the consultant''s standing publication approval.',
      published_trust.sensitivity_class,true,'Owner-approved change to an existing staff resource.')
    returning publication_decision_id into decision_id;
  insert into pac.change_events(actor_id,actor_role,scope_id,object_type,object_id,action,detail)
    values('pac-consultant-workspace-owner','owner',requested_scope_id,'content_item',requested_content_item_id,
      'published',jsonb_build_object('revision_id',next_id,'publication_decision_id',decision_id,
        'approvalBasis','standing_owner_approval_on_input','automaticValidationCompleted',true,
        'independentFactualReviewPerformed',false,'independentAccessibilityAuditPerformed',false));
  return query select * from pac.read_resource_editing_state(requested_scope_id,requested_content_item_id);
end;
$$;
revoke all on function pac.save_owner_approved_resource(text,text,uuid,uuid,jsonb,text) from public;
revoke all on function pac.save_owner_approved_resource(text,text,uuid,uuid,jsonb,text) from pac_app_runtime;
grant execute on function pac.save_owner_approved_resource(text,text,uuid,uuid,jsonb,text) to pac_owner_writer;
comment on function pac.save_owner_approved_resource(text,text,uuid,uuid,jsonb,text) is
  'Authenticated consultant API only: exact scoped CAS save/publication under standing owner approval, with truthful immutable provenance.';
commit;
