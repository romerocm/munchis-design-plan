-- Recipe Lab: recipes, ingredients, steps, and drop-linked snapshots

-- Enums
CREATE TYPE recipe_status AS ENUM ('idea', 'draft', 'testing', 'active', 'archived');
CREATE TYPE ingredient_unit AS ENUM ('g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'unit', 'pinch');
CREATE TYPE baking_step_status AS ENUM ('pending', 'active', 'completed', 'skipped');

-- Recipes
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status recipe_status NOT NULL DEFAULT 'idea',
  name text NOT NULL,
  description text,
  image_url text,
  base_yield integer NOT NULL DEFAULT 1,
  yield_unit text NOT NULL DEFAULT 'batch',
  prep_time_min integer,
  bake_time_min integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recipe ingredients
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL,
  unit ingredient_unit NOT NULL DEFAULT 'unit',
  sort_order integer NOT NULL DEFAULT 0,
  category text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recipe steps
CREATE TABLE recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text,
  duration_min integer,
  is_timer_step boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Link drops to recipes
ALTER TABLE drops ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL;

-- Snapshot: shopping items generated when drop transitions to closed
CREATE TABLE drop_shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id uuid NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  ingredient_category text,
  base_quantity numeric NOT NULL,
  scaled_quantity numeric NOT NULL,
  unit ingredient_unit NOT NULL DEFAULT 'unit',
  checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Snapshot: baking steps generated when drop transitions to closed
CREATE TABLE drop_baking_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id uuid NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text,
  duration_min integer,
  is_timer_step boolean NOT NULL DEFAULT false,
  status baking_step_status NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id);
CREATE INDEX idx_drops_recipe ON drops(recipe_id);
CREATE INDEX idx_drop_shopping_items_drop ON drop_shopping_items(drop_id);
CREATE INDEX idx_drop_baking_steps_drop ON drop_baking_steps(drop_id);

-- Auto-update updated_at on recipes
CREATE TRIGGER set_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Generate shopping + baking snapshots when drop moves to "closed"
-- Only generates if drop has a recipe_id and snapshots don't already exist
CREATE OR REPLACE FUNCTION generate_drop_recipe_snapshots()
RETURNS TRIGGER AS $$
DECLARE
  v_recipe recipes%ROWTYPE;
  v_scale numeric;
  v_confirmed_qty integer;
BEGIN
  -- Only fire when transitioning TO closed
  IF NEW.status != 'closed' OR OLD.status = 'closed' THEN
    RETURN NEW;
  END IF;

  -- Skip if no recipe linked
  IF NEW.recipe_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if snapshots already exist
  IF EXISTS (SELECT 1 FROM drop_shopping_items WHERE drop_id = NEW.id LIMIT 1) THEN
    RETURN NEW;
  END IF;

  -- Get recipe
  SELECT * INTO v_recipe FROM recipes WHERE id = NEW.recipe_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get confirmed quantity for scaling
  SELECT COALESCE(SUM(quantity), 0) INTO v_confirmed_qty
  FROM orders
  WHERE drop_id = NEW.id AND status = 'confirmed';

  -- Scale factor: confirmed_quantity / base_yield (minimum 1)
  v_scale := GREATEST(v_confirmed_qty::numeric / GREATEST(v_recipe.base_yield, 1)::numeric, 1);

  -- Generate shopping items
  INSERT INTO drop_shopping_items (drop_id, ingredient_name, ingredient_category, base_quantity, scaled_quantity, unit, sort_order)
  SELECT NEW.id, ri.name, ri.category, ri.quantity, ROUND(ri.quantity * v_scale, 2), ri.unit, ri.sort_order
  FROM recipe_ingredients ri
  WHERE ri.recipe_id = NEW.recipe_id
  ORDER BY ri.sort_order;

  -- Generate baking steps
  INSERT INTO drop_baking_steps (drop_id, step_number, title, description, duration_min, is_timer_step)
  SELECT NEW.id, rs.step_number, rs.title, rs.description, rs.duration_min, rs.is_timer_step
  FROM recipe_steps rs
  WHERE rs.recipe_id = NEW.recipe_id
  ORDER BY rs.step_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_drop_recipe_snapshots
  AFTER UPDATE ON drops
  FOR EACH ROW
  EXECUTE FUNCTION generate_drop_recipe_snapshots();

-- RLS: baker-only (all new tables deny public access)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_baking_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny public access" ON recipes USING (false);
CREATE POLICY "Deny public access" ON recipe_ingredients USING (false);
CREATE POLICY "Deny public access" ON recipe_steps USING (false);
CREATE POLICY "Deny public access" ON drop_shopping_items USING (false);
CREATE POLICY "Deny public access" ON drop_baking_steps USING (false);

-- Update drop_stats view to include recipe info and snapshot progress
DROP VIEW IF EXISTS drop_stats;
CREATE VIEW drop_stats AS
SELECT
  d.id AS drop_id,
  d.number AS drop_number,
  d.flavor_name,
  d.capacity,
  d.status,
  d.recipe_id,
  r.name AS recipe_name,
  COALESCE(os.confirmed_orders, 0) AS confirmed_orders,
  COALESCE(os.confirmed_quantity, 0) AS confirmed_quantity,
  COALESCE(os.confirmed_revenue_cents, 0) AS confirmed_revenue_cents,
  COALESCE(os.pending_orders, 0) AS pending_orders,
  COALESCE(os.pending_quantity, 0) AS pending_quantity,
  COALESCE(si.shopping_checked, 0) AS shopping_checked,
  COALESCE(si.shopping_total, 0) AS shopping_total,
  COALESCE(bs.baking_done, 0) AS baking_done,
  COALESCE(bs.baking_total, 0) AS baking_total
FROM drops d
LEFT JOIN recipes r ON r.id = d.recipe_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE o.status = 'confirmed') AS confirmed_orders,
    COALESCE(SUM(o.quantity) FILTER (WHERE o.status = 'confirmed'), 0) AS confirmed_quantity,
    COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'confirmed'), 0) AS confirmed_revenue_cents,
    COUNT(*) FILTER (WHERE o.status = 'pending') AS pending_orders,
    COALESCE(SUM(o.quantity) FILTER (WHERE o.status = 'pending'), 0) AS pending_quantity
  FROM orders o WHERE o.drop_id = d.id
) os ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE dsi.checked) AS shopping_checked,
    COUNT(*) AS shopping_total
  FROM drop_shopping_items dsi WHERE dsi.drop_id = d.id
) si ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE dbs.status IN ('completed', 'skipped')) AS baking_done,
    COUNT(*) AS baking_total
  FROM drop_baking_steps dbs WHERE dbs.drop_id = d.id
) bs ON true;
