-- Run in Supabase SQL editor (supabase.reeldemo.io).
-- Tracks ReelSynth (and future product) download clicks from the landing site.

create table if not exists public.download_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  product text not null,
  platform text,
  arch text,
  version text,
  asset_url text,
  source text,
  utm jsonb
);

create index if not exists download_events_created_at_idx
  on public.download_events (created_at desc);

create index if not exists download_events_product_idx
  on public.download_events (product, created_at desc);

alter table public.download_events enable row level security;

-- Anonymous site visitors may insert events only (no read/update/delete).
create policy "anon can insert download events"
  on public.download_events
  for insert
  to anon
  with check (true);
