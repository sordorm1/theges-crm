"use client";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://itpfltowyvsbmszlbfvl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cGZsdG93eXZzYm1zemxiZnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTQwNTAsImV4cCI6MjEwNDk3MDA1MH0.5nh683otSctJTOqx6q44-vryen6KYYk1ISHm5GlTIRw";

/**
 * Browser client using the anon key. RLS only grants it SELECT — all
 * writes go through Supabase Edge Functions (see lib/api/*.ts), which run
 * server-side on Supabase with the service_role key. Safe to embed: the
 * anon key is meant to be public, same as any Supabase JS frontend.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
