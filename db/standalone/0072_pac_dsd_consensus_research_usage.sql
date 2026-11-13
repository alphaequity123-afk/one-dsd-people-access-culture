-- Extend only One DSD's existing research receipt and retention validators.
-- CREATE OR REPLACE via the catalog definition preserves owners and ACLs.
begin;

do $migration$
declare
  target regprocedure;
  definition text;
  previous text := $anchor$payload ->> 'provider' not in ('perplexity_agent', 'openai_web', 'fixture')$anchor$;
  replacement text := $anchor$payload ->> 'provider' not in ('perplexity_agent', 'openai_web', 'fixture', 'consensus')$anchor$;
  updated integer := 0;
begin
  -- Older installations can have the provider check in the current function.
  -- Newer installations retain it in the original, delegated validator.
  foreach target in array array_remove(array[
    to_regprocedure('pac_dsd.assert_runtime_work_object_contract(text,text,jsonb)'),
    to_regprocedure('pac_dsd.assert_runtime_work_object_contract_pre_program_v1(text,text,jsonb)')
  ], null) loop
    definition := pg_get_functiondef(target);
    if position(replacement in definition) > 0 then
      updated := updated + 1;
    elsif position(previous in definition) > 0 then
      execute replace(definition, previous, replacement);
      updated := updated + 1;
    end if;
  end loop;
  if updated <> 1 then
    raise exception 'Expected one One DSD research usage writer validator, found %', updated;
  end if;

  definition := pg_get_functiondef('pac_dsd.is_valid_research_usage_record(text,jsonb)'::regprocedure);
  replacement := $anchor$candidate ->> 'provider' in ('perplexity_agent', 'openai_web', 'fixture', 'consensus')$anchor$;
  if position(replacement in definition) = 0 then
    previous := $anchor$candidate ->> 'provider' in ('perplexity_agent', 'openai_web', 'fixture')$anchor$;
    if position(previous in definition) = 0 then
      previous := $anchor$candidate ->> 'provider' in ('perplexity_agent', 'fixture')$anchor$;
    end if;
    if position(previous in definition) = 0 then
      raise exception 'Expected the One DSD research usage retention validator';
    end if;
    execute replace(definition, previous, replacement);
  end if;
end;
$migration$;

do $verify$
declare
  receipt_id text := 'ru_20261113120000_abcdef_0123';
  receipt jsonb := jsonb_build_object(
    'id', receipt_id, 'at', '2026-11-13T12:00:00.000Z',
    'provider', 'consensus', 'model', 'msh_' || repeat('a', 64), 'depth', 'current_web',
    'query_hash', 'abcdef0123456789', 'domains', jsonb_build_array('doi.org'),
    'estimated_usd', 0, 'search_queries', 1, 'tool_calls', 1, 'ok', true,
    'latency_ms', 10, 'trace_id', '12345678-1234-4abc-8abc-123456789abc'
  );
begin
  perform pac_dsd.assert_runtime_work_object_contract('decision', 'research_usage:' || receipt_id, receipt);
  if not pac_dsd.is_valid_research_usage_record('research_usage:' || receipt_id, receipt) then
    raise exception 'Consensus receipt failed retention validation';
  end if;
  if pac_dsd.is_valid_research_usage_record('research_usage:' || receipt_id, receipt || '{"provider":"unknown"}'::jsonb) then
    raise exception 'Unregistered provider passed retention validation';
  end if;
  begin
    perform pac_dsd.assert_runtime_work_object_contract('decision', 'research_usage:' || receipt_id, receipt || '{"provider":"unknown"}'::jsonb);
    raise exception 'Unregistered provider passed write validation';
  exception when sqlstate '22023' then null;
  end;
end;
$verify$;

commit;
