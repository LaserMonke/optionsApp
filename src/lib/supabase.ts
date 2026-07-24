import { createClient } from '@supabase/supabase-js'

// The anon key is a publishable client key: it only grants access permitted by
// Row Level Security policies. The service-role key and any vendor API keys
// must never appear in this bundle — server-only, via Edge Function secrets.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://adkfxbkikctcrtutoqhp.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2Z4Ymtpa2N0Y3J0dXRvcWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NTY1NzMsImV4cCI6MjEwMDQzMjU3M30.fsq0jBA3wKy6DBAg-gh7wWW8d3pCUYy9oaVX56oNjas'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
