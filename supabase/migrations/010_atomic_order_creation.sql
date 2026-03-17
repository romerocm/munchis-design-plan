-- Atomic order creation with capacity check.
-- Prevents race condition where two concurrent orders both pass the check.
-- Uses FOR UPDATE lock on the drop row.
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_drop_id uuid,
  p_customer_name text,
  p_customer_whatsapp text,
  p_customer_email text,
  p_quantity integer,
  p_total_cents integer,
  p_payment_expires_at timestamptz,
  p_wompi_payment_id text,
  p_wompi_payment_link text
) RETURNS uuid AS $$
DECLARE
  v_remaining integer;
  v_order_id uuid;
BEGIN
  -- Lock the drop row and calculate remaining capacity atomically
  SELECT capacity - COALESCE(
    (SELECT SUM(quantity) FROM orders
     WHERE drop_id = p_drop_id AND status IN ('pending', 'confirmed')),
    0
  ) INTO v_remaining
  FROM drops WHERE id = p_drop_id AND status = 'live'
  FOR UPDATE;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'Drop not found or not accepting orders';
  END IF;

  IF v_remaining < p_quantity THEN
    RAISE EXCEPTION 'Not enough capacity. % remaining.', v_remaining;
  END IF;

  INSERT INTO orders (
    drop_id, customer_name, customer_whatsapp, customer_email,
    quantity, total_cents, payment_expires_at, status,
    wompi_payment_id, wompi_payment_link
  ) VALUES (
    p_drop_id, p_customer_name, p_customer_whatsapp, p_customer_email,
    p_quantity, p_total_cents, p_payment_expires_at, 'pending',
    p_wompi_payment_id, p_wompi_payment_link
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
