-- Administrative, sanitized verification only. No credentials or submitted text.
select jobname, schedule, active from cron.job
where jobname in ('one-dsd-consultation-retention-daily','one-dsd-retention-receipt-verifier') order by jobname;
select receipt_id,requested_at,completed_at,state,reason,http_status,due_before,due_after,redacted_count,exception_count
from pac.dsd_retention_job_receipts order by receipt_id desc limit 10;
select
  (select max(completed_at) from pac.dsd_retention_job_receipts where state='completed') as last_verified_cleanup,
  coalesce((select max(completed_at) from pac.dsd_retention_job_receipts where state='completed') < now()-interval '26 hours',true) as cleanup_overdue,
  (select count(*) from pac.dsd_retention_job_receipts where state='failed' and requested_at > now()-interval '26 hours') as recent_failed_runs,
  pac.dsd_retention_due_count(now()) as currently_due_payloads;
select p.proname,
  has_function_privilege('anon',p.oid,'EXECUTE') as anonymous_access,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as staff_access,
  has_function_privilege('pac_app_runtime',p.oid,'EXECUTE') as runtime_access,
  p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='pac' and p.proname in ('dsd_retention_due_count','dsd_dispatch_daily_retention','dsd_verify_retention_responses');
