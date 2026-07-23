import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser Supabase client (anon key) — used only for Realtime subscriptions.
// All data reads/writes still go through tRPC; this client never carries the
// service key. Returns null when Supabase isn't configured so the app degrades
// to polling (see SocketContext).

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) return null;
  if (!_client) {
    _client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return _client;
}
