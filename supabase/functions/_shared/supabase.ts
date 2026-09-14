import { createClient } from "jsr:@supabase/supabase-js@2";

/** Admin client using the service_role key, auto-provided by Supabase to every Edge Function. */
export function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
