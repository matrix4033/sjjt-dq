/**
 * 工具函数模块
 * 提供通用的辅助函数
 */

/**
 * 格式化数字（千分位分隔）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 节流函数
 * 限制函数在指定时间内只能执行一次
 * @param {Function} func - 要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, wait) {
  let timeout = null;
  let previous = 0;
  
  return function executedFunction(...args) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 防抖函数
 * 延迟执行函数，如果在延迟期间再次调用，则重新计时
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @param {string} format - 格式字符串，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return '-';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 数据量单位转换函数
 * 将数字转换为带单位的字符串（条、万条、亿条）
 * @param {number} num - 数据量
 * @param {number} precision - 小数精度，默认为2
 * @returns {string} 格式化后的字符串
 */
function formatDataVolume(num, precision = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0条';
  }
  
  if (num >= 100000000) {
    // 亿条
    return (num / 100000000).toFixed(precision) + '亿条';
  } else if (num >= 10000) {
    // 万条
    return (num / 10000).toFixed(precision) + '万条';
  } else {
    // 条
    return formatNumber(num) + '条';
  }
}

/**
 * 检测是否为触摸设备
 * @returns {boolean} 是否为触摸设备
 */
function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * 初始化触摸设备优化
 */
function initTouchOptimization() {
  if (isTouchDevice()) {
    // 添加触摸设备标识类
    document.body.classList.add('touch-device');
    
    // 禁用某些悬停效果，改用点击
    console.log('触摸设备已检测，已启用触摸优化');
  }
}

// 页面加载时初始化触摸优化
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTouchOptimization);
  } else {
    initTouchOptimization();
  }
}
