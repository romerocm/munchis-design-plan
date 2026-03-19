-- Add emoji column for recipe cards when no photo is uploaded
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS emoji text DEFAULT '📝';
