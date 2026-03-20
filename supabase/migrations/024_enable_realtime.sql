-- Enable Supabase Realtime on drops and orders tables
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE drops;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
