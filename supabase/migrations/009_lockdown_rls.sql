-- ============================================================
-- SECURITY LOCKDOWN: Fix overly permissive RLS policies
-- Issues: 1.1 (orders readable by anon), 1.2 (drops/orders updatable by anon)
-- ============================================================

-- Drop the dangerous policies from migration 002
DROP POLICY IF EXISTS "Service can update drops" ON drops;
DROP POLICY IF EXISTS "Service can update orders" ON orders;
DROP POLICY IF EXISTS "Service can read all drops" ON drops;

-- Drop the overly permissive orders SELECT policy
DROP POLICY IF EXISTS "Public can read own order" ON orders;

-- Authenticated baker can do everything (dashboard uses service key,
-- but this covers browser-side Supabase client if needed)
CREATE POLICY "Authenticated can read all drops"
  ON drops FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update drops"
  ON drops FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read all orders"
  ON orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update orders"
  ON orders FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Storage: restrict uploads to authenticated users only
DROP POLICY IF EXISTS "Authenticated can upload drop images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update drop images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete drop images" ON storage.objects;

CREATE POLICY "Authenticated can upload drop images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drop-images');

CREATE POLICY "Authenticated can update drop images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'drop-images');

CREATE POLICY "Authenticated can delete drop images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'drop-images');
