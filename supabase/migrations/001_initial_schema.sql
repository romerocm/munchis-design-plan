-- Munchis MVP Schema
-- Single-flavor drop model, payment-first, weekly cycle

-- Drop statuses: draft > live > closed > baking > completed
create type drop_status as enum ('draft', 'live', 'closed', 'baking', 'completed');

-- Order statuses: pending (awaiting payment) > confirmed (paid) > expired (2hr window passed)
create type order_status as enum ('pending', 'confirmed', 'expired');

-- ============================================================
-- DROPS
-- One drop per week. One flavor per drop.
-- ============================================================
create table drops (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  status drop_status not null default 'draft',
  flavor_name text not null,
  flavor_description text,
  flavor_color text default '#5C3D2E',
  price_cents integer not null,
  capacity integer not null default 200,
  pickup_location text not null,
  pickup_date date not null,
  pickup_time_start time not null default '14:00',
  pickup_time_end time not null default '16:00',
  orders_open_at timestamptz not null,
  orders_close_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- Each order is for a single flavor (the drop's flavor).
-- Payment must be received within 2 hours or order expires.
-- ============================================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references drops(id),
  status order_status not null default 'pending',
  customer_name text not null,
  customer_whatsapp text not null,
  customer_email text,
  quantity integer not null check (quantity > 0 and quantity <= 12),
  total_cents integer not null,
  payment_expires_at timestamptz not null,
  paid_at timestamptz,
  picked_up_at timestamptz,
  wompi_payment_id text,
  wompi_payment_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFY LIST
-- People who want to know when the next drop goes live.
-- ============================================================
create table notify_list (
  id uuid primary key default gen_random_uuid(),
  whatsapp text not null,
  drop_id uuid references drops(id),
  created_at timestamptz not null default now(),
  unique(whatsapp, drop_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_orders_drop_id on orders(drop_id);
create index idx_orders_status on orders(status);
create index idx_orders_payment_expires on orders(payment_expires_at) where status = 'pending';
create index idx_drops_status on drops(status);
create index idx_notify_list_drop on notify_list(drop_id);

-- ============================================================
-- VIEWS
-- Live drop stats for baker dashboard
-- ============================================================
create view drop_stats as
select
  d.id as drop_id,
  d.number as drop_number,
  d.flavor_name,
  d.capacity,
  d.status,
  count(o.id) filter (where o.status = 'confirmed') as confirmed_orders,
  coalesce(sum(o.quantity) filter (where o.status = 'confirmed'), 0) as confirmed_quantity,
  coalesce(sum(o.total_cents) filter (where o.status = 'confirmed'), 0) as confirmed_revenue_cents,
  count(o.id) filter (where o.status = 'pending') as pending_orders,
  coalesce(sum(o.quantity) filter (where o.status = 'pending'), 0) as pending_quantity
from drops d
left join orders o on o.drop_id = d.id
group by d.id;

-- ============================================================
-- RLS POLICIES
-- Public can: read live drops, create orders, join notify list
-- Baker (authenticated via secret key): full access
-- ============================================================
alter table drops enable row level security;
alter table orders enable row level security;
alter table notify_list enable row level security;

-- Drops: anyone can read live/closed/completed drops
create policy "Public can read active drops"
  on drops for select
  using (status in ('live', 'closed', 'baking', 'completed'));

-- Orders: public can insert (place orders)
create policy "Public can create orders"
  on orders for insert
  with check (true);

-- Orders: public can read their own order by ID (for status page)
create policy "Public can read own order"
  on orders for select
  using (true);

-- Notify list: public can insert
create policy "Public can join notify list"
  on notify_list for insert
  with check (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-expire pending orders past their payment window
create or replace function expire_stale_orders()
returns integer as $$
declare
  expired_count integer;
begin
  update orders
  set status = 'expired', updated_at = now()
  where status = 'pending'
    and payment_expires_at < now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$ language plpgsql security definer;

-- Get remaining capacity for a drop
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
      and status in ('pending', 'confirmed');
  return greatest(total_cap - used, 0);
end;
$$ language plpgsql security definer;

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger drops_updated_at
  before update on drops
  for each row execute function update_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();
