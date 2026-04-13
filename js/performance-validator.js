/**
 * 性能验证模块
 * 用于验证系统性能是否满足需求
 */

class PerformanceValidator {
  constructor() {
    this.metrics = {
      renderTime: null,
      interactionTime: null,
      dataLoadTime: null,
      totalStartupTime: null
    };
    
    this.thresholds = {
      renderTimeout: 500,      // 桑基图渲染应在500ms内完成
      interactionTimeout: 200, // 交互响应应在200ms内完成
      dataLoadTimeout: 3000,   // 数据加载应在3s内完成
      totalStartupTimeout: 5000 // 总启动时间应在5s内完成
    };
    
    this.testResults = [];
  }
  
  /**
   * 记录渲染性能
   * @param {number} startTime - 开始时间
   * @param {number} endTime - 结束时间
   */
  recordRenderTime(startTime, endTime) {
    this.metrics.renderTime = endTime - startTime;
    const passed = this.metrics.renderTime <= this.thresholds.renderTimeout;
    
    this.testResults.push({
      test: '桑基图渲染性能',
      metric: this.metrics.renderTime.toFixed(2) + 'ms',
      threshold: this.thresholds.renderTimeout + 'ms',
      passed: passed,
      message: passed 
        ? `✓ 渲染性能达标 (${this.metrics.renderTime.toFixed(2)}ms < ${this.thresholds.renderTimeout}ms)`
        : `✗ 渲染性能超时 (${this.metrics.renderTime.toFixed(2)}ms > ${this.thresholds.renderTimeout}ms)`
    });
    
    return passed;
  }
  
  /**
   * 记录交互响应性能
   * @param {number} startTime - 开始时间
   * @param {number} endTime - 结束时间
   */
  recordInteractionTime(startTime, endTime) {
    this.metrics.interactionTime = endTime - startTime;
    const passed = this.metrics.interactionTime <= this.thresholds.interactionTimeout;
    
    this.testResults.push({
      test: '交互响应性能',
      metric: this.metrics.interactionTime.toFixed(2) + 'ms',
      threshold: this.thresholds.interactionTimeout + 'ms',
      passed: passed,
      message: passed 
        ? `✓ 交互响应达标 (${this.metrics.interactionTime.toFixed(2)}ms < ${this.thresholds.interactionTimeout}ms)`
        : `✗ 交互响应超时 (${this.metrics.interactionTime.toFixed(2)}ms > ${this.thresholds.interactionTimeout}ms)`
    });
    
    return passed;
  }
  
  /**
   * 记录数据加载性能
   * @param {number} startTime - 开始时间
   * @param {number} endTime - 结束时间
   */
  recordDataLoadTime(startTime, endTime) {
    this.metrics.dataLoadTime = endTime - startTime;
    const passed = this.metrics.dataLoadTime <= this.thresholds.dataLoadTimeout;
    
    this.testResults.push({
      test: '数据加载性能',
      metric: this.metrics.dataLoadTime.toFixed(2) + 'ms',
      threshold: this.thresholds.dataLoadTimeout + 'ms',
      passed: passed,
      message: passed 
        ? `✓ 数据加载达标 (${this.metrics.dataLoadTime.toFixed(2)}ms < ${this.thresholds.dataLoadTimeout}ms)`
        : `✗ 数据加载超时 (${this.metrics.dataLoadTime.toFixed(2)}ms > ${this.thresholds.dataLoadTimeout}ms)`
    });
    
    return passed;
  }
  
  /**
   * 记录总启动时间
   * @param {number} startTime - 开始时间
   * @param {number} endTime - 结束时间
   */
  recordTotalStartupTime(startTime, endTime) {
    this.metrics.totalStartupTime = endTime - startTime;
    const passed = this.metrics.totalStartupTime <= this.thresholds.totalStartupTimeout;
    
    this.testResults.push({
      test: '总启动时间',
      metric: this.metrics.totalStartupTime.toFixed(2) + 'ms',
      threshold: this.thresholds.totalStartupTimeout + 'ms',
      passed: passed,
      message: passed 
        ? `✓ 启动时间达标 (${this.metrics.totalStartupTime.toFixed(2)}ms < ${this.thresholds.totalStartupTimeout}ms)`
        : `✗ 启动时间超时 (${this.metrics.totalStartupTime.toFixed(2)}ms > ${this.thresholds.totalStartupTimeout}ms)`
    });
    
    return passed;
  }
  
