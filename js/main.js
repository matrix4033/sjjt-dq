/**
 * 主控制器模块
 * 负责协调所有模块，控制应用初始化流程和数据缓存
 * 
 * 初始化流程：
 * 1. 显示加载状态
 * 2. 并行加载数据（汇总数据和明细数据）
 * 3. 转换数据
 * 4. 计算推送状态统计
 * 5. 渲染整体汇聚情况
 * 6. 渲染桑基图
 * 7. 初始化交互
 * 8. 移除加载状态
 */

// ==================== 配置对象 ====================

/**
 * 应用程序配置
 */
const AppConfig = {
  // 数据文件路径
  dataFiles: {
    summary: 'data/汇总.csv',
    detail: 'data/明细.csv'
  },
  
  // 性能目标
  performance: {
    renderTimeout: 500,      // 桑基图渲染超时时间（毫秒）
    interactionTimeout: 200  // 交互响应超时时间（毫秒）
  },
  
  // 桑基图参数
  sankey: {
    width: 1800,
    height: 1800,  // 增加高度，让内容更清晰
    nodeWidth: 15,
    nodePadding: 10,
    colors: {
      department: ["#00D9FF", "#0099FF"],  // 高饱和蓝色渐变
      server: ["#00FF88", "#00CC66"],      // 高饱和绿色渐变
      warehouse: ["#FF9500", "#FF6600"],   // 高饱和橙色渐变
      source: ["#AA00FF", "#7700CC"]       // 高饱和紫色渐变
    },
    linkOpacity: 0.6,
    linkOpacityHover: 0.9
  },
  
  // 整体汇聚情况配置
  overview: {
    metrics: [
      // 第一行：基础统计指标（2个）
      {
        key: "departmentCount",
        label: "汇聚部门数",
        icon: "●",  // 发光圆点
        color: "#00D9FF",  // 蓝色
        unit: "个",
        value: null  // null表示自动计算
      },
      {
        key: "totalTableCount",
        label: "部门汇聚清单表数量",
        icon: "●",  // 发光圆点
        color: "#00FF88",  // 绿色
        unit: "张",
        value: null  // null表示自动计算
      },
      // 第二行：更新率和完成率指标（4个）
      {
        key: "departmentUpdateRate",
        label: "部门数据更新率",
        icon: "●",  // 发光圆点
        color: "#FF9500",  // 橙色
        unit: "%",
        value: null  // null表示自动计算
      },
      {
        key: "warehouseUpdateRate",
        label: "前置仓更新率",
        icon: "●",  // 发光圆点
        color: "#AA00FF",  // 紫色
        unit: "%",
        value: null
      },
      {
        key: "linkCompletionRate",
        label: "链路完成率",
        icon: "●",  // 发光圆点
        color: "#00CC66",  // 深绿色
        unit: "%",
        value: null
      },
      {
        key: "linkAbnormalRate",
        label: "链路异常率",
        icon: "●",  // 发光圆点
        color: "#FF4444",  // 红色
        unit: "%",
        value: null
      }
    ]
  },
  
  // 表格配置（已废弃，使用弹窗展示明细数据）
  table: {
    columns: [
      { field: "部门", width: "120px", align: "left" },
      { field: "表中文名", width: "200px", align: "left" },
      { field: "部门到前置机对账状态", width: "120px", align: "center", colorize: true },
      { field: "异常原因说明", width: "150px", align: "left" },
      { field: "前置机到前置仓对账状态\n", width: "140px", align: "center", colorize: true },
      { field: "异常原因说明", width: "150px", align: "left" },
      { field: "前置仓数据量核对", width: "120px", align: "center", colorize: true },
      { field: "前置仓到贴源层调度状态", width: "140px", align: "center", colorize: true },
      { field: "异常原因说明", width: "150px", align: "left" }
    ]
  }
};

// ==================== 应用程序类 ====================

/**
 * 主应用程序类
 * 负责初始化和协调所有模块
 */
