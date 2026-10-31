-- Temporary, exact-payload installation adapter for the separate One DSD database.
-- Not a runtime feature or an arbitrary SQL executor. Remove after verified seeding.
-- Only the SHA-256-pinned owner-approved payloads below can pass this boundary.
-- Public, anon, authenticated, and ordinary table privileges remain revoked.
begin;
create or replace function pac.install_one_dsd_reviewed_baseline(item_kind text, serialized_payload text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pac set row_security=off as $installer$
declare
  approved_manifest constant jsonb := $manifest$__APPROVED_MANIFEST_JSON__$manifest$::jsonb;
  payload jsonb;
  item_id text;
  allowed_hash text;
  existing_payload jsonb;
  source_id text;
  revision_id uuid;
  decision_id bigint;
  scope_id text;
  document jsonb;
  state jsonb;
  definition pac.surface_definitions%rowtype;
  protected text[];
  dimensions text[];
begin
  if session_user <> 'pac_app_runtime' and session_user <> 'postgres' then
    raise exception 'Installation role is not permitted' using errcode='42501';
  end if;
  if clock_timestamp() >= timestamptz '2026-10-08 00:00:00+00' then
    raise exception 'This bounded setup adapter has expired' using errcode='42501';
  end if;
  if item_kind not in ('resource','surface') or serialized_payload is null
    or octet_length(serialized_payload)>2000000 then
    raise exception 'Invalid installation payload' using errcode='22023';
  end if;
  payload := serialized_payload::jsonb;
  item_id := case when item_kind='resource' then payload->>'id' else payload->>'surfaceId' end;
  allowed_hash := approved_manifest->>(item_kind||':'||item_id);
  if allowed_hash is null or allowed_hash <> encode(sha256(convert_to(serialized_payload,'UTF8')),'hex') then
    raise exception 'Payload is not the exact approved application source' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('one-dsd-reviewed-baseline:'||item_kind||':'||item_id,0));
  if item_kind='resource' then
    select r.canonical_payload into existing_payload from pac.content_revisions r
      where r.content_item_id=item_id and r.revision_number=1;
    if found then
      if existing_payload is distinct from payload then
        raise exception 'Existing resource baseline differs: %',item_id using errcode='55000';
      end if;
      -- Preserve all later edits, retirement, withdrawal, and publication decisions.
      return jsonb_build_object('kind',item_kind,'id',item_id,'status','preserved');
    end if;
    if exists(select 1 from pac.content_items i where i.content_item_id=item_id) then
      raise exception 'Unrecognized existing resource: %',item_id using errcode='55000';
    end if;
    scope_id := pac.resource_scope_id(payload);
    source_id := 'one-dsd-reviewed-source:'||item_id;
    insert into pac.content_items(content_item_id,content_kind,default_scope_id,staff_label,restricted,created_by,sensitivity_class)
      values(item_id,'resource',scope_id,left(payload->>'title',300),false,'one-dsd-reviewed-source-import','S0');
    insert into pac.source_items(source_item_id,source_business_id,source_version,title,normalized_payload,
      normalized_item_sha256,hash_algorithm,hash_algorithm_version,owner_approval_status,accounting_status,
      access_scope,sensitivity_class,deidentification_status,ordinary_indexing_allowed,model_context_allowed)
      values(source_id,source_id,'1',left(payload->>'title',300),payload,
      encode(sha256(convert_to(payload::text,'UTF8')),'hex'),'sha256','1','owner_approved_for_ingestion','accounted',
      'consultant','S0','not_needed',true,true);
    insert into pac.content_revisions(content_item_id,revision_number,canonical_payload,change_summary,
      required_review_dimensions,created_by,sensitivity_class,ordinary_indexing_allowed,model_context_allowed)
      values(item_id,1,payload,'Exact reviewed One DSD resource imported for owner editing.',
      '{}'::text[],'one-dsd-reviewed-source-import','S0',true,true) returning content_revisions.revision_id into revision_id;
    insert into pac.revision_sources(revision_id,source_item_id,relationship,note)
      values(revision_id,source_id,'primary','Exact reviewed application resource; original source and attribution preserved in payload.');
    insert into pac.publication_decisions(content_item_id,revision_id,scope_id,decision,gate_snapshot,decided_by,reason,
      sensitivity_class,unauthenticated_exposure_permitted,exposure_reason)
      values(item_id,revision_id,scope_id,'publish',jsonb_build_object('approvalBasis','owner_approved_existing_application',
      'staff_release_explicit',true,'independentFactualReviewPerformed',false,'independentAccessibilityAuditPerformed',false),
      'one-dsd-reviewed-source-import','Exact reviewed resource imported for persistent owner editing.',
      'S0',true,'Existing approved staff resource; unchanged content.') returning publication_decision_id into decision_id;
    insert into pac.change_events(actor_id,actor_role,scope_id,object_type,object_id,action,detail)
      values('one-dsd-reviewed-source-import','migration',scope_id,'content_item',item_id,'resource_created',
      jsonb_build_object('revision_id',revision_id,'publication_decision_id',decision_id,'exactSourcePreserved',true));
    select p.canonical_payload into existing_payload from pac.read_staff_publications('dsd',item_id) p;
    if existing_payload is distinct from payload then
      raise exception 'Resource publication parity failed: %',item_id using errcode='55000';
    end if;
    return jsonb_build_object('kind',item_kind,'id',item_id,'status','created');
  end if;

  if payload->>'scopePolicy' not in ('inheritable','dsd') then
    raise exception 'This installation excludes agency-only page areas' using errcode='42501';
  end if;
  document:=jsonb_build_object('schemaVersion',1,'surfaceId',item_id,'scope','dsd','values',payload->'approvedValues');
  -- A previous exact installation is idempotent, even after later owner edits.
  select r.document into existing_payload from pac.surface_revisions r
    where r.surface_id=item_id and r.scope_id='dsd'
      and r.change_note='Exact current application wording imported for One DSD editing.'
    order by r.revision_number limit 1;
  if found then
    if existing_payload is distinct from document then
      raise exception 'Previously imported surface baseline differs: %',item_id using errcode='55000';
    end if;
    return jsonb_build_object('kind',item_kind,'id',item_id,'status','preserved');
  end if;
  -- Never overwrite an existing owner edit, hidden surface, or retired definition.
  if exists(select 1 from pac.surface_revisions r where r.surface_id=item_id
    and r.created_by not like 'pac-forward-migration-%') then
    raise exception 'Existing owner wording needs manual reconciliation: %',item_id using errcode='55000';
  end if;
  if exists(select 1 from pac.surface_publication_decisions d where d.surface_id=item_id
    and d.decision='withdraw') then
    raise exception 'Withdrawn area must not be resurrected: %',item_id using errcode='55000';
  end if;
  select * into definition from pac.surface_definitions s where s.surface_id=item_id;
  if found and (not definition.active or definition.scope_policy is distinct from payload->>'scopePolicy') then
    raise exception 'Existing area scope/availability differs: %',item_id using errcode='55000';
  end if;
  protected:=array(select jsonb_array_elements_text(coalesce(payload->'protectedFields','[]'::jsonb)));
  dimensions:=array(select jsonb_array_elements_text(payload->'requiredReviewDimensions'));
  insert into pac.surface_definitions(surface_id,route_pattern,staff_label,scope_policy,schema_version,
    field_contract,protected_fields,required_review_dimensions,linked_content_item_id,active,registered_by)
    values(item_id,payload->>'routePattern',payload->>'staffLabel',payload->>'scopePolicy',1,
      payload->'fieldContract',protected,dimensions,null,true,'one-dsd-reviewed-source-import')
    on conflict(surface_id) do update set route_pattern=excluded.route_pattern,staff_label=excluded.staff_label,
      field_contract=excluded.field_contract,protected_fields=excluded.protected_fields,
      required_review_dimensions=excluded.required_review_dimensions;
  state:=pac.read_surface_editing_state('dsd',item_id);
  perform pac.save_owner_approved_surface('dsd',item_id,
    nullif(state->>'expectedRevisionId','')::uuid,
    nullif(state#>>'{latestDecision,publicationDecisionId}','')::bigint,
    document,'Exact current application wording imported for One DSD editing.');
  select p.document into existing_payload from pac.read_surface_publication('dsd',item_id) p;
  if existing_payload is distinct from document then
    raise exception 'Surface publication parity failed: %',item_id using errcode='55000';
  end if;
  return jsonb_build_object('kind',item_kind,'id',item_id,'status','created');
end;
$installer$;
revoke all on function pac.install_one_dsd_reviewed_baseline(text,text) from public,anon,authenticated;
grant execute on function pac.install_one_dsd_reviewed_baseline(text,text) to pac_app_runtime;
comment on function pac.install_one_dsd_reviewed_baseline(text,text) is
  'Temporary exact-source install only; hash allowlist, no SQL execution, expires October 8, remove after setup.';
commit;
