import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase environment variables are not configured yet.");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseKey || ""
);

export const hasSupabaseSetup = Boolean(supabaseUrl && supabaseKey);
