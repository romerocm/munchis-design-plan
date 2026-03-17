-- Scheduling validation function
-- Prevents overlapping drops and validates date logic
CREATE OR REPLACE FUNCTION validate_drop_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Rule: orders_close_at must be after orders_open_at
  IF NEW.orders_close_at <= NEW.orders_open_at THEN
    RAISE EXCEPTION 'Orders close date must be after orders open date';
  END IF;

  -- Rule: pickup_date must be after orders_close_at
  IF NEW.pickup_date <= NEW.orders_close_at::date THEN
    RAISE EXCEPTION 'Pickup date must be after orders close date';
  END IF;

  -- Rule: No overlapping order windows with other non-draft drops
  -- (drafts can overlap since they haven't been committed yet)
  IF NEW.status != 'draft' THEN
    IF EXISTS (
      SELECT 1 FROM drops
      WHERE id != NEW.id
        AND status NOT IN ('draft', 'completed')
        AND (
          (NEW.orders_open_at, NEW.orders_close_at) OVERLAPS (orders_open_at, orders_close_at)
        )
    ) THEN
      RAISE EXCEPTION 'This drop overlaps with another active drop. Only one drop can be active at a time.';
    END IF;
  END IF;

  -- Rule: Only one drop can be "live" at a time
  IF NEW.status = 'live' THEN
    -- Auto-close any other live drops
    UPDATE drops
    SET status = 'closed', updated_at = now()
    WHERE id != NEW.id AND status = 'live';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger on insert and update
DROP TRIGGER IF EXISTS validate_drop_schedule_trigger ON drops;
CREATE TRIGGER validate_drop_schedule_trigger
  BEFORE INSERT OR UPDATE ON drops
  FOR EACH ROW
  EXECUTE FUNCTION validate_drop_schedule();
