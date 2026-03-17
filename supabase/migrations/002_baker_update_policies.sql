-- Allow updates on drops (baker admin via secret key)
-- The secret key bypasses RLS in theory, but the new key format
-- may not. Adding explicit policies as a safety net.

create policy "Service can update drops"
  on drops for update
  using (true)
  with check (true);

create policy "Service can update orders"
  on orders for update
  using (true)
  with check (true);

-- Also allow reading all drops (including draft) for admin
create policy "Service can read all drops"
  on drops for select
  using (true);
