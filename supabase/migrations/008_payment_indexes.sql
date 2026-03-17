-- Index for webhook payment link lookups (prevents sequential scan)
CREATE INDEX IF NOT EXISTS idx_orders_wompi_payment_id
  ON orders(wompi_payment_id)
  WHERE wompi_payment_id IS NOT NULL;