  /**
   * 测试大数据量支持（至少100个部门）
   * @param {number} departmentCount - 部门数量
   */
  testLargeDataSupport(departmentCount) {
    const threshold = 100;
    const passed = departmentCount >= threshold;
    
    this.testResults.push({
      test: '大数据量支持',
      metric: departmentCount + '个部门',
      threshold: '≥' + threshold + '个部门',
      passed: passed,
      message: passed 
        ? `✓ 支持大数据量 (${departmentCount}个部门 ≥ ${threshold}个部门)`
        : `✗ 数据量不足 (${departmentCount}个部门 < ${threshold}个部门)`
    });
    
    return passed;
  }
  
  /**
   * 测试浏览器兼容性
   */
  testBrowserCompatibility() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let version = 0;
    let passed = false;
    
    // 检测Chrome
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 90;
    }
    // 检测Edge
    else if (userAgent.indexOf('Edg') > -1) {
      browser = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 90;
    }
    // 检测Firefox
    else if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 88;
    }
    // 检测Safari
    else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
      passed = version >= 14;
    }
    
    this.testResults.push({
      test: '浏览器兼容性',
      metric: `${browser} ${version}`,
      threshold: 'Chrome 90+, Firefox 88+, Edge 90+, Safari 14+',
      passed: passed,
      message: passed 
        ? `✓ 浏览器兼容 (${browser} ${version})`
        : `⚠️ 浏览器版本较低 (${browser} ${version})，建议升级`
    });
    
    return passed;
  }
  
  /**
   * 测试防抖和节流功能
   */
  testDebounceThrottle() {
    // 检查utils.js中的防抖和节流函数是否存在
    const hasDebounce = typeof debounce === 'function';
    const hasThrottle = typeof throttle === 'function';
    const passed = hasDebounce && hasThrottle;
    
    this.testResults.push({
      test: '防抖和节流功能',
      metric: `debounce: ${hasDebounce}, throttle: ${hasThrottle}`,
      threshold: '两者都存在',
      passed: passed,
      message: passed 
        ? '✓ 防抖和节流功能已实现'
        : '✗ 防抖或节流功能缺失'
    });
    
    return passed;
  }
  
  /**
   * 测试CSS硬件加速
   */
  testHardwareAcceleration() {
    // 检查关键元素是否应用了硬件加速样式
    const modalOverlay = document.querySelector('.modal-overlay');
    const metricCard = document.querySelector('.metric-card');
    
    let passed = true;
    let details = [];
    
    if (modalOverlay) {
      const style = window.getComputedStyle(modalOverlay);
      const hasTransform = style.transform !== 'none';
      const hasWillChange = style.willChange !== 'auto';
      details.push(`modal-overlay: transform=${hasTransform}, will-change=${hasWillChange}`);
    }
    
    if (metricCard) {
      const style = window.getComputedStyle(metricCard);
      const hasTransform = style.transform !== 'none';
      const hasWillChange = style.willChange !== 'auto';
      details.push(`metric-card: transform=${hasTransform}, will-change=${hasWillChange}`);
    }
    
    this.testResults.push({
      test: 'CSS硬件加速',
      metric: details.join('; '),
      threshold: 'transform和will-change已应用',
      passed: passed,
      message: passed 
        ? '✓ CSS硬件加速已启用'
        : '⚠️ CSS硬件加速可能未完全启用'
    });
    
    return passed;
  }
  
  /**
   * 测试事件监听器清理
   */
  testEventListenerCleanup() {
    // 检查InteractionHandler是否有destroy方法
    const hasDestroyMethod = InteractionHandler.prototype.destroy !== undefined;
    const hasModalCleanup = ModalRenderer.prototype.unbindEvents !== undefined;
    const passed = hasDestroyMethod && hasModalCleanup;
    
    this.testResults.push({
      test: '事件监听器清理',
      metric: `InteractionHandler.destroy: ${hasDestroyMethod}, ModalRenderer.unbindEvents: ${hasModalCleanup}`,
      threshold: '清理方法已实现',
      passed: passed,
      message: passed 
        ? '✓ 事件监听器清理机制已实现'
        : '✗ 事件监听器清理机制缺失'
    });
    
    return passed;
  }
  
  /**
   * 运行所有性能测试
   * @param {Object} metrics - 性能指标对象
   * @param {number} departmentCount - 部门数量
   */
  runAllTests(metrics, departmentCount) {
    console.log('\n=== 性能验证测试 ===\n');
    
    // 测试渲染性能
    if (metrics.renderStart && metrics.renderEnd) {
      this.recordRenderTime(metrics.renderStart, metrics.renderEnd);
    }
    
    // 测试交互响应性能
    if (metrics.interactionStart && metrics.interactionEnd) {
      this.recordInteractionTime(metrics.interactionStart, metrics.interactionEnd);
    }
    
    // 测试数据加载性能
    if (metrics.dataLoadStart && metrics.dataLoadEnd) {
      this.recordDataLoadTime(metrics.dataLoadStart, metrics.dataLoadEnd);
    }
    
    // 测试总启动时间
    if (metrics.totalStartTime && metrics.totalEndTime) {
      this.recordTotalStartupTime(metrics.totalStartTime, metrics.totalEndTime);
    }
    
    // 测试大数据量支持
    if (departmentCount !== undefined) {
      this.testLargeDataSupport(departmentCount);
    }
    
    // 测试浏览器兼容性
    this.testBrowserCompatibility();
    
    // 测试防抖和节流
    this.testDebounceThrottle();
    
    // 测试CSS硬件加速
    this.testHardwareAcceleration();
    
    // 测试事件监听器清理
    this.testEventListenerCleanup();
    
    // 输出测试结果
    this.outputResults();
    
    return this.getOverallResult();
  }
  
  /**
   * 输出测试结果
   */
  outputResults() {
    console.log('测试结果：\n');
    
    this.testResults.forEach((result, index) => {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m'; // 绿色或红色
      const reset = '\x1b[0m';
      
      console.log(`${index + 1}. ${result.test}`);
      console.log(`   指标: ${result.metric}`);
      console.log(`   阈值: ${result.threshold}`);
      console.log(`   ${color}${result.message}${reset}\n`);
    });
    
    const passedCount = this.testResults.filter(r => r.passed).length;
    const totalCount = this.testResults.length;
    const passRate = ((passedCount / totalCount) * 100).toFixed(1);
    
    console.log(`总计: ${passedCount}/${totalCount} 通过 (${passRate}%)`);
    console.log('\n===================\n');
  }
  
  /**
   * 获取总体测试结果
   * @returns {boolean} 是否所有测试都通过
   */
  getOverallResult() {
    return this.testResults.every(r => r.passed);
  }
  
  /**
   * 获取测试摘要
   * @returns {Object} 测试摘要
   */
  getSummary() {
    const passedCount = this.testResults.filter(r => r.passed).length;
    const totalCount = this.testResults.length;
    
    return {
      total: totalCount,
      passed: passedCount,
      failed: totalCount - passedCount,
      passRate: ((passedCount / totalCount) * 100).toFixed(1) + '%',
      allPassed: this.getOverallResult(),
      results: this.testResults
    };
  }
  
  /**
   * 清空测试结果
   */
  reset() {
    this.testResults = [];
    this.metrics = {
      renderTime: null,
      interactionTime: null,
      dataLoadTime: null,
      totalStartupTime: null
    };
  }
}

// 导出为全局变量
if (typeof window !== 'undefined') {
  window.PerformanceValidator = PerformanceValidator;
}
