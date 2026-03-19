-- Step 1: Add 'scheduled' status to drop lifecycle: draft → scheduled → live → ...
-- Scheduled = dates set, ready to go live (manually or at orders_open_at)
-- RLS policy update must be in a separate migration (can't use new enum value in same tx).

ALTER TYPE drop_status ADD VALUE 'scheduled' BEFORE 'live';
