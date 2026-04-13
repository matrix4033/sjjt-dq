/**
 * 认证管理模块
 * 处理用户认证状态、会话管理和路由保护
 */

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.userInfo = null;
        this.checkInterval = null;
        
        // 初始化认证状态
        this.init();
    }

    /**
     * 初始化认证管理器
     */
    async init() {
        await this.checkAuthStatus();
        
        // 每5分钟检查一次认证状态
        this.checkInterval = setInterval(() => {
            this.checkAuthStatus();
        }, 5 * 60 * 1000);
    }

    /**
     * 检查认证状态
     */
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success && data.authenticated) {
                this.isAuthenticated = true;
                this.userInfo = {
                    username: data.username,
                    loginTime: data.login_time
                };
                return true;
            } else {
                this.isAuthenticated = false;
                this.userInfo = null;
                return false;
            }
        } catch (error) {
            console.error('Auth status check failed:', error);
            this.isAuthenticated = false;
            this.userInfo = null;
            return false;
        }
    }

    /**
     * 用户登录
     */
    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.isAuthenticated = true;
                await this.checkAuthStatus(); // 更新用户信息
                return { success: true, redirectUrl: data.redirect_url };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, message: '网络连接错误，请稍后重试' };
        }
    }

    /**
     * 用户登出
     */
    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            this.isAuthenticated = false;
            this.userInfo = null;
            
            // 清理定时器
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            
            // 跳转到登录页面
            window.location.href = data.redirect_url || '/login.html';
            
            return data;
        } catch (error) {
            console.error('Logout failed:', error);
            // 即使登出请求失败，也要清理本地状态并跳转
            this.isAuthenticated = false;
            this.userInfo = null;
            window.location.href = '/login.html';
        }
    }

    /**
     * 路由保护 - 检查是否需要认证
     */
    async requireAuth() {
        const authenticated = await this.checkAuthStatus();
        
        if (!authenticated) {
            // 未认证，跳转到登录页面
            window.location.href = '/login.html';
            return false;
        }
        
        return true;
    }

    /**
     * 获取用户信息
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * 检查是否已认证
     */
    getAuthStatus() {
        return this.isAuthenticated;
    }

    /**
     * 销毁认证管理器
     */
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();

/**
 * 页面加载时的认证检查
 */
document.addEventListener('DOMContentLoaded', async function() {
    // 如果当前页面是登录页面，不需要认证检查
    if (window.location.pathname === '/login.html') {
        return;
    }
    
    // 检查认证状态
    const authenticated = await window.authManager.requireAuth();
    
    if (authenticated) {
        console.log('User authenticated:', window.authManager.getUserInfo());
        
        // 可以在这里添加认证成功后的初始化逻辑
        initAuthenticatedApp();
    }
});

/**
 * 认证成功后的应用初始化
 */
function initAuthenticatedApp() {
    // 添加登出按钮到页面（如果需要）
    addLogoutButton();
    
    // 显示用户信息（如果需要）
    displayUserInfo();
}

/**
 * 添加登出按钮
 */
function addLogoutButton() {
    // 检查是否已经存在登出按钮
    if (document.getElementById('logoutButton')) {
        return;
    }
    
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        const logoutButton = document.createElement('button');
        logoutButton.id = 'logoutButton';
        logoutButton.innerHTML = '登出';
        logoutButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 68, 68, 0.8);
            border: 1px solid rgba(255, 68, 68, 0.5);
            border-radius: 6px;
            color: white;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        
        logoutButton.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 68, 68, 1)';
        });
        
        logoutButton.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 68, 68, 0.8)';
        });
        
        logoutButton.addEventListener('click', function() {
            if (confirm('确定要登出吗？')) {
                window.authManager.logout();
            }
        });
        
        pageHeader.appendChild(logoutButton);
    }
}

/**
 * 显示用户信息
 */
function displayUserInfo() {
    const userInfo = window.authManager.getUserInfo();
    if (userInfo) {
        console.log(`欢迎, ${userInfo.username}! 登录时间: ${userInfo.loginTime}`);
    }
}

/**
 * API请求拦截器 - 自动处理认证错误
 */
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // 检查是否是认证错误
    if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        
        if (data.redirect) {
            // 会话过期或未认证，跳转到登录页面
            window.location.href = data.redirect;
            return response;
        }
    }
    
    return response;
};

// 导出认证管理器（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}