const SUPABASE_URL = 'https://mturxsypupqbqrsulfkq.supabase.co
';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dXJ4c3lwdXBxYnFyc3VsZmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTE0NjUsImV4cCI6MjA4MDg2NzQ2NX0.RUPOa2lbVjqo4GGOQmwD3FVFsn5kv6N2m_sivLf2Sv0';

const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
document.head.appendChild(supabaseScript);

supabaseScript.onload = () => {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.dispatchEvent(new Event('supabaseReady'));

};
