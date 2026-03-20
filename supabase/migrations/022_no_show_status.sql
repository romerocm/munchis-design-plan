-- Add 'no_show' to the order_status enum for pickup tracking
ALTER TYPE order_status ADD VALUE 'no_show' AFTER 'cancelled';
