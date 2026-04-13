/**
 * OverviewPanel - 整体汇聚情况展示模块
 * 负责渲染和管理整体统计指标的卡片式展示
 * 采用暗黑科技风格设计
 */
class OverviewPanel {
  /**
   * 初始化概览面板
   * @param {string} containerId - 容器DOM元素ID
   * @param {Object} config - 配置参数
   */
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    // 默认配置 - 按照需求规范定义4个指标（蓝绿色系）
    this.config = {
      metrics: [
        {
          key: "departmentCount",
          label: "总部门数",
          icon: "📊",  // 图表图标
          color: "#9DC7DD",  // 浅蓝色
          unit: "",
          value: null  // null表示自动计算
        },
        {
          key: "tableCount",
          label: "总表数量",
          icon: "📁",  // 文件夹图标
          color: "#6BB8C8",  // 青蓝色
          unit: "",
          value: null
        },
        {
          key: "aggregatedTableCount",
          label: "已汇聚表数量",
          icon: "✓",  // 对勾图标
          color: "#5BA88F",  // 青绿色
          unit: "",
          value: null
        },
        {
          key: "completionRate",
          label: "数据汇聚完成率",
          icon: "◆",  // 菱形图标
          color: "#3D9F3C",  // 深绿色
          unit: "%",
          value: null
        }
      ],
      ...config
    };
    
    this.currentStats = {};
  }
  
  /**
   * 渲染概览面板
   * @param {Object} stats - 统计数据对象
   */
  render(stats) {
    this.currentStats = stats;
    this.container.innerHTML = '';
    
    // 创建指标卡片
    this.config.metrics.forEach(metric => {
      const card = this.createMetricCard(metric, stats);
      this.container.appendChild(card);
    });
  }
  
  /**
   * 创建单个指标卡片
   * @param {Object} metric - 指标配置
   * @param {Object} stats - 统计数据
   * @returns {HTMLElement} 卡片DOM元素
   */
  createMetricCard(metric, stats) {
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.setAttribute('data-metric', metric.key);
    
    // 创建图标容器
    const iconDiv = document.createElement('div');
    iconDiv.className = 'metric-icon';
    iconDiv.textContent = metric.icon;
    // 设置图标颜色并添加发光效果
    if (metric.color) {
      iconDiv.style.color = metric.color;
      iconDiv.style.filter = `drop-shadow(0 0 8px ${metric.color})`;
    }
    
    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'metric-content';
    
    // 获取指标值（优先使用配置的固定值，否则使用统计数据）
    const value = metric.value !== null ? metric.value : stats[metric.key];
    const formattedValue = this.formatValue(value, metric.key, metric.unit);
    
    // 创建数值元素
    const valueDiv = document.createElement('div');
    valueDiv.className = 'metric-value';
    valueDiv.textContent = formattedValue;
    // 添加数值发光效果
    if (metric.color) {
      const rgba = this.hexToRgba(metric.color, 0.6);
      valueDiv.style.textShadow = `0 0 8px ${rgba}`;
    }
    
    // 创建标签元素
    const labelDiv = document.createElement('div');
    labelDiv.className = 'metric-label';
    labelDiv.textContent = metric.label;
    
    // 组装内容
    contentDiv.appendChild(valueDiv);
    contentDiv.appendChild(labelDiv);
    
    // 组装卡片
    card.appendChild(iconDiv);
    card.appendChild(contentDiv);
    
    return card;
  }
  
  /**
   * 将十六进制颜色转换为RGBA格式
   * @param {string} hex - 十六进制颜色（如#00D9FF）
   * @param {number} alpha - 透明度（0-1）
   * @returns {string} RGBA颜色字符串
   */
  hexToRgba(hex, alpha = 1) {
    // 移除#号
    hex = hex.replace('#', '');
    
    // 解析RGB值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  /**
   * 格式化指标值
   * @param {number} value - 原始值
   * @param {string} key - 指标键
   * @param {string} unit - 单位
   * @returns {string} 格式化后的值
   */
  formatValue(value, key, unit) {
    if (value === null || value === undefined) {
      return '-';
    }
    
    // 处理百分比类型的指标
    if (unit === '%' || key.includes('Rate')) {
      // 确保是数字类型
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      // 保留1位小数
      return `${numValue.toFixed(1)}${unit}`;
    }
    
    // 所有其他指标使用千分位分隔符
    return this.formatNumber(value) + unit;
  }
  
  /**
   * 格式化数字（千分位分隔）
   * @param {number} num - 数字
   * @returns {string} 格式化后的字符串
   */
  formatNumber(num) {
    if (typeof num !== 'number') {
      // 尝试转换为数字
      const parsed = parseFloat(num);
      if (isNaN(parsed)) {
        return String(num);
      }
      num = parsed;
    }
    
    // 使用千分位分隔符格式化
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
  
  /**
   * 更新单个指标
   * @param {string} key - 指标键
   * @param {any} value - 新值
   */
  updateMetric(key, value) {
    this.currentStats[key] = value;
    
    // 查找对应的卡片
    const card = this.container.querySelector(`[data-metric="${key}"]`);
    if (!card) {
      console.warn(`Metric card with key "${key}" not found`);
      return;
    }
    
    // 查找指标配置
    const metric = this.config.metrics.find(m => m.key === key);
    if (!metric) {
      console.warn(`Metric configuration with key "${key}" not found`);
      return;
    }
    
    // 更新数值
    const valueDiv = card.querySelector('.metric-value');
    if (valueDiv) {
      const formattedValue = this.formatValue(value, key, metric.unit);
      valueDiv.textContent = formattedValue;
      
      // 添加更新动画
      valueDiv.classList.add('metric-updated');
      setTimeout(() => {
        valueDiv.classList.remove('metric-updated');
      }, 600);
    }
  }
  
  /**
   * 获取当前统计数据
   * @returns {Object} 当前统计数据
   */
  getStats() {
    return { ...this.currentStats };
  }
  
  /**
   * 清空面板
   */
  clear() {
    this.container.innerHTML = '';
    this.currentStats = {};
  }
}
