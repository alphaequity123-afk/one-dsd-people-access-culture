-- Execute only after matching private Railway and Vault secrets are installed,
-- the updated application is live, and a manual invocation is verified.
-- Explicit names isolate these jobs from every existing project job.
select cron.schedule('one-dsd-consultation-retention-daily', '0 7 * * *',
  $job$select pac.dsd_dispatch_daily_retention();$job$);
select cron.schedule('one-dsd-retention-receipt-verifier', '*/5 * * * *',
  $job$select pac.dsd_verify_retention_responses();$job$);
