-- Enable pg_cron extension (available on Supabase paid plans)
-- If on free plan, this will fail silently and we fall back to
-- lazy expiration in the API routes.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Run expire_stale_orders every 5 minutes
SELECT cron.schedule(
  'expire-stale-orders',
  '*/5 * * * *',
  'SELECT expire_stale_orders()'
);
