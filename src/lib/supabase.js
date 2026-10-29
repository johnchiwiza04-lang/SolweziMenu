import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const hasSupabaseConfig = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    !supabaseUrl.includes("your-project") &&
    !supabasePublishableKey.includes("your-")
);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

export const hasSupabaseSetup = hasSupabaseConfig;
