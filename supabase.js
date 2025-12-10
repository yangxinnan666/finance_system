// 财务对账系统 - Supabase连接配置
// 请替换以下两行引号中的内容为你的真实密钥

const SUPABASE_URL = 'https://mturxsypupqbqrsulfkq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dXJ4c3lwdXBxYnFyc3VsZmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTE0NjUsImV4cCI6MjA4MDg2NzQ2NX0.RUPOa2lbVjqo4GGOQmwD3FVFsn5kv6N2m_sivLf2Sv0';

// 使用更稳定的方式加载Supabase客户端
(function() {
    const script = document.createElement('script');
    // 使用官方推荐的CDN地址，确保链接正确
    script.src = 'https://unpkg.com/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js';
    script.onload = function() {
        if (window.supabase) {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[系统] Supabase数据库连接已建立');
            // 触发事件，通知主程序可以安全运行
            if (window.supabaseReady) {
                window.dispatchEvent(new Event('supabaseReady'));
            }
        }
    };
    script.onerror = function() {
        console.error('[系统错误] 无法加载数据库核心库，请检查网络');
        alert('系统初始化失败，请刷新页面或检查网络连接。');
    };
    document.head.appendChild(script);
})();
