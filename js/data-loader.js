/**
 * 数据加载模块
 * 负责异步加载和解析CSV文件，支持UTF-8和GB2312编码自动检测
 */

class DataLoader {
  /**
   * 加载CSV文件（支持UTF-8和GB2312编码自动检测）
   * @param {string} filePath - CSV文件路径
   * @returns {Promise<Array>} 解析后的数据数组
   */
  async loadCSV(filePath) {
    try {
      // 显示加载状态
      LoadingIndicator.show(`正在加载 ${filePath.split('/').pop()}...`);
      
      // 使用fetch API异步读取CSV文件
      const response = await fetch(filePath);
      
      // 检查响应状态
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`文件未找到: ${filePath}。请检查文件是否存在于正确的路径。`);
        }
        throw new Error(`加载文件失败 (${response.status}): ${response.statusText}`);
      }
      
      // 读取为ArrayBuffer以支持多种编码
      const buffer = await response.arrayBuffer();
      
      // 自动检测编码并解码
      const csvText = await this.decodeWithAutoDetection(buffer, filePath);
      
      // 解析CSV数据
      const data = this.parseCSV(csvText);
      
      console.log(`✓ 成功加载 ${filePath}: ${data.length} 条记录`);
      
      return data;
    } catch (error) {
      // 重新抛出错误，由调用者处理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`无法访问文件: ${filePath}。请确保文件存在且路径正确，并且服务器正在运行。`);
      }
      throw error;
    }
  }
  
  /**
   * 自动检测编码并解码（先尝试UTF-8，失败后尝试GB2312）
   * @param {ArrayBuffer} buffer - 文件数据缓冲区
   * @param {string} filePath - 文件路径（用于日志）
   * @returns {Promise<string>} 解码后的文本
   */
  async decodeWithAutoDetection(buffer, filePath) {
    // 尝试UTF-8解码
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const text = decoder.decode(buffer);
      
      // 检查是否有替换字符（�），这表示解码失败
      if (!text.includes('�') && text.trim().length > 0) {
        console.log(`✓ 使用UTF-8编码成功解码 ${filePath.split('/').pop()}`);
        return text;
      }
      
      console.warn(`UTF-8解码产生乱码，尝试GB2312编码...`);
    } catch (e) {
      console.warn(`UTF-8解码失败: ${e.message}，尝试GB2312编码...`);
    }
    
    // 尝试GB2312解码
    try {
      const decoder = new TextDecoder('gb2312', { fatal: false });
      const text = decoder.decode(buffer);
      
      if (text.trim().length > 0) {
        console.log(`✓ 使用GB2312编码成功解码 ${filePath.split('/').pop()}`);
        return text;
      }
      
      throw new Error('GB2312解码后文本为空');
    } catch (e) {
      console.error(`GB2312解码失败: ${e.message}`);
    }
    
    // 如果两种编码都失败，尝试GBK作为最后的尝试
    try {
      const decoder = new TextDecoder('gbk', { fatal: false });
      const text = decoder.decode(buffer);
      
      if (text.trim().length > 0) {
        console.log(`✓ 使用GBK编码成功解码 ${filePath.split('/').pop()}`);
        return text;
      }
    } catch (e) {
      console.error(`GBK解码失败: ${e.message}`);
    }
    
    // 所有编码尝试都失败
    throw new Error(`无法解码CSV文件 ${filePath.split('/').pop()}。请检查文件编码是否为UTF-8、GB2312或GBK。`);
  }
  
  /**
   * 解析CSV文本（支持重复列名）
   * @param {string} csvText - CSV文本内容
   * @returns {Array} 解析后的数据数组
   */
  parseCSV(csvText) {
    try {
      // 验证输入不为空
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('CSV文件内容为空');
      }
      
      // 手动解析CSV以支持重复列名
      // D3的csvParse会覆盖重复列名，我们需要自己处理
      const lines = csvText.trim().split(/\r?\n/);
      
      if (lines.length < 2) {
        throw new Error('CSV文件为空或格式不正确。请检查文件是否包含有效的数据行。');
      }
      
      // 解析表头
      const headers = this.parseCSVLine(lines[0]);
      
      if (headers.length === 0) {
        throw new Error('CSV文件缺少列标题。请确保第一行包含字段名称。');
      }
      
      // 处理重复列名：为重复的列名添加序号
      const processedHeaders = [];
      const headerCounts = {};
      
      headers.forEach(header => {
        if (headerCounts[header] === undefined) {
          headerCounts[header] = 0;
          processedHeaders.push(header);
        } else {
          headerCounts[header]++;
          processedHeaders.push(`${header}${headerCounts[header]}`);
        }
      });
      
      console.log('原始列名:', headers);
      console.log('处理后列名:', processedHeaders);
      
      // 解析数据行
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue; // 跳过空行
        
        const values = this.parseCSVLine(line);
        const row = {};
        
        processedHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        data.push(row);
      }
      
      // 添加columns属性以兼容D3格式
      data.columns = processedHeaders;
      
      console.log(`✓ 手动解析CSV完成: ${data.length}行, ${processedHeaders.length}列`);
      
      return data;
    } catch (error) {
      // 如果解析失败，抛出更友好的错误信息
      if (error.message.includes('CSV')) {
        throw error; // 已经是友好的错误信息
      }
      throw new Error(`CSV解析失败: ${error.message}。请检查文件格式是否正确。`);
    }
  }
  
  /**
   * 解析CSV行（处理逗号分隔和引号）
   * @param {string} line - CSV行文本
   * @returns {Array<string>} 字段数组
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 转义的引号
          current += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // 字段分隔符
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // 添加最后一个字段
    result.push(current.trim());
    
    return result;
  }
  
  /**
   * 同时加载多个CSV文件（并行加载以提高性能）
   * @param {Object} filePaths - 文件路径对象 {key: path}
   * @returns {Promise<Object>} 解析后的数据对象 {key: data}
   */
  async loadMultipleCSV(filePaths) {
    try {
      LoadingIndicator.show('正在并行加载多个数据文件...');
      
      const promises = Object.entries(filePaths).map(async ([key, path]) => {
        try {
          const data = await this.loadCSV(path);
          return [key, data];
        } catch (error) {
          // 为每个文件添加上下文信息
          throw new Error(`加载 ${key} 失败: ${error.message}`);
        }
      });
      
      const results = await Promise.all(promises);
      const dataObject = Object.fromEntries(results);
      
      console.log(`✓ 成功加载所有数据文件`);
      return dataObject;
    } catch (error) {
      throw new Error(`批量加载失败: ${error.message}`);
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
   * @returns {string} 错误类型（'file', 'parse', 'network', 'validation', 'render', 'unknown'）
   */
  static getErrorType(error, context) {
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('文件未找到') || errorMessage.includes('404')) {
      return 'file';
    }
    if (errorMessage.includes('无法访问') || errorMessage.includes('fetch') || errorMessage.includes('网络')) {
      return 'network';
    }
    if (errorMessage.includes('CSV') || errorMessage.includes('解析') || errorMessage.includes('格式')) {
      return 'parse';
    }
    if (context === 'validation' || errorMessage.includes('验证')) {
      return 'validation';
    }
    if (context === 'render' || errorMessage.includes('渲染')) {
      return 'render';
    }
    if (errorMessage.includes('编码') || errorMessage.includes('解码')) {
      return 'encoding';
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
      case 'file':
        return `📁 文件加载失败\n\n${errorMessage}\n\n💡 建议：\n• 检查 data 目录下是否存在 汇总.csv 和 明细.csv 文件\n• 确保文件名拼写正确（注意中文字符）\n• 确保文件路径正确`;
      
      case 'network':
        return `🌐 网络连接失败\n\n${errorMessage}\n\n💡 建议：\n• 确保本地服务器正在运行\n• 检查网络连接是否正常\n• 尝试刷新页面重新加载`;
      
      case 'parse':
        return `📊 数据解析失败\n\n${errorMessage}\n\n💡 建议：\n• 检查CSV文件格式是否正确\n• 确保第一行包含列标题\n• 确保数据行格式一致\n• 检查是否有特殊字符或格式错误`;
      
      case 'encoding':
        return `🔤 文件编码错误\n\n${errorMessage}\n\n💡 建议：\n• 将CSV文件另存为UTF-8编码\n• 或使用GB2312/GBK编码\n• 避免使用其他不支持的编码格式`;
      
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
      // 如果容器不存在，使用alert作为后备方案
      alert(message);
      return;
    }
    
    // 创建错误消息元素
    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message error-${type}`;
    errorDiv.style.whiteSpace = 'pre-line'; // 保留换行符
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
    
    // 10秒后自动移除错误消息（增加时间以便用户阅读详细信息）
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
        // 如果没有其他错误消息，隐藏容器
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
  static loadingCount = 0; // 跟踪并发加载操作数量
  
  /**
   * 显示加载指示器
   * @param {string} message - 加载消息（可选）
   */
  static show(message = '正在加载数据...') {
    this.loadingCount++;
    
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      const textElement = indicator.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = message;
      }
      indicator.style.display = 'flex';
      
      // 添加淡入动画
      indicator.style.opacity = '0';
      setTimeout(() => {
        indicator.style.opacity = '1';
      }, 10);
    }
  }
  
  /**
   * 隐藏加载指示器（只有当所有加载操作完成时才隐藏）
   */
  static hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    // 只有当没有正在进行的加载操作时才隐藏
    if (this.loadingCount === 0) {
      const indicator = document.getElementById('loading-indicator');
      if (indicator) {
        // 添加淡出动画
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (this.loadingCount === 0) { // 再次检查
            indicator.style.display = 'none';
          }
        }, 300);
      }
    }
  }
  
  /**
   * 强制隐藏加载指示器（忽略计数）
   */
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
  
  /**
   * 更新加载消息
   * @param {string} message - 新的加载消息
   */
  static updateMessage(message) {
    const indicator = document.getElementById('loading-indicator');
    if (indicator && indicator.style.display !== 'none') {
      const textElement = indicator.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }
  
  /**
   * 显示加载进度
   * @param {number} current - 当前进度
   * @param {number} total - 总数
   * @param {string} message - 加载消息
   */
  static showProgress(current, total, message = '正在加载') {
    const percentage = Math.round((current / total) * 100);
    this.updateMessage(`${message}... (${current}/${total}) ${percentage}%`);
  }
}
