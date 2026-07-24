# Supabase backend

Hosted project: `https://adkfxbkikctcrtutoqhp.supabase.co`

## Layout

- `config.toml` — Supabase CLI / local dev configuration
- `migrations/` — SQL migrations. Every table has RLS enabled; there are no exceptions.
- `functions/` — Edge Functions (Deno). Heavy pricing (Monte Carlo, Heston/SABR,
  baskets) runs here, never on the client JS thread. `health/` is a deploy smoke test.

## First-time setup

```bash
supabase login
supabase link --project-ref adkfxbkikctcrtutoqhp
supabase db push                  # apply migrations to the hosted database
supabase functions deploy health  # smoke-test Edge Function deploys
```

## Rules that apply here

- The service-role key and market-data vendor keys live only in Supabase Function
  secrets (`supabase secrets set NAME=value`). They must never reach the client bundle.
- Points/streaks are computed server-side only; the client never writes them (CLAUDE.md §4.4).
- Edge Functions must be deterministic given a seed, cap `paths`/`steps` server-side,
  and be rate-limited per user (CLAUDE.md §4.2).
