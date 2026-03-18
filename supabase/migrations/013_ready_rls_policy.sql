-- Step 2: Update RLS policy to include 'ready' in public-readable statuses.
-- Split from 012 because Postgres can't use a new enum value in the same transaction.

DROP POLICY IF EXISTS "Public can read active drops" ON drops;
CREATE POLICY "Public can read active drops"
  ON drops FOR SELECT
  USING (status IN ('live', 'closed', 'baking', 'ready', 'completed'));
