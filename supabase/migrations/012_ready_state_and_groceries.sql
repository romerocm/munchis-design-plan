-- Step 1: Extend the drop_status enum and add groceries field.
-- The RLS policy update is in migration 013 because Postgres can't reference
-- a newly-added enum value within the same transaction.

ALTER TYPE drop_status ADD VALUE 'ready' BEFORE 'completed';
ALTER TABLE drops ADD COLUMN IF NOT EXISTS groceries_bought_at timestamptz;
