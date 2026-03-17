-- Extend order_status enum for pickup day and cancellation tracking
ALTER TYPE order_status ADD VALUE 'cancelled';
ALTER TYPE order_status ADD VALUE 'picked_up';
