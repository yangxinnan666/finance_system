const SUPABASE_URL = 'https://mturxsypupqbqrsulfkq.supabase.co
';
const SUPABASE_ANON_KEY = 'sb_publishable_Q3iLOw116t4gAWmDdyZFNA_ygRPTXSF';

const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
document.head.appendChild(supabaseScript);

supabaseScript.onload = () => {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.dispatchEvent(new Event('supabaseReady'));
};