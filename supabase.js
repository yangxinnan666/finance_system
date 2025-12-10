// ========== supabase.js ==========
// 这个文件是连接你的网站和云端数据库的核心桥梁
// 请务必将下面的'你的ProjectURL'和'你的AnonKey'替换成你自己的

// 1. 配置你的Supabase连接信息（必须修改！）
const SUPABASE_URL = 'https://mturxsypupqbqrsulfkq.supabase.co'; // 替换：来自Supabase后台 Settings -> API 页面的 "Project URL"
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dXJ4c3lwdXBxYnFyc3VsZmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTE0NjUsImV4cCI6MjA4MDg2NzQ2NX0.RUPOa2lbVjqo4GGOQmwD3FVFsn5kv6N2m_sivLf2Sv0'; // 替换：来自同一页面的 "anon public" 密钥

// 2. 自动加载Supabase客户端库
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
document.head.appendChild(supabaseScript);

// 3. 库加载完成后，创建全局客户端实例
supabaseScript.onload = () => {
    // 创建Supabase客户端，供其他脚本使用
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] 客户端已初始化，准备就绪');
    
    // 发送一个自定义事件，通知主程序可以安全使用了
    window.dispatchEvent(new Event('supabaseReady'));
};

// 4. 如果库加载失败，给出明确错误提示
supabaseScript.onerror = () => {
    console.error('[Supabase] 客户端库加载失败，请检查网络');
};