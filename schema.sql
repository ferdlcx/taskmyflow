-- ============================================================
-- PortoTrack Schema (Supabase / Postgres)
-- v1.0 — 8 Juli 2026
-- Prinsip: holdings TIDAK disimpan sebagai tabel mutable.
-- Holdings selalu derived dari transactions via view v_holdings.
-- Semua tabel yang bisa dihapus pengguna pakai soft delete (deleted_at).
-- ============================================================

-- ---------- SOURCES (CEX / Wallet) ----------
create table sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  type text not null check (type in ('cex','wallet')),
  icon_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- ASSETS (metadata koin, dari CoinGecko) ----------
create table assets (
  id uuid primary key default gen_random_uuid(),
  coingecko_id text not null unique,
  symbol text not null,
  name text not null,
  icon_url text,
  created_at timestamptz not null default now()
);

-- ---------- TRANSACTIONS (satu-satunya sumber kebenaran holdings) ----------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  asset_id uuid not null references assets(id),
  source_id uuid not null references sources(id),
  type text not null check (type in ('buy','sell')),
  quantity numeric not null check (quantity > 0),
  price_usd numeric not null,
  price_idr numeric,
  fee_usd numeric default 0,
  txn_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- WATCHLIST (cumsun / akan datang) ----------
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  asset_id uuid not null references assets(id),
  target_price_usd numeric,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- FIAT HOLDINGS ----------
create table fiat_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  source_id uuid not null references sources(id),
  currency text not null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- PRICE CACHE ----------
create table price_cache (
  coingecko_id text primary key,
  price_usd numeric,
  price_idr numeric,
  fetched_at timestamptz not null default now()
);

-- ============================================================
-- DERIVED VIEW: holdings dihitung on-the-fly, bukan disimpan manual
-- Method: average cost
-- ============================================================
create or replace view v_holdings as
select
  t.user_id,
  t.asset_id,
  t.source_id,
  sum(case when t.type = 'buy' then t.quantity else -t.quantity end) as qty_net,
  case
    when sum(case when t.type = 'buy' then t.quantity else 0 end) = 0 then 0
    else sum(case when t.type = 'buy' then t.quantity * t.price_usd else 0 end)
         / nullif(sum(case when t.type = 'buy' then t.quantity else 0 end), 0)
  end as avg_cost_usd
from transactions t
where t.deleted_at is null
group by t.user_id, t.asset_id, t.source_id;

-- ============================================================
-- REALIZED PNL VIEW: dari transaksi sell, dibandingkan avg cost SAAT itu
-- (versi sederhana pakai avg cost keseluruhan; cukup akurat untuk skala personal)
-- ============================================================
create or replace view v_realized_pnl as
select
  t.user_id,
  t.asset_id,
  t.source_id,
  sum(t.quantity * (t.price_usd - h.avg_cost_usd)) as realized_pnl_usd
from transactions t
join v_holdings h
  on h.user_id = t.user_id
 and h.asset_id = t.asset_id
 and h.source_id = t.source_id
where t.type = 'sell'
  and t.deleted_at is null
group by t.user_id, t.asset_id, t.source_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table sources enable row level security;
alter table transactions enable row level security;
alter table watchlist enable row level security;
alter table fiat_holdings enable row level security;

create policy "own rows" on sources for all using (user_id = auth.uid());
create policy "own rows" on transactions for all using (user_id = auth.uid());
create policy "own rows" on watchlist for all using (user_id = auth.uid());
create policy "own rows" on fiat_holdings for all using (user_id = auth.uid());

-- assets & price_cache: shared reference data, read-only untuk semua user terautentikasi
alter table assets enable row level security;
alter table price_cache enable row level security;
create policy "read all assets" on assets for select using (auth.role() = 'authenticated');
create policy "read all price_cache" on price_cache for select using (auth.role() = 'authenticated');

-- ============================================================
-- INDEXES (buat query & sync jadi cepat)
-- ============================================================
create index idx_transactions_asset on transactions(asset_id);
create index idx_transactions_source on transactions(source_id);
create index idx_transactions_updated on transactions(updated_at);
create index idx_watchlist_updated on watchlist(updated_at);
create index idx_fiat_updated on fiat_holdings(updated_at);
