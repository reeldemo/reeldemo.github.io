-- plugin_waitlist + download_events for reeldemo.io lead magnets / download tracking.
-- Applied on reeldemo-supabase-prod (2026-08-05). Keep for rebuilds.

CREATE TABLE IF NOT EXISTS public.plugin_waitlist (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  product text NOT NULL DEFAULT 'studio',
  source text,
  focus text,
  utm jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, product)
);

CREATE TABLE IF NOT EXISTS public.download_events (
  id bigserial PRIMARY KEY,
  product text NOT NULL,
  platform text,
  arch text,
  version text,
  asset_url text,
  source text,
  utm jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plugin_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plugin_waitlist_anon_insert ON public.plugin_waitlist;
CREATE POLICY plugin_waitlist_anon_insert
  ON public.plugin_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS download_events_anon_insert ON public.download_events;
CREATE POLICY download_events_anon_insert
  ON public.download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.plugin_waitlist TO anon, authenticated;
GRANT INSERT ON public.download_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.plugin_waitlist_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.download_events_id_seq TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
