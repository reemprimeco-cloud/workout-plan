import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

// Server-side Supabase admin client (service-role key). Used for storage
// uploads/downloads and any server operations that must bypass RLS. Never
// expose the service key to the browser.

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  if (!ENV.supabaseUrl || !ENV.supabaseServiceKey) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_KEY",
    );
  }
  _admin = createClient(ENV.supabaseUrl, ENV.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
