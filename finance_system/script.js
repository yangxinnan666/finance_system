// ========== 全局变量和初始化 ==========
let currentUser = null;

// 等待Supabase客户端加载完成
window.addEventListener('supabaseReady', initApp);

function initApp() {
    console.log('Supabase已就绪，开始初始化应用...');
    // 根据当前页面设置不同功能
    if (document.getElementById('loginForm')) {
        setupLoginPage();
    }
    if (document.getElementById('currentUser')) {
        setupMainPage();
    }
}

// ========== 1. 登录系统 ==========
async function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('loginError');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        try {
            // 从云端users表验证用户
            const { data: user, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .maybeSingle(); // 只期望一条记录

            if (error) throw error;

            if (user) {
                // 登录成功
                currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert('登录成功！');
                window.location.href = 'main.html';
            } else {
                // 登录失败
                errorMsg.textContent = '用户名或密码错误！';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error('登录过程出错:', error);
            errorMsg.textContent = '登录时发生错误，请检查网络。';
            errorMsg.style.display = 'block';
        }
    });
}

// ========== 2. 主页面系统 ==========
async function setupMainPage() {
    // 检查登录状态
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(savedUser);
    
    // 显示用户信息
    document.getElementById('currentUser').textContent = currentUser.username;
    document.getElementById('currentRole').textContent = currentUser.role === 'admin' ? '管理员' : '普通用户';

    // 设置标签页切换
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.page + 'Page').classList.add('active-page');
        });
    });

    // 管理员才显示“用户管理”标签和公告发布表单
    if (currentUser.role === 'admin') {
        document.getElementById('adminTab').style.display = 'block';
        document.getElementById('announcementFormContainer').style.display = 'block';
        loadUsers(); // 加载用户列表
        setupAnnouncementForm(); // 设置公告发布表单
    } else {
        // 普通用户隐藏管理员专属功能
        document.getElementById('adminTab').style.display = 'none';
        document.getElementById('announcementFormContainer').style.display = 'none';
    }

    // 加载数据
    loadAccounts();
    loadReports();
    loadAnnouncements();

    // 退出登录
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        // 页面将跳转到index.html
    });
}

// ========== 3. 对账系统功能 ==========
async function loadAccounts() {
    const tbody = document.querySelector('#accountTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">加载中...</td></tr>';

    try {
        const { data: accounts, error } = await window.supabaseClient
            .from('accounts')
            .select('*')
            .order('time', { ascending: false });

        if (error) throw error;

        tbody.innerHTML = '';
        if (!accounts || accounts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">暂无对账记录</td></tr>';
            updateSummary([]);
            return;
        }

        accounts.forEach((acc) => {
            const row = document.createElement('tr');
            const timeStr = new Date(acc.time + 'Z').toLocaleString('zh-CN');
            const typeText = acc.type === 'income' ? '收入' : '支出';
            const typeClass = acc.type === 'income' ? 'income' : 'expense';
            const paymentText = { 'alipay': '支付宝', 'wechat': '微信', 'bank': '银行卡' }[acc.payment] || acc.payment;

            row.innerHTML = `
                <td>${acc.name}</td>
                <td>${timeStr}</td>
                <td>¥${parseFloat(acc.amount).toFixed(2)}</td>
                <td><span class="${typeClass}">${typeText}</span></td>
                <td>${paymentText}</td>
                <td><button class="delete-btn" onclick="deleteAccount(${acc.id})">删除</button></td>
            `;
            tbody.appendChild(row);
        });

        updateSummary(accounts);
    } catch (error) {
        console.error('加载对账记录失败:', error);
        tbody.innerHTML = `<tr><td colspan="6">加载失败，请刷新重试</td></tr>`;
    }
}

// 添加对账记录
if (document.getElementById('accountForm')) {
    document.getElementById('accountForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name').value.trim(),
            time: document.getElementById('time').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            payment: document.getElementById('payment').value
        };

        // 验证
        if (!formData.name || !formData.time || isNaN(formData.amount) || !formData.type || !formData.payment) {
            alert('请填写所有必填项！');
            return;
        }
        if (formData.amount <= 0) {
            alert('金额必须大于0！');
            return;
        }

        try {
            const { error } = await window.supabaseClient
                .from('accounts')
                .insert([formData]);

            if (error) throw error;

            alert('记录添加成功！');
            this.reset(); // 清空表单
            loadAccounts(); // 重新加载列表
        } catch (error) {
            console.error('添加记录失败:', error);
            alert('添加失败: ' + error.message);
        }
    });
}

