-- Also generate shopping/baking snapshots when recipe_id is linked to an already-closed drop.
-- The original trigger only fires on status transition TO closed, but the baker may link
-- a recipe after the drop is already closed.
CREATE OR REPLACE FUNCTION generate_drop_recipe_snapshots()
RETURNS TRIGGER AS $$
DECLARE
  v_recipe recipes%ROWTYPE;
  v_scale numeric;
  v_confirmed_qty integer;
BEGIN
  -- Fire when: transitioning TO closed, OR recipe_id changes on a closed drop
  IF NEW.status = 'closed' AND (
    OLD.status != 'closed'                                   -- transitioning to closed
    OR (NEW.recipe_id IS DISTINCT FROM OLD.recipe_id)        -- recipe changed while closed
  ) THEN
    -- proceed
  ELSE
    RETURN NEW;
  END IF;

  -- Skip if no recipe linked
  IF NEW.recipe_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- If recipe changed, clear old snapshots first
  IF OLD.recipe_id IS DISTINCT FROM NEW.recipe_id THEN
    DELETE FROM drop_shopping_items WHERE drop_id = NEW.id;
    DELETE FROM drop_baking_steps WHERE drop_id = NEW.id;
  END IF;

  -- Skip if snapshots already exist (from a previous generation)
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
