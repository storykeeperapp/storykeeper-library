-- Run this once in Supabase's SQL Editor to add funnel/paywall analytics tracking.
-- The app writes rows here via trackEvent() in App.jsx (fire-and-forget, never blocks
-- the UI). No app rebuild needed for this migration itself, but the events won't start
-- flowing until a build with the trackEvent() instrumentation ships.

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  user_id uuid,                     -- null for signed-out views (paywall can be seen pre-auth)
  properties jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists analytics_events_event_name_idx on analytics_events (event_name);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at);
create index if not exists analytics_events_user_id_idx on analytics_events (user_id);

alter table analytics_events enable row level security;

-- Anyone (signed in or not) can log an event, but nobody can read/update/delete via
-- the anon key — Michelle queries this table from the Supabase dashboard (which uses
-- the service role and bypasses RLS), not from the app itself.
create policy "Anyone can insert events"
  on analytics_events for insert
  with check (true);

-- Events tracked as of this migration, for reference:
--   paywall_viewed        { source, current_tier, platform }        -- source: tbr_shelf | platform_import | add_to_library | community | genre_group | book_club | profile | direct
--   paywall_gate_shown    { source, platform? , genre? }            -- fires when a locked screen renders, even if the user never clicks through to plans (added 2026-09-28); source: platform_import | community | genre_group | book_club
--   upgrade_cta_clicked   { source, tier, billing, platform }
--   purchase_completed    { source, tier, billing?, platform }      -- web purchases can't confirm which tier client-side, logged as "unknown"
--   purchase_cancelled    { source, tier, billing, platform: "native" }
--   purchase_failed       { source, tier, billing, platform: "native", error }
--   book_limit_hit        { current_count, limit, tier_name }

-- Handy starter queries once data is flowing:
--
-- Paywall views by source, last 30 days:
--   select properties->>'source' as source, count(*)
--   from analytics_events
--   where event_name = 'paywall_viewed' and created_at > now() - interval '30 days'
--   group by 1 order by 2 desc;
--
-- Full funnel counts:
--   select event_name, count(*)
--   from analytics_events
--   where created_at > now() - interval '30 days'
--   group by 1 order by 2 desc;
--
-- Conversion rate (paywall views -> completed purchases):
--   select
--     count(*) filter (where event_name = 'paywall_viewed') as views,
--     count(*) filter (where event_name = 'upgrade_cta_clicked') as cta_clicks,
--     count(*) filter (where event_name = 'purchase_completed') as purchases
--   from analytics_events
--   where created_at > now() - interval '30 days';
