-- Add fields for recipe seed system: slug (idempotent upsert), oven temp, and category

-- Slug for stable identity across seed imports
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Oven temperature (Celsius only; UI converts to F if needed)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS oven_temp_c smallint
  CHECK (oven_temp_c BETWEEN 50 AND 350);

-- Oven mode (conventional, convection, steam)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS oven_mode text NOT NULL DEFAULT 'conventional'
  CHECK (oven_mode IN ('conventional', 'convection', 'steam'));

-- Category for recipe organization
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category text;

-- Total rest/chill time (separate from active prep and bake)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rest_time_min integer;

-- Index on slug for fast upsert lookups
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes (slug) WHERE slug IS NOT NULL;
