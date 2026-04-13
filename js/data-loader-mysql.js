/**
 * 数据加载模块 (MySQL 版本)
 * 负责从 Python API 异步加载数据
 */

class DataLoader {
  constructor() {
    // API 基础 URL - 使用相对路径以支持不同的部署环境
    this.apiBaseUrl = '/api';
  }

  /**
   * 从 API 加载数据
   * @param {string} endpoint - API 端点 ('summary' 或 'detail')
   * @returns {Promise<Array>} 解析后的数据数组
   */
  async loadFromAPI(endpoint) {
    try {
      // 显示加载状态
      LoadingIndicator.show(`正在从数据库加载 ${endpoint === 'summary' ? '汇总' : '明细'} 数据...`);
      
      // 使用 fetch API 异步请求数据
      const response = await fetch(`${this.apiBaseUrl}/${endpoint}`);
      
      // 检查响应状态
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`API 端点未找到: ${endpoint}。请检查 Python 服务是否正在运行。`);
        }
        throw new Error(`加载数据失败 (${response.status}): ${response.statusText}`);
      }
      
      // 解析 JSON 响应
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '数据加载失败');
      }
      
      const data = result.data;
      
      console.log(`✓ 成功从数据库加载 ${endpoint}: ${data.length} 条记录`);
      
      // 添加 columns 属性以兼容 D3 格式
      if (data.length > 0) {
        data.columns = Object.keys(data[0]);
      } else {
        data.columns = [];
      }
      
      return data;
    } catch (error) {
      // 重新抛出错误，由调用者处理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`无法连接到 API 服务: ${this.apiBaseUrl}。请确保 Python 服务正在运行。`);
      }
      throw error;
    }
  }
  
  /**
   * 加载汇总数据
   * @returns {Promise<Array>} 汇总数据数组
   */
  async loadSummary() {
    return await this.loadFromAPI('summary');
  }
  
  /**
   * 加载明细数据
   * @returns {Promise<Array>} 明细数据数组
   */
  async loadDetail() {
    return await this.loadFromAPI('detail');
  }
  
  /**
   * 同时加载汇总和明细数据（并行加载以提高性能）
   * @returns {Promise<Object>} 包含汇总和明细数据的对象 {summary, detail}
   */
  async loadAll() {
    try {
      LoadingIndicator.show('正在并行加载数据...');
      
      const [summary, detail] = await Promise.all([
        this.loadSummary(),
        this.loadDetail()
      ]);
      
      console.log(`✓ 成功加载所有数据`);
      return { summary, detail };
    } catch (error) {
      throw new Error(`批量加载失败: ${error.message}`);
    }
  }
  
  /**
   * 健康检查
   * @returns {Promise<boolean>} API 服务是否正常
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('健康检查失败:', error);
      return false;
    }
  }
}

/**
 * 错误处理类
 * 负责统一处理和显示错误信息
 */
class ErrorHandler {
  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  static handle(error, context = 'unknown') {
    // 在控制台输出详细错误信息用于调试
    console.error(`[错误 - ${context}]`, error);
    
    // 隐藏加载指示器
    LoadingIndicator.hide();
    
    // 显示用户友好的错误提示
    const userMessage = this.getUserMessage(error, context);
    this.showErrorMessage(userMessage, this.getErrorType(error, context));
  }
  
  /**
   * 获取错误类型
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @returns {string} 错误类型
   */
  static getErrorType(error, context) {
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('API') || errorMessage.includes('连接')) {
      return 'network';
    }
    if (errorMessage.includes('数据库')) {
      return 'database';
    }
    if (errorMessage.includes('解析') || errorMessage.includes('格式')) {
      return 'parse';
    }
    if (context === 'validation' || errorMessage.includes('验证')) {
      return 'validation';
    }
    if (context === 'render' || errorMessage.includes('渲染')) {
      return 'render';
    }
    
    return 'unknown';
  }
  
  /**
   * 获取用户友好的错误消息
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @returns {string} 用户友好的错误消息
   */
  static getUserMessage(error, context) {
    const errorMessage = error.message || '未知错误';
    const errorType = this.getErrorType(error, context);
    
    // 根据错误类型返回友好的错误消息
    switch (errorType) {
      case 'network':
        return `🌐 API 连接失败\n\n${errorMessage}\n\n💡 建议：\n• 确保 Python API 服务正在运行\n• 检查网络连接是否正常\n• 尝试刷新页面重新加载\n• 检查服务器防火墙设置`;
      
      case 'database':
        return `🗄️ 数据库连接失败\n\n${errorMessage}\n\n💡 建议：\n• 检查 MySQL 服务是否正在运行\n• 确认数据库配置是否正确 (api/.env)\n• 确保数据库表已创建\n• 检查数据库用户权限`;
      
      case 'parse':
        return `📊 数据解析失败\n\n${errorMessage}\n\n💡 建议：\n• 检查数据库表结构是否正确\n• 确保数据格式一致\n• 检查是否有特殊字符或格式错误`;
      
      case 'validation':
        return `✓ 数据验证失败\n\n${errorMessage}\n\n💡 建议：\n• 检查数据完整性\n• 确保必需字段不为空\n• 验证数据类型是否正确`;
      
      case 'render':
        return `🎨 页面渲染失败\n\n${errorMessage}\n\n💡 建议：\n• 刷新页面重试\n• 检查浏览器控制台是否有其他错误\n• 清除浏览器缓存后重试`;
      
      default:
        return `⚠️ 发生错误\n\n${errorMessage}\n\n💡 建议：\n• 刷新页面重试\n• 检查浏览器控制台获取详细信息\n• 如问题持续，请联系技术支持`;
    }
  }
  
  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   * @param {string} type - 错误类型
   */
  static showErrorMessage(message, type = 'unknown') {
    const container = document.getElementById('error-container');
    if (!container) {
      alert(message);
      return;
    }
    
    // 创建错误消息元素
    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message error-${type}`;
    errorDiv.style.whiteSpace = 'pre-line';
    errorDiv.textContent = message;
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'error-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
      errorDiv.remove();
      if (container.children.length === 0) {
        container.style.display = 'none';
      }
    };
    errorDiv.appendChild(closeBtn);
    
    // 显示容器
    container.style.display = 'block';
    container.appendChild(errorDiv);
    
    // 10秒后自动移除错误消息
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
        if (container.children.length === 0) {
          container.style.display = 'none';
        }
      }
    }, 10000);
  }
  
  /**
   * 清除所有错误消息
   */
  static clearErrors() {
    const container = document.getElementById('error-container');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }
}

/**
 * 加载状态管理类
 * 负责显示和隐藏加载指示器
 */
class LoadingIndicator {
  static loadingCount = 0;
  
  static show(message = '正在加载数据...') {
    this.loadingCount++;
    
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      const textElement = indicator.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = message;
      }
      indicator.style.display = 'flex';
      indicator.style.opacity = '0';
      setTimeout(() => {
        indicator.style.opacity = '1';
      }, 10);
    }
  }
  
  static hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    if (this.loadingCount === 0) {
      const indicator = document.getElementById('loading-indicator');
      if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (this.loadingCount === 0) {
            indicator.style.display = 'none';
          }
        }, 300);
      }
    }
  }
  
  static forceHide() {
    this.loadingCount = 0;
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 300);
    }
  }
  
  static updateMessage(message) {
    const indicator = document.getElementById('loading-indicator');
    if (indicator && indicator.style.display !== 'none') {
      const textElement = indicator.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }
}
