import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase environment variables are missing! Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
}

// Create client with fallback values to avoid immediate crash on import
// but logs a warning so developer knows why it might not work.
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder-url.supabase.co", 
  SUPABASE_ANON_KEY || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

