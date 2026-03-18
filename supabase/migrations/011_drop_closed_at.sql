-- Track the actual moment orders were closed (early closure, sold out, or on schedule).
-- Cleared when a drop is reopened back to 'live'.

alter table drops add column closed_at timestamptz;

-- Auto-set closed_at when status transitions to 'closed'; clear it on reopen to 'live'.
create or replace function set_closed_at()
returns trigger as $$
begin
  if new.status = 'closed' and (old.status is distinct from 'closed') then
    new.closed_at = now();
  elsif new.status = 'live' and old.status = 'closed' then
    new.closed_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_closed_at
  before update on drops
  for each row
  execute function set_closed_at();

-- Backfill: for any currently closed/baking/completed drops without closed_at,
-- use updated_at as a best-guess.
update drops
  set closed_at = updated_at
  where status in ('closed', 'baking', 'completed')
    and closed_at is null;