// 删除对账记录
window.deleteAccount = async function(recordId) {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
        const { error } = await window.supabaseClient
            .from('accounts')
            .delete()
            .eq('id', recordId);
        if (error) throw error;
        alert('删除成功！');
        loadAccounts();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

// 更新汇总
function updateSummary(accounts) {
    let totalIncome = 0, totalExpense = 0;
    accounts.forEach(acc => {
        const amount = parseFloat(acc.amount);
        if (acc.type === 'income') totalIncome += amount;
        else totalExpense += amount;
    });
    document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
    document.getElementById('totalExpense').textContent = totalExpense.toFixed(2);
    document.getElementById('balance').textContent = (totalIncome - totalExpense).toFixed(2);
}

// 导出对账表格
window.exportAccounts = async function() {
    try {
        const { data: accounts, error } = await window.supabaseClient
            .from('accounts')
            .select('*')
            .order('time', { ascending: false });
            
        if (error) throw error;
        if (!accounts || accounts.length === 0) {
            alert('没有数据可以导出！');
            return;
        }

        // 创建CSV内容
        let csvContent = "姓名,时间,金额,类型,支付方式\n";
        accounts.forEach(acc => {
            const timeStr = new Date(acc.time + 'Z').toLocaleString('zh-CN');
            const typeText = acc.type === 'income' ? '收入' : '支出';
            const paymentText = { 'alipay': '支付宝', 'wechat': '微信', 'bank': '银行卡' }[acc.payment] || acc.payment;
            csvContent += `${acc.name},${timeStr},${acc.amount},${typeText},${paymentText}\n`;
        });

        // 创建下载
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `对账记录_${new Date().toLocaleDateString('zh-CN')}.csv`;
        link.click();
        
        alert('导出成功！');
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// ========== 4. 报单系统功能 ==========
async function loadReports() {
    const tbody = document.querySelector('#reportTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">加载中...</td></tr>';

    try {
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('time', { ascending: false });

        if (error) throw error;

        tbody.innerHTML = '';
        if (!reports || reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">暂无报单记录</td></tr>';
            return;
        }

        reports.forEach((rep) => {
            const row = document.createElement('tr');
            const timeStr = new Date(rep.time + 'Z').toLocaleString('zh-CN');
            const tracking = rep.tracking_number || '-';

            row.innerHTML = `
                <td>${rep.name}</td>
                <td>${rep.item}</td>
                <td>${tracking}</td>
                <td>${timeStr}</td>
                <td>${rep.status}</td>
                <td><button class="delete-btn" onclick="deleteReport(${rep.id})">删除</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载报单失败:', error);
        tbody.innerHTML = `<tr><td colspan="6">加载失败，请刷新重试</td></tr>`;
    }
}

// 添加报单记录
if (document.getElementById('reportForm')) {
    document.getElementById('reportForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('reportName').value.trim(),
            item: document.getElementById('item').value.trim(),
            tracking_number: document.getElementById('tracking').value.trim() || null,
            time: document.getElementById('reportTime').value,
            status: document.getElementById('status').value
        };

        if (!formData.name || !formData.item || !formData.time) {
            alert('请填写姓名、物品和时间！');
            return;
        }

        try {
            const { error } = await window.supabaseClient
                .from('reports')
                .insert([formData]);

            if (error) throw error;

            alert('报单提交成功！');
            this.reset();
            loadReports();
        } catch (error) {
            console.error('提交报单失败:', error);
            alert('提交失败: ' + error.message);
        }
    });
}

// 删除报单记录
window.deleteReport = async function(recordId) {
    if (!confirm('确定删除这条报单吗？')) return;
    try {
        const { error } = await window.supabaseClient
            .from('reports')
            .delete()
            .eq('id', recordId);
        if (error) throw error;
        alert('删除成功！');
        loadReports();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

// ========== 5. 公告系统功能 ==========
function setupAnnouncementForm() {
    const form = document.getElementById('announcementForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!currentUser || currentUser.role !== 'admin') {
            alert('无权发布公告！');
            return;
        }

        const newAnnouncement = {
            title: document.getElementById('announceTitle').value.trim(),
            content: document.getElementById('announceContent').value.trim(),
            publisher: currentUser.username,
            is_pinned: document.getElementById('announcePinned').checked
        };

        if (!newAnnouncement.title || !newAnnouncement.content) {
            alert('请填写标题和内容！');
            return;
        }

        try {
            const { error } = await window.supabaseClient
                .from('announcements')
                .insert([newAnnouncement]);

            if (error) throw error;

            alert('公告发布成功！');
            this.reset();
            loadAnnouncements();
        } catch (error) {
            console.error('发布公告失败:', error);
            alert('发布失败: ' + error.message);
        }
    });
}

async function loadAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    container.innerHTML = '<p>加载公告中...</p>';

    try {
        const { data: announcements, error } = await window.supabaseClient
            .from('announcements')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = '';
        if (!announcements || announcements.length === 0) {
            container.innerHTML = '<p>暂无公告。</p>';
            return;
        }

        announcements.forEach(announce => {
            const announceDiv = document.createElement('div');
            announceDiv.className = `announcement-item ${announce.is_pinned ? 'pinned' : ''}`;
            const timeStr = new Date(announce.created_at + 'Z').toLocaleString('zh-CN');
            
            announceDiv.innerHTML = `
                <h4>${announce.is_pinned ? '📌 ' : ''}${announce.title}</h4>
                <p class="announce-content">${announce.content.replace(/\n/g, '<br>')}</p>
                <div class="announce-meta">
                    <span>发布者: ${announce.publisher}</span>
                    <span>时间: ${timeStr}</span>
                    ${currentUser.role === 'admin' ? `<button class="delete-btn small" onclick="deleteAnnouncement(${announce.id})">删除</button>` : ''}
                </div>
            `;
            container.appendChild(announceDiv);
        });
    } catch (error) {
        console.error('加载公告失败:', error);
        container.innerHTML = '<p>加载公告失败，请稍后重试。</p>';
    }
}

// 删除公告（仅管理员）
window.deleteAnnouncement = async function(announceId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('无权操作！');
        return;
    }
    if (!confirm('确定要删除这条公告吗？')) return;

    try {
        const { error } = await window.supabaseClient
            .from('announcements')
            .delete()
            .eq('id', announceId);

        if (error) throw error;
        alert('公告已删除！');
        loadAnnouncements();
    } catch (error) {
        console.error('删除公告失败:', error);
        alert('删除失败: ' + error.message);
    }
}

// ========== 6. 用户管理功能 (仅管理员) ==========
async function loadUsers() {
    const tbody = document.querySelector('#userTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3">加载中...</td></tr>';

    try {
        const { data: users, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .order('username');

        if (error) throw error;

        tbody.innerHTML = '';
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">暂无用户</td></tr>';
            return;
        }

        users.forEach((user) => {
            const row = document.createElement('tr');
            // 防止删除初始管理员
            const isInitialAdmin = user.username === 'admin';

            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role === 'admin' ? '管理员' : '普通用户'}</td>
                <td>
                    ${!isInitialAdmin ? `<button class="delete-btn" onclick="deleteUser('${user.username}')">删除</button>` : '<span style="color:#999;">系统账号</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载用户列表失败:', error);
        tbody.innerHTML = '<tr><td colspan="3">加载失败</td></tr>';
    }
}

// 添加用户
window.addUser = async function() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const role = document.getElementById('newRole').value;

    if (!username || !password) {
        alert('请输入用户名和密码！');
        return;
    }
    if (password.length < 3) {
        alert('密码至少需要3个字符！');
        return;
    }

    try {
        // 检查用户名是否已存在
        const { data: existingUser, error: checkError } = await window.supabaseClient
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
            alert('用户名已存在，请更换！');
            return;
        }

        // 插入新用户
        const { error: insertError } = await window.supabaseClient
            .from('users')
            .insert([{ username, password, role }]);

        if (insertError) throw insertError;

        alert(`用户 "${username}" 添加成功！`);
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        loadUsers();
    } catch (error) {
        console.error('添加用户失败:', error);
        alert('添加失败: ' + error.message);
    }
}

// 删除用户
window.deleteUser = async function(usernameToDelete) {
    if (!usernameToDelete || usernameToDelete === 'admin') {
        alert('不能删除系统初始管理员！');
        return;
    }
    if (!confirm(`确定要删除用户 "${usernameToDelete}" 吗？`)) return;

    try {
        const { error } = await window.supabaseClient
            .from('users')
            .delete()
            .eq('username', usernameToDelete);

        if (error) throw error;
        alert('用户删除成功！');
        loadUsers();
    } catch (error) {
        console.error('删除用户失败:', error);
        alert('删除失败: ' + error.message);
    }
}

// ========== 页面加载初始化 ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // 如果Supabase已经就绪，直接初始化
        if (window.supabaseClient) {
            initApp();
        }
    });
} else {
    // 如果页面已经加载完成
    if (window.supabaseClient) {
        initApp();
    }
}