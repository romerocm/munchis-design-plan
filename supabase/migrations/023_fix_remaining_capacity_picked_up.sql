-- Fix: include picked_up orders in capacity count
-- Previously only counted 'pending' and 'confirmed', so once orders were
-- marked as picked_up the customer-facing page showed "0 orders this drop"
create or replace function get_drop_remaining_capacity(p_drop_id uuid)
returns integer as $$
declare
  total_cap integer;
  used integer;
begin
  select capacity into total_cap from drops where id = p_drop_id;
  select coalesce(sum(quantity), 0) into used
    from orders
    where drop_id = p_drop_id
      and status in ('pending', 'confirmed', 'picked_up');
  return greatest(total_cap - used, 0);
end;
$$ language plpgsql security definer;
