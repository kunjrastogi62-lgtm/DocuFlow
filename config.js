// DocuFlow Supabase Configuration
const SUPABASE_URL = "https://pvdwvpjzmsbgnmpxzily.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lUakyBrVso7ch28RZyz-Qw_ao7q4kzP";

if (typeof window !== 'undefined') {
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
}
