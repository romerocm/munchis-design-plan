-- Step 2: Update RLS policy to include 'scheduled' in public-readable statuses.
-- Split from 019 because Postgres can't use a new enum value in the same transaction.

DROP POLICY IF EXISTS "Public can read active drops" ON drops;
CREATE POLICY "Public can read active drops"
  ON drops FOR SELECT
  USING (status IN ('scheduled', 'live', 'closed', 'baking', 'ready', 'completed'));