class Application {
  constructor(config) {
    this.config = config;
    this.modules = {};
    
    // 数据缓存（避免重复加载）
    this.dataCache = {
      summary: null,
      detail: null,
      sankeyData: null,
      stats: null,
      statusStats: null,  // 推送状态统计
      timestamp: null     // 缓存时间戳
    };
    
    // 性能监控
    this.performanceMetrics = {
      totalStartTime: null,
      totalEndTime: null,
      dataLoadStart: null,
      dataLoadEnd: null,
      renderStart: null,
      renderEnd: null,
      interactionStart: null,
      interactionEnd: null
    };
    
    // 性能验证器（检查是否已加载）
    if (typeof PerformanceValidator !== 'undefined') {
      this.performanceValidator = new PerformanceValidator();
    } else {
      console.warn('⚠️ PerformanceValidator 未加载，性能测试将被跳过');
      this.performanceValidator = null;
    }
  }
  
  /**
   * 初始化所有模块
   */
  initModules() {
    try {
      // 初始化数据加载模块
      this.modules.dataLoader = new DataLoader();
      console.log('✓ DataLoader 模块已初始化');
      
      // 初始化数据转换模块
      this.modules.dataTransformer = new DataTransformer();
      console.log('✓ DataTransformer 模块已初始化');
      
      // 初始化异常率计算模块
      this.modules.exceptionRateCalculator = new ExceptionRateCalculator();
      console.log('✓ ExceptionRateCalculator 模块已初始化');
      
      // 初始化整体汇聚情况面板
      this.modules.overviewPanel = new OverviewPanel('overview-panel', this.config.overview);
      console.log('✓ OverviewPanel 模块已初始化');
      
      // 初始化桑基图渲染器（使用响应式版本）
      this.modules.sankeyRenderer = new ResponsiveSankeyRenderer('sankey-container', this.config.sankey);
      console.log('✓ SankeyRenderer 模块已初始化');
      
      // 初始化表格渲染器（仅在容器存在时初始化）
      const tableContainer = document.getElementById('table-container');
      if (tableContainer) {
        this.modules.tableRenderer = new TableRenderer('table-container', this.config.table);
        console.log('✓ TableRenderer 模块已初始化');
      } else {
        console.log('ℹ TableRenderer 跳过（使用弹窗显示明细数据）');
      }
      
      // 初始化弹窗渲染器
      this.modules.modalRenderer = new ModalRenderer();
      console.log('✓ ModalRenderer 模块已初始化');
      
      // 初始化交互处理器
      this.modules.interactionHandler = new InteractionHandler(
        this.modules.sankeyRenderer,
        this.modules.modalRenderer
      );
      console.log('✓ InteractionHandler 模块已初始化');
      
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'module_init');
      return false;
    }
  }
  
  /**
   * 预处理明细数据：重命名重复的"异常原因说明"列
   * CSV文件中有3个同名的"异常原因说明"列，D3的csvParse可能会自动重命名
   * 我们需要确保列名与代码中使用的字段名一致
   * @param {Array} detailData - 明细数据数组
   */
  preprocessDetailData(detailData) {
    if (!detailData || detailData.length === 0) {
      console.warn('⚠️ 明细数据为空，跳过预处理');
      return;
    }
    
    // 检查第一行数据，看看D3是如何处理重复列名的
    const firstRow = detailData[0];
    const keys = Object.keys(firstRow);
    
    console.log('=== 明细数据预处理 ===');
    console.log('总列数:', keys.length);
    console.log('所有列名:', keys);
    
    // 查找所有"异常原因说明"相关的列
    const reasonColumns = keys.filter(key => key.includes('异常原因说明'));
    console.log('找到异常原因说明列 (' + reasonColumns.length + '个):', reasonColumns);
    
    // 显示第一行的异常原因说明值
    console.log('第一行异常原因说明值:');
    reasonColumns.forEach(col => {
      console.log(`  "${col}": "${firstRow[col]}"`);
    });
    
    // 自定义CSV解析器会将重复列名处理为：异常原因说明, 异常原因说明1, 异常原因说明2
    // 我们需要将它们映射到明确的字段名
    const columnMapping = {
      '异常原因说明': '异常原因说明（对应部门到前置机）',
      '异常原因说明1': '异常原因说明（对应前置机到前置仓）',
      '异常原因说明2': '异常原因说明（对应前置仓到贴源层）'
    };
    
    console.log('应用列名映射:', columnMapping);
    
    detailData.forEach(row => {
      for (const [oldName, newName] of Object.entries(columnMapping)) {
        if (oldName in row) {
          row[newName] = row[oldName];
          // 保留原字段以兼容
        }
      }
    });
    
    // 验证预处理结果
    const processedKeys = Object.keys(detailData[0]);
    const processedReasonColumns = processedKeys.filter(key => key.includes('异常原因说明'));
    console.log('预处理后的异常原因说明列 (' + processedReasonColumns.length + '个):', processedReasonColumns);
    console.log('预处理后第一行的值:');
    processedReasonColumns.forEach(col => {
      console.log(`  "${col}": "${detailData[0][col]}"`);
    });
    console.log('✓ 明细数据预处理完成');
    console.log('======================\n');
  }
  
  /**
   * 并行加载数据（同时加载汇总数据和明细数据）
   * 实现数据缓存以避免重复加载
   * 支持 CSV 和 MySQL 两种数据源
   */
  async loadData() {
    try {
      // 检查缓存
      if (this.dataCache.summary && this.dataCache.detail) {
        console.log('✓ 使用缓存数据（缓存时间：' + formatDate(this.dataCache.timestamp) + '）');
        return true;
      }
      
      this.performanceMetrics.dataLoadStart = performance.now();
      
      console.log('开始并行加载数据...');
      
      let summaryData, detailData;
      
      // 检测数据加载器类型（CSV 或 MySQL）
      if (typeof this.modules.dataLoader.loadCSV === 'function') {
        // CSV 数据加载器
        console.log('使用 CSV 数据源');
        [summaryData, detailData] = await Promise.all([
          this.modules.dataLoader.loadCSV(this.config.dataFiles.summary),
          this.modules.dataLoader.loadCSV(this.config.dataFiles.detail)
        ]);
      } else if (typeof this.modules.dataLoader.loadFromAPI === 'function') {
        // MySQL 数据加载器
        console.log('使用 MySQL 数据源');
        [summaryData, detailData] = await Promise.all([
          this.modules.dataLoader.loadFromAPI('summary'),
          this.modules.dataLoader.loadFromAPI('detail')
        ]);
      } else {
        throw new Error('未知的数据加载器类型');
      }
      
      this.performanceMetrics.dataLoadEnd = performance.now();
      const loadTime = (this.performanceMetrics.dataLoadEnd - this.performanceMetrics.dataLoadStart).toFixed(2);
      
      console.log(`✓ 汇总数据加载完成，共 ${summaryData.length} 条记录`);
      console.log(`✓ 明细数据加载完成，共 ${detailData.length} 条记录`);
      console.log(`✓ 数据加载耗时：${loadTime}ms`);
      
      // 预处理明细数据：重命名重复的"异常原因说明"列
      this.preprocessDetailData(detailData);
      
      // 缓存数据
      this.dataCache.summary = summaryData;
      this.dataCache.detail = detailData;
      this.dataCache.timestamp = new Date();
      
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'data_load');
      return false;
    }
  }
  
  /**
   * 转换数据并计算推送状态统计
   */
  transformData() {
    try {
      LoadingIndicator.updateMessage('正在处理数据...');
      
      // 使用缓存数据
      const summaryData = this.dataCache.summary;
      const detailData = this.dataCache.detail;
      
      // 验证数据完整性
      const validation = this.modules.dataTransformer.validateData(summaryData, detailData);
      
      if (!validation.isValid) {
        console.error('数据验证失败:', validation.warnings);
        // 显示警告但继续处理
        validation.warnings.forEach(warning => console.warn('⚠️', warning));
      }
      
      // 计算异常率（在数据转换之前）
      console.log('开始计算异常率...');
      const exceptionRates = this.modules.exceptionRateCalculator.calculateExceptionRates(detailData);
      console.log(`✓ 异常率计算完成，共 ${exceptionRates.size} 个部门`);
      
      // 转换数据为桑基图格式（传入明细数据用于计算推送状态统计）
      this.dataCache.sankeyData = this.modules.dataTransformer.transformToSankeyData(summaryData, detailData);
      console.log(`✓ 桑基图数据转换完成，节点数: ${this.dataCache.sankeyData.nodes.length}, 连接数: ${this.dataCache.sankeyData.links.length}`);
      
      // 计算推送状态统计（需求2.7-2.11）
      console.log('\n=== 推送状态统计 ===');
      this.dataCache.statusStats = this.calculateStatusStatistics(this.dataCache.sankeyData, detailData);
      this.outputStatusStatistics(this.dataCache.statusStats);
      console.log('===================\n');
      
      // 计算整体统计数据
      const overviewConfig = {
        departmentCount: this.config.overview.metrics.find(m => m.key === 'departmentCount')?.value,
        totalTableCount: this.config.overview.metrics.find(m => m.key === 'totalTableCount')?.value,
        departmentUpdateRate: this.config.overview.metrics.find(m => m.key === 'departmentUpdateRate')?.value,
        warehouseUpdateRate: this.config.overview.metrics.find(m => m.key === 'warehouseUpdateRate')?.value,
        linkCompletionRate: this.config.overview.metrics.find(m => m.key === 'linkCompletionRate')?.value,
        linkAbnormalRate: this.config.overview.metrics.find(m => m.key === 'linkAbnormalRate')?.value
      };
      
      this.dataCache.stats = this.modules.dataTransformer.calculateOverallStats(
        summaryData, 
        overviewConfig, 
        this.dataCache.statusStats,  // 传入状态统计数据
        detailData  // 传入明细数据用于计算链路完成率和异常率
      );
      console.log('✓ 统计数据计算完成:', this.dataCache.stats);
      
      // 清洗明细数据并缓存
      this.dataCache.detail = this.modules.dataTransformer.cleanDetailData(detailData);
      console.log('✓ 明细数据清洗完成');
      
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'data_transform');
      return false;
    }
  }
  
  /**
   * 计算推送状态统计（需求2.7-2.11）
   * @param {Object} sankeyData - 桑基图数据
   * @param {Array} detailData - 明细数据
   * @returns {Object} 推送状态统计
   */
  calculateStatusStatistics(sankeyData, detailData) {
    const stats = {
      byDepartment: new Map(),  // 按部门统计
      byStage: {                // 按流转环节统计
        'dept-to-front': { normal: 0, abnormal: 0, unpushed: 0, total: 0 },
        'front-to-warehouse': { normal: 0, abnormal: 0, unpushed: 0, total: 0 },
        'warehouse-to-source': { normal: 0, abnormal: 0, unpushed: 0, total: 0 }
      },
      overall: { normal: 0, abnormal: 0, unpushed: 0, total: 0 }
    };
    
    // 按部门统计
    const departments = new Set(detailData.map(row => row['部门']));
    
    departments.forEach(dept => {
      const deptData = detailData.filter(row => row['部门'] === dept);
      
      const deptStats = {
        'dept-to-front': { normal: 0, abnormal: 0, unpushed: 0, total: deptData.length },
        'front-to-warehouse': { normal: 0, abnormal: 0, unpushed: 0, total: deptData.length },
        'warehouse-to-source': { normal: 0, abnormal: 0, unpushed: 0, total: deptData.length }
      };
      
      deptData.forEach(row => {
        // 部门到前置机
        const status1 = row['部门到前置机状态'] || row['部门到前置机对账状态'] || '';
        if (status1.includes('正常')) deptStats['dept-to-front'].normal++;
        else if (status1.includes('异常')) deptStats['dept-to-front'].abnormal++;
        else deptStats['dept-to-front'].unpushed++;
        
        // 前置机到前置仓
        const status2 = row['前置机到前置仓状态'] || row['前置机到前置仓对账状态\n'] || '';
        if (status2.includes('正常')) deptStats['front-to-warehouse'].normal++;
        else if (status2.includes('异常')) deptStats['front-to-warehouse'].abnormal++;
        else deptStats['front-to-warehouse'].unpushed++;
        
        // 前置仓到贴源层
        const status3 = row['前置仓到贴源层状态'] || row['前置仓到贴源层调度状态'] || '';
        if (status3.includes('正常')) deptStats['warehouse-to-source'].normal++;
        else if (status3.includes('异常')) deptStats['warehouse-to-source'].abnormal++;
        else deptStats['warehouse-to-source'].unpushed++;
      });
      
      stats.byDepartment.set(dept, deptStats);
      
      // 累加到按环节统计
      Object.keys(deptStats).forEach(stage => {
        stats.byStage[stage].normal += deptStats[stage].normal;
        stats.byStage[stage].abnormal += deptStats[stage].abnormal;
        stats.byStage[stage].unpushed += deptStats[stage].unpushed;
        stats.byStage[stage].total += deptStats[stage].total;
      });
    });
    
    // 计算总体统计
    Object.values(stats.byStage).forEach(stageStats => {
      stats.overall.normal += stageStats.normal;
      stats.overall.abnormal += stageStats.abnormal;
      stats.overall.unpushed += stageStats.unpushed;
      stats.overall.total += stageStats.total;
    });
    
    return stats;
  }
  
  /**
   * 输出推送状态统计到控制台（需求2.15）
   * @param {Object} stats - 推送状态统计
   */
  outputStatusStatistics(stats) {
    console.log('总体统计：');
    console.log(`  正常：${stats.overall.normal} (${(stats.overall.normal / stats.overall.total * 100).toFixed(2)}%)`);
    console.log(`  异常：${stats.overall.abnormal} (${(stats.overall.abnormal / stats.overall.total * 100).toFixed(2)}%)`);
    console.log(`  未推送：${stats.overall.unpushed} (${(stats.overall.unpushed / stats.overall.total * 100).toFixed(2)}%)`);
    console.log(`  总计：${stats.overall.total}`);
    
    console.log('\n按流转环节统计：');
    Object.entries(stats.byStage).forEach(([stage, stageStats]) => {
      const stageName = {
        'dept-to-front': '部门→前置机',
        'front-to-warehouse': '前置机→前置仓',
        'warehouse-to-source': '前置仓→贴源层'
      }[stage];
      
      console.log(`  ${stageName}：`);
      console.log(`    正常：${stageStats.normal} (${(stageStats.normal / stageStats.total * 100).toFixed(2)}%)`);
      console.log(`    异常：${stageStats.abnormal} (${(stageStats.abnormal / stageStats.total * 100).toFixed(2)}%)`);
      console.log(`    未推送：${stageStats.unpushed} (${(stageStats.unpushed / stageStats.total * 100).toFixed(2)}%)`);
    });
    
    console.log('\n按部门统计（前5个部门）：');
    let count = 0;
    for (const [dept, deptStats] of stats.byDepartment) {
      if (count >= 5) break;
      console.log(`  ${dept}：`);
      Object.entries(deptStats).forEach(([stage, stageStats]) => {
        const stageName = {
          'dept-to-front': '部门→前置机',
          'front-to-warehouse': '前置机→前置仓',
          'warehouse-to-source': '前置仓→贴源层'
        }[stage];
        console.log(`    ${stageName}: 正常${stageStats.normal} 异常${stageStats.abnormal} 未推送${stageStats.unpushed}`);
      });
      count++;
    }
    
    if (stats.byDepartment.size > 5) {
      console.log(`  ... 还有 ${stats.byDepartment.size - 5} 个部门`);
    }
  }
  
  /**
   * 渲染所有组件（确保在500毫秒内完成桑基图渲染 - 需求2.12）
   */
  renderComponents() {
    try {
      LoadingIndicator.updateMessage('正在渲染页面...');
      this.performanceMetrics.renderStart = performance.now();
      
      // 渲染整体汇聚情况面板
      this.modules.overviewPanel.render(this.dataCache.stats);
      console.log('✓ 整体汇聚情况面板渲染完成');
      
      // 将异常率计算器实例传递给桑基图渲染器
      this.modules.sankeyRenderer.setExceptionRateCalculator(this.modules.exceptionRateCalculator);
      console.log('✓ 异常率计算器已传递给桑基图渲染器');
      
      // 渲染桑基图（性能监控）
      const sankeyRenderStart = performance.now();
      this.modules.sankeyRenderer.render(this.dataCache.sankeyData);
      const sankeyRenderEnd = performance.now();
      const sankeyRenderTime = (sankeyRenderEnd - sankeyRenderStart).toFixed(2);
      
      console.log(`✓ 桑基图渲染完成，耗时：${sankeyRenderTime}ms`);
      
      // 检查是否满足性能要求（500ms）
      if (sankeyRenderTime > this.config.performance.renderTimeout) {
        console.warn(`⚠️ 桑基图渲染超时：${sankeyRenderTime}ms > ${this.config.performance.renderTimeout}ms`);
      } else {
        console.log(`✓ 桑基图渲染性能达标：${sankeyRenderTime}ms < ${this.config.performance.renderTimeout}ms`);
      }
      
      // 渲染明细列表（如果存在表格容器）
      const tableContainer = document.getElementById('table-container');
      if (tableContainer && this.modules.tableRenderer) {
        this.modules.tableRenderer.render(this.dataCache.detail);
        console.log('✓ 明细列表渲染完成');
      }
      
      this.performanceMetrics.renderEnd = performance.now();
      const totalRenderTime = (this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart).toFixed(2);
      console.log(`✓ 总渲染耗时：${totalRenderTime}ms`);
      
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'render');
      return false;
    }
  }
  
  /**
   * 初始化交互（确保在200毫秒内完成交互响应 - 需求2.13）
   */
  bindInteractions() {
    try {
      console.log('\n=== 开始初始化交互 ===');
      this.performanceMetrics.interactionStart = performance.now();
      
      console.log('设置汇总数据到交互处理器...');
      // 设置汇总数据到交互处理器
      this.modules.interactionHandler.setSummaryData(this.dataCache.summary);
      console.log('✓ 汇总数据已设置');
      
      console.log('设置明细数据到交互处理器...');
      // 设置明细数据到交互处理器
      this.modules.interactionHandler.setDetailData(this.dataCache.detail);
      console.log('✓ 明细数据已设置');
      
      console.log('调用 interactionHandler.init()...');
      // 初始化交互事件
      this.modules.interactionHandler.init();
      console.log('✓ interactionHandler.init() 完成');
      
      this.performanceMetrics.interactionEnd = performance.now();
      const interactionTime = (this.performanceMetrics.interactionEnd - this.performanceMetrics.interactionStart).toFixed(2);
      
      console.log(`✓ 交互事件绑定完成，耗时：${interactionTime}ms`);
      
      // 检查是否满足性能要求（200ms）
      if (interactionTime > this.config.performance.interactionTimeout) {
        console.warn(`⚠️ 交互初始化超时：${interactionTime}ms > ${this.config.performance.interactionTimeout}ms`);
      } else {
        console.log(`✓ 交互初始化性能达标：${interactionTime}ms < ${this.config.performance.interactionTimeout}ms`);
      }
      
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'interaction');
      return false;
    }
  }
  
  /**
   * 启动应用程序
   * 
   * 初始化流程：
   * 1. 显示加载状态
   * 2. 验证依赖库
   * 3. 初始化模块
   * 4. 并行加载数据（汇总数据和明细数据）
   * 5. 转换数据
   * 6. 计算推送状态统计
   * 7. 渲染整体汇聚情况
   * 8. 渲染桑基图
   * 9. 初始化交互
   * 10. 移除加载状态
   */
  async start() {
    const startTime = performance.now();
    this.performanceMetrics.totalStartTime = startTime;
    
    console.log('=== 大数据中心数据汇聚情况周报系统 ===');
    console.log('系统启动中...\n');
    
    try {
      // 步骤1: 显示加载状态
      LoadingIndicator.show('正在初始化系统...');
      
      // 步骤2: 验证依赖库
      if (!this.verifyLibraries()) {
        throw new Error('依赖库加载失败，请检查D3.js和d3-sankey是否正确加载');
      }
      
      // 步骤3: 初始化模块
      LoadingIndicator.updateMessage('正在初始化模块...');
      if (!this.initModules()) {
        throw new Error('模块初始化失败');
      }
      
      // 步骤4: 并行加载数据
      LoadingIndicator.updateMessage('正在加载数据...');
      const loadSuccess = await this.loadData();
      if (!loadSuccess) {
        throw new Error('数据加载失败');
      }
      
      // 步骤5-6: 转换数据并计算推送状态统计
      LoadingIndicator.updateMessage('正在转换数据...');
      if (!this.transformData()) {
        throw new Error('数据转换失败');
      }
      
      // 步骤7-8: 渲染组件
      LoadingIndicator.updateMessage('正在渲染页面...');
      if (!this.renderComponents()) {
        throw new Error('页面渲染失败');
      }
      
      // 步骤9: 初始化交互
      LoadingIndicator.updateMessage('正在初始化交互...');
      if (!this.bindInteractions()) {
        throw new Error('交互初始化失败');
      }
      
      // 步骤10: 移除加载状态
      console.log('隐藏加载指示器...');
      LoadingIndicator.forceHide();
      console.log('✓ 加载指示器已隐藏');
      
      const endTime = performance.now();
      this.performanceMetrics.totalEndTime = endTime;
      const totalTime = (endTime - startTime).toFixed(2);
      
      console.log('\n✓ 系统启动完成');
      console.log(`✓ 总启动耗时：${totalTime}ms`);
      console.log('===========================================\n');
      
      // 输出性能摘要
      this.outputPerformanceSummary();
      
      // 运行性能验证测试
      this.runPerformanceTests();
      
    } catch (error) {
      console.error('✗ 系统启动失败:', error);
      ErrorHandler.handle(error, 'startup');
      LoadingIndicator.forceHide();
    }
  }
  
  /**
   * 输出性能摘要
   */
  outputPerformanceSummary() {
    console.log('=== 性能摘要 ===');
    
    if (this.performanceMetrics.dataLoadStart && this.performanceMetrics.dataLoadEnd) {
      const loadTime = (this.performanceMetrics.dataLoadEnd - this.performanceMetrics.dataLoadStart).toFixed(2);
      console.log(`数据加载：${loadTime}ms`);
    }
    
    if (this.performanceMetrics.renderStart && this.performanceMetrics.renderEnd) {
      const renderTime = (this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart).toFixed(2);
      console.log(`页面渲染：${renderTime}ms`);
    }
    
    if (this.performanceMetrics.interactionStart && this.performanceMetrics.interactionEnd) {
      const interactionTime = (this.performanceMetrics.interactionEnd - this.performanceMetrics.interactionStart).toFixed(2);
      console.log(`交互初始化：${interactionTime}ms`);
    }
    
    console.log('\n性能目标：');
    console.log(`  桑基图渲染：< ${this.config.performance.renderTimeout}ms`);
    console.log(`  交互响应：< ${this.config.performance.interactionTimeout}ms`);
    console.log('================\n');
  }
  
  /**
   * 清除缓存数据
   */
  clearCache() {
    console.log('清除数据缓存...');
    this.dataCache = {
      summary: null,
      detail: null,
      sankeyData: null,
      stats: null,
      statusStats: null,
      timestamp: null
    };
    console.log('✓ 缓存已清除');
  }
  
  /**
   * 重新加载数据
   */
  async reload() {
    console.log('重新加载数据...');
    this.clearCache();
    await this.start();
  }
  
  /**
   * 验证依赖库是否加载
   */
  verifyLibraries() {
    let allLoaded = true;
    
    // 检查D3.js是否加载
    if (typeof d3 !== 'undefined') {
      console.log('✓ D3.js v' + d3.version + ' 已加载');
    } else {
      console.error('✗ D3.js 加载失败');
      allLoaded = false;
    }
    
    // 检查d3-sankey是否加载
    if (typeof d3.sankey !== 'undefined') {
      console.log('✓ d3-sankey 已加载');
    } else {
      console.error('✗ d3-sankey 加载失败');
      allLoaded = false;
    }
    
    return allLoaded;
  }
  
  /**
   * 运行性能验证测试
   */
  runPerformanceTests() {
    // 检查性能验证器是否可用
    if (!this.performanceValidator) {
      console.warn('⚠️ 性能验证器不可用，跳过性能测试');
      return null;
    }
    
    // 获取部门数量
    const departmentCount = this.dataCache.summary ? 
      new Set(this.dataCache.summary.map(row => row['部门名称'])).size : 0;
    
    // 运行所有测试
    const allPassed = this.performanceValidator.runAllTests(
      this.performanceMetrics,
      departmentCount
    );
    
    // 获取测试摘要
    const summary = this.performanceValidator.getSummary();
    
    if (allPassed) {
      console.log('🎉 所有性能测试通过！');
    } else {
      console.warn(`⚠️ ${summary.failed}个测试未通过，请检查性能优化`);
    }
    
    return summary;
  }
}

// ==================== 应用程序启动 ====================

// 等待DOM加载完成后启动应用程序
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new Application(AppConfig);
    app.start();
  });
} else {
  // DOM已经加载完成，直接启动
  const app = new Application(AppConfig);
  app.start();
}
