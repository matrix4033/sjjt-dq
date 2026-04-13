# 设计文档

## 概述

本文档描述大数据中心数据汇聚情况周报可视化系统的技术设计。该系统采用暗黑科技风格，通过桑基图全屏展示数据从部门经前置机、前置仓最终到贴源层的四层流转情况，使用高饱和多色渐变流线在深色背景上形成强烈视觉对比。用户可以通过点击连接线弹出明细数据窗口查看表级详细信息。

## 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器环境                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    index.html                         │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  页面标题                                        │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │  整体汇聚情况区域（4个指标卡片）                │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │  桑基图区域（全屏展示，占据85%+屏幕高度）      │  │   │
│  │  │  ├─ 部门层节点                                  │  │   │
│  │  │  ├─ 前置机层节点                                │  │   │
│  │  │  ├─ 前置仓层节点                                │  │   │
│  │  │  ├─ 贴源层节点                                  │  │   │
│  │  │  ├─ 连接线（高饱和多色渐变）                    │  │   │
│  │  │  ├─ 悬浮提示框                                  │  │   │
│  │  │  └─ 颜色图例                                    │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  明细数据弹窗（点击连接线时弹出）                │  │   │
│  │  │  ├─ 弹窗标题（流转环节名称）                    │  │   │
│  │  │  ├─ 关闭按钮                                    │  │   │
│  │  │  └─ 明细数据表格                                │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    JavaScript模块                     │   │
│  │  ├─ data-loader.js（数据加载）                       │   │
│  │  ├─ data-transformer.js（数据转换）                  │   │
│  │  ├─ sankey-renderer.js（桑基图渲染）                 │   │
│  │  ├─ interaction-handler.js（交互处理）               │   │
│  │  ├─ modal-renderer.js（弹窗渲染）                    │   │
│  │  └─ main.js（主控制器）                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    数据文件                           │   │
│  │  ├─ data/汇总.csv                                     │   │
│  │  └─ data/明细.csv                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    第三方库                           │   │
│  │  ├─ d3.v7.min.js（D3.js核心库）                       │   │
│  │  └─ d3-sankey-master/dist/d3-sankey.min.js           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **前端框架**：原生JavaScript（ES6+）
- **可视化库**：D3.js v7 + d3-sankey
- **样式**：CSS3（暗黑科技风格）
- **数据格式**：CSV
- **浏览器兼容性**：Chrome 90+, Firefox 88+, Edge 90+

## 组件设计

### 1. 数据加载模块（data-loader.js）

**职责**：异步加载CSV数据文件

**接口设计**：
```javascript
class DataLoader {
  /**
   * 加载汇总数据
   * @returns {Promise<Array>} 汇总数据数组
   */
  async loadSummaryData()
  
  /**
   * 加载明细数据
   * @returns {Promise<Array>} 明细数据数组
   */
  async loadDetailData()
  
  /**
   * 解析CSV文本
   * @param {string} csvText - CSV文本内容
   * @returns {Array} 解析后的数据数组
   */
  parseCSV(csvText)
}
```

**实现要点**：
- 使用fetch API异步读取CSV文件
- 正确处理中文字符编码（支持UTF-8和GB2312）
- 使用TextDecoder自动检测编码或尝试多种编码
- 处理CSV中的特殊字符（逗号、换行符）
- 提供友好的错误提示信息
- 显示加载状态指示器

**编码处理示例**：
```javascript
async loadCSV(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  // 尝试UTF-8解码
  try {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    // 检查是否有乱码
    if (!text.includes('�')) {
      return text;
    }
  } catch (e) {
    console.warn('UTF-8解码失败，尝试GB2312');
  }
  
  // 尝试GB2312解码
  try {
    const decoder = new TextDecoder('gb2312');
    const text = decoder.decode(buffer);
    return text;
  } catch (e) {
    throw new Error('无法解码CSV文件，请检查文件编码');
  }
}
```


### 2. 数据转换模块（data-transformer.js）

**职责**：将CSV数据转换为桑基图所需的节点和连接线数据结构

**接口设计**：
```javascript
class DataTransformer {
  /**
   * 转换汇总数据为桑基图数据结构
   * @param {Array} summaryData - 汇总数据数组
   * @param {Array} detailData - 明细数据数组
   * @returns {Object} {nodes: Array, links: Array}
   */
  transformToSankeyData(summaryData, detailData)
  
  /**
   * 计算推送状态统计
   * @param {Array} detailData - 明细数据数组
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节（'dept-to-front', 'front-to-warehouse', 'warehouse-to-source'）
   * @returns {Object} {normal: number, abnormal: number, unpushed: number, total: number}
   */
  calculateStatusStats(detailData, department, stage)
  
  /**
   * 为部门分配专属色系
   * @param {number} index - 部门索引
   * @param {number} total - 部门总数
   * @returns {string} 高饱和色彩（如#00D9FF）
   */
  assignDepartmentColor(index, total)
}
```

**数据结构设计**：

**节点数据结构**：
```javascript
{
  name: string,        // 节点名称（如"人力资源社会保障厅"、"172.21.143.143"、"前置仓"、"贴源层"）
  layer: number,       // 节点层级（0-部门层, 1-前置机层, 2-前置仓层, 3-贴源层）
  value: number,       // 节点流量值（表数量）
  color: string,       // 节点颜色（高饱和渐变色）
  department: string   // 所属部门（仅部门节点有此字段）
}
```

**连接线数据结构**：
```javascript
{
  source: number,      // 源节点索引
  target: number,      // 目标节点索引
  value: number,       // 连接线流量值（表数量）
  department: string,  // 所属部门
  stage: string,       // 流转环节（'dept-to-front', 'front-to-warehouse', 'warehouse-to-source'）
  color: string,       // 连接线基础色（高饱和色彩）
  statusStats: {       // 推送状态统计
    normal: number,
    abnormal: number,
    unpushed: number,
    total: number
  }
}
```

**实现要点**：
- 按表数量降序排列部门节点
- 为每个部门分配专属色系（使用HSL色彩空间均匀分布）
- 计算每个流转环节的推送状态统计
- 根据推送状态占比叠加警示色调（异常>30%叠加红色，未推送>50%叠加灰色）
- 确保连接线最小宽度为2像素


### 3. 桑基图渲染模块（sankey-renderer.js）

**职责**：使用D3.js和d3-sankey渲染桑基图

**接口设计**：
```javascript
class SankeyRenderer {
  /**
   * 初始化桑基图
   * @param {string} containerId - 容器DOM元素ID
   * @param {Object} data - 桑基图数据{nodes, links}
   * @param {Object} config - 配置参数
   */
  init(containerId, data, config)
  
  /**
   * 渲染节点
   * @param {Array} nodes - 节点数据数组
   */
  renderNodes(nodes)
  
  /**
   * 渲染连接线
   * @param {Array} links - 连接线数据数组
   */
  renderLinks(links)
  
  /**
   * 渲染节点标签
   * @param {Array} nodes - 节点数据数组
   */
  renderNodeLabels(nodes)
  
  /**
   * 渲染颜色图例
   */
  renderLegend()
  
  /**
   * 更新桑基图布局
   */
  updateLayout()
}
```

**配置参数**：
```javascript
{
  width: 'calc(100vw - 40px)',     // SVG宽度
  height: 'calc(100vh - 250px)',   // SVG高度
  nodeWidth: 20,                    // 节点宽度
  nodePadding: 20,                  // 节点间距
  linkOpacity: 0.6,                 // 连接线默认不透明度
  linkHoverOpacity: 0.9,            // 连接线悬停不透明度
  nodeColors: {                     // 节点颜色配置
    department: ['#00D9FF', '#0099FF'],
    frontMachine: ['#00FF88', '#00CC66'],
    warehouse: ['#FF9500', '#FF6600'],
    source: ['#AA00FF', '#7700CC']
  }
}
```

**实现要点**：
- 使用d3.sankey()创建桑基图布局
- 设置节点宽度为20像素，节点间距为20像素
- 使用SVG linearGradient定义节点渐变色（垂直方向）
- 使用SVG linearGradient定义连接线渐变色（水平方向）
- 为节点添加发光效果（filter: drop-shadow）
- 为连接线添加data-status-distribution属性存储推送状态统计
- 确保连接线最小宽度为2像素
- 在节点右侧或左侧显示节点标签（根据节点位置）
- 在前置机、前置仓、贴源层节点内部居中显示表数量数值


### 4. 交互处理模块（interaction-handler.js）

**职责**：处理用户交互事件（悬停、点击）

**接口设计**：
```javascript
class InteractionHandler {
  /**
   * 初始化交互事件监听
   * @param {Object} sankeyRenderer - 桑基图渲染器实例
   * @param {Object} modalRenderer - 弹窗渲染器实例
   */
  init(sankeyRenderer, modalRenderer)
  
  /**
   * 处理节点悬停事件
   * @param {Object} node - 节点数据
   * @param {Event} event - 鼠标事件
   */
  handleNodeHover(node, event)
  
  /**
   * 处理连接线悬停事件
   * @param {Object} link - 连接线数据
   * @param {Event} event - 鼠标事件
   */
  handleLinkHover(link, event)
  
  /**
   * 处理部门节点点击事件
   * @param {Object} node - 节点数据
   */
  handleDepartmentNodeClick(node)
  
  /**
   * 处理连接线点击事件
   * @param {Object} link - 连接线数据
   */
  handleLinkClick(link)
  
  /**
   * 显示悬浮提示框
   * @param {Object} data - 提示框数据
   * @param {Event} event - 鼠标事件
   */
  showTooltip(data, event)
  
  /**
   * 隐藏悬浮提示框
   */
  hideTooltip()
  
  /**
   * 高亮部门数据流路径
   * @param {string} department - 部门名称
   */
  highlightDepartmentPath(department)
  
  /**
   * 取消高亮
   */
  clearHighlight()
}
```

**悬浮提示框数据结构**：

**部门节点悬浮提示框**：
```javascript
{
  type: 'department',
  name: string,              // 部门名称
  totalTables: number,       // 总表数量
  frontMachineIP: string,    // 前置机IP地址
  flowProgress: {            // 数据流转进度
    dept: number,
    front: number,
    warehouse: number,
    source: number
  },
  statusSummary: {           // 推送状态汇总
    deptToFront: {normal, abnormal, unpushed},
    frontToWarehouse: {normal, abnormal, unpushed},
    warehouseToSource: {normal, abnormal, unpushed}
  },
  completionRate: number     // 数据完整率
}
```

**连接线悬浮提示框**：
```javascript
{
  type: 'link',
  stageName: string,         // 流转环节名称（如"人力资源社会保障厅 → 172.21.143.143"）
  totalTables: number,       // 总表数量
  statusStats: {             // 推送状态统计
    normal: {count, percentage},
    abnormal: {count, percentage},
    unpushed: {count, percentage}
  },
  hint: '点击查看明细'
}
```

**实现要点**：
- 使用200毫秒延迟显示悬浮提示框
- 悬浮提示框跟随鼠标位置
- 使用千分位分隔符格式化数值
- 使用水平进度条可视化推送状态占比
- 连接线悬停时增强发光效果并高亮源节点和目标节点
- 部门节点点击时高亮该部门的完整数据流路径
- 连接线点击时打开明细数据弹窗


### 5. 弹窗渲染模块（modal-renderer.js）

**职责**：渲染明细数据弹窗

**接口设计**：
```javascript
class ModalRenderer {
  /**
   * 打开明细数据弹窗
   * @param {Object} link - 连接线数据
   * @param {Array} detailData - 明细数据数组
   */
  openModal(link, detailData)
  
  /**
   * 关闭明细数据弹窗
   */
  closeModal()
  
  /**
   * 渲染弹窗内容
   * @param {Object} link - 连接线数据
   * @param {Array} filteredData - 筛选后的明细数据
   */
  renderModalContent(link, filteredData)
  
  /**
   * 筛选明细数据
   * @param {Array} detailData - 明细数据数组
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节
   * @returns {Array} 筛选后的明细数据
   */
  filterDetailData(detailData, department, stage)
}
```

**弹窗HTML结构**：
```html
<div class="modal-overlay">
  <div class="modal-container">
    <div class="modal-header">
      <h3 class="modal-title">流转环节名称</h3>
      <div class="modal-stats">
        <span>总表数量：<strong>156</strong></span>
        <span class="status-normal">正常：<strong>120 (76.9%)</strong></span>
        <span class="status-abnormal">异常：<strong>20 (12.8%)</strong></span>
        <span class="status-unpushed">未推送：<strong>16 (10.3%)</strong></span>
      </div>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      <table class="detail-table">
        <thead>
          <tr>
            <th>部门</th>
            <th>表中文名</th>
            <th>表英文名</th>
            <th>推送状态</th>
            <th>异常原因说明</th>
          </tr>
        </thead>
        <tbody>
          <!-- 动态生成表格行 -->
        </tbody>
      </table>
    </div>
  </div>
</div>
```

**实现要点**：
- 弹窗宽度为视口宽度的80%（最大1200px），高度为视口高度的70%（最大800px）
- 使用半透明黑色遮罩层（background: rgba(0, 0, 0, 0.7)）
- 弹窗添加淡入淡出动画（持续时间300毫秒）
- 根据点击的连接线筛选对应部门和流转环节的表记录
- 突出显示对应流转环节的推送状态列
- 表格支持垂直滚动
- 点击遮罩层、关闭按钮或按下Esc键关闭弹窗
- 使用暗黑风格斑马纹样式
- 推送状态使用颜色编码（正常-绿色、异常-红色、未推送-灰色）


### 6. 主控制器模块（main.js）

**职责**：协调各模块，控制整体流程

**接口设计**：
```javascript
class MainController {
  /**
   * 初始化应用
   */
  async init()
  
  /**
   * 加载数据
   */
  async loadData()
  
  /**
   * 渲染整体汇聚情况区域
   * @param {Array} summaryData - 汇总数据数组
   */
  renderOverviewPanel(summaryData)
  
  /**
   * 渲染桑基图
   * @param {Object} sankeyData - 桑基图数据{nodes, links}
   */
  renderSankey(sankeyData)
  
  /**
   * 初始化交互
   */
  initInteractions()
  
  /**
   * 处理错误
   * @param {Error} error - 错误对象
   */
  handleError(error)
}
```

**应用初始化流程**：
```
1. 显示加载状态指示器
2. 异步加载汇总数据和明细数据
3. 转换数据为桑基图数据结构
4. 计算推送状态统计
5. 渲染整体汇聚情况区域
6. 渲染桑基图
7. 初始化交互事件监听
8. 移除加载状态指示器
9. 错误处理（如果发生错误）
```

**实现要点**：
- 使用async/await处理异步操作
- 提供友好的错误提示信息
- 确保在500毫秒内完成桑基图渲染
- 在控制台输出调试信息（推送状态统计）

## 数据模型

### 汇总数据模型

```javascript
{
  部门名称: string,      // 如"人力资源社会保障厅"
  部门表数量: number,    // 如156
  前置机名称: string,    // 如"172.21.143.143"
  前置机表数量: number,  // 如156
  前置仓名称: string,    // 固定为"前置仓"
  前置仓表数量: number,  // 如156
  贴源层名称: string,    // 固定为"贴源层"
  贴源层表数量: number   // 如156
}
```

### 明细数据模型

```javascript
{
  部门: string,                    // 如"人力资源社会保障厅"
  表中文名: string,                // 如"AA10代码表"
  表英文名: string,                // 如"scsb_resident_frame01_aa10"
  部门到前置机状态: string,        // "正常"、"异常"或"未推送"
  异常原因说明1: string,           // 对应部门到前置机的异常原因
  前置机到前置仓状态: string,      // "正常"、"异常"或"未推送"
  异常原因说明2: string,           // 对应前置机到前置仓的异常原因
  前置仓到贴源层状态: string,      // "正常"、"异常"或"未推送"
  异常原因说明3: string            // 对应前置仓到贴源层的异常原因
}
```


## 界面设计

### 暗黑科技风格设计规范

**颜色体系**：
```css
/* 背景色 */
--page-background: linear-gradient(180deg, #121212 0%, #0f0f0f 100%);
--container-background: rgba(20, 20, 20, 0.9);
--modal-background: rgba(20, 20, 20, 0.95);
--overlay-background: rgba(0, 0, 0, 0.7);

/* 边框色 */
--border-color: #444444;

/* 文字色 */
--text-primary: #FFFFFF;
--text-secondary: #CCCCCC;

/* 节点颜色（高饱和渐变） */
--dept-color-start: #00D9FF;
--dept-color-end: #0099FF;
--front-color-start: #00FF88;
--front-color-end: #00CC66;
--warehouse-color-start: #FF9500;
--warehouse-color-end: #FF6600;
--source-color-start: #AA00FF;
--source-color-end: #7700CC;

/* 推送状态颜色 */
--status-normal: #00FF88;
--status-abnormal: #FF4444;
--status-unpushed: #AAAAAA;

/* 阴影效果 */
--shadow-light: 0 4px 12px rgba(0, 0, 0, 0.6);
--shadow-strong: 0 8px 32px rgba(0, 0, 0, 0.8);
```

**字体规范**：
```css
/* 页面标题 */
font-size: 28px;
font-weight: bold;
color: #FFFFFF;
text-shadow: 0 0 12px rgba(0, 217, 255, 0.6);

/* 指标卡片数值 */
font-size: 36px;
font-weight: bold;
color: #FFFFFF;
text-shadow: 0 0 8px rgba(对应图标颜色, 0.6);

/* 指标卡片名称 */
font-size: 14px;
color: #CCCCCC;

/* 节点标签 */
font-size: 14px;
color: #FFFFFF;
text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);

/* 节点内部数值 */
font-size: 12px;
font-weight: bold;
color: #FFFFFF;

/* 悬浮提示框标题 */
font-size: 14px;
font-weight: 600;
color: #FFFFFF;

/* 悬浮提示框内容 */
font-size: 12px;
color: #FFFFFF;

/* 表格表头 */
font-size: 14px;
font-weight: bold;
color: #FFFFFF;

/* 表格数据 */
font-size: 12px;
color: #FFFFFF;
```

**动画规范**：
```css
/* 淡入动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 淡出动画 */
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 过渡动画 */
transition: all 300ms ease-in-out;

/* 悬浮提示框淡入 */
animation: fadeIn 200ms ease-in-out;

/* 弹窗淡入淡出 */
animation: fadeIn 300ms ease-in-out;
```


### 页面布局设计

**整体布局**：
```
┌─────────────────────────────────────────────────────────────┐
│  页面标题（居中，28px，发光效果）                              │
├─────────────────────────────────────────────────────────────┤
│  整体汇聚情况区域（4个指标卡片，横向排列）                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 总部门数 │ │ 总表数量 │ │已汇聚表量│ │ 完成率   │       │
│  │  [图标]  │ │  [图标]  │ │  [图标]  │ │  [图标]  │       │
│  │   44     │ │  1,234   │ │  1,100   │ │  89.1%   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  桑基图区域（全屏展示，calc(100vh - 250px)）                  │
│                                                               │
│  部门层    前置机层    前置仓层    贴源层                      │
│  ┌────┐   ┌────┐     ┌────┐     ┌────┐                     │
│  │部门1│───│前置机│─────│前置仓│─────│贴源层│                │
│  └────┘   └────┘     └────┘     └────┘                     │
│  ┌────┐   ┌────┐                                            │
│  │部门2│───│前置机│─────┘                                    │
│  └────┘   └────┘                                            │
│  ...                                                          │
│                                                               │
│  [颜色图例]                              [缩放控制按钮]       │
└─────────────────────────────────────────────────────────────┘
```

**指标卡片设计**：
```
┌──────────────────────────┐
│  [图标]                   │  ← 高饱和色彩图标（36px）
│                           │
│  1,234                    │  ← 数值（36px，白色，发光效果）
│                           │
│  总表数量                 │  ← 名称（14px，浅灰色）
└──────────────────────────┘
  宽度：至少200px
  高度：至少120px
  背景：rgba(30, 30, 30, 0.9)
  边框：1px solid #444444
  圆角：8px
  阴影：0 4px 12px rgba(0, 0, 0, 0.6)
```

**悬浮提示框设计**：
```
┌──────────────────────────────────────┐
│  人力资源社会保障厅                   │  ← 标题（14px，白色）
├──────────────────────────────────────┤
│  总表数量：156                        │
│  前置机IP：172.21.143.143             │
│                                       │
│  数据流转进度：                       │
│  ┌────────────────────────────────┐  │
│  │ 156 → 156 → 156 → 150          │  │  ← 进度条
│  └────────────────────────────────┘  │
│                                       │
│  推送状态汇总：                       │
│  部门→前置机：正常120 异常20 未推送16 │
│  前置机→前置仓：正常130 异常10 未推送16│
│  前置仓→贴源层：正常140 异常6 未推送10 │
│                                       │
│  数据完整率：96.2%                    │
└──────────────────────────────────────┘
  背景：rgba(30, 30, 30, 0.9)
  边框：1px solid #444444
  圆角：6px
  阴影：0 4px 12px rgba(0, 0, 0, 0.6)
  动画：fadeIn 200ms
```

**明细数据弹窗设计**：
```
┌─────────────────────────────────────────────────────────────┐
│  人力资源社会保障厅 → 172.21.143.143              [×]        │  ← 标题栏
│  总表数量：156  正常：120 (76.9%)  异常：20 (12.8%)  未推送：16 (10.3%)
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 部门 │ 表中文名 │ 表英文名 │ 推送状态 │ 异常原因说明 │  │  ← 表头
│  ├───────────────────────────────────────────────────────┤  │
│  │ ... │ AA10代码表 │ scsb_... │ 未推送 │           │  │  ← 数据行
│  │ ... │ AC51(个人... │ scsb_... │ 正常   │           │  │
│  │ ... │ 专家证书   │ rlzy... │ 正常   │           │  │
│  │ ... │ ...        │ ...     │ ...    │ ...       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
  宽度：80vw（最大1200px）
  高度：70vh（最大800px）
  背景：rgba(20, 20, 20, 0.95)
  边框：1px solid #444444
  圆角：12px
  阴影：0 8px 32px rgba(0, 0, 0, 0.8)
  遮罩层：rgba(0, 0, 0, 0.7)
  动画：fadeIn 300ms
```


## 错误处理策略

### 数据加载错误

**错误类型**：
1. 文件不存在（404）
2. 文件格式错误
3. 网络错误
4. 编码错误

**处理策略**：
```javascript
try {
  const response = await fetch('data/汇总.csv');
  if (!response.ok) {
    throw new Error(`文件加载失败：${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  const data = this.parseCSV(text);
  return data;
} catch (error) {
  console.error('数据加载错误：', error);
  this.showErrorMessage(`数据加载失败：${error.message}`);
  throw error;
}
```

**错误提示UI**：
```html
<div class="error-message">
  <div class="error-icon">⚠️</div>
  <div class="error-title">数据加载失败</div>
  <div class="error-detail">文件不存在或格式错误，请检查data目录下的CSV文件</div>
  <button class="error-retry">重试</button>
</div>
```

### 数据解析错误

**错误类型**：
1. CSV格式不正确
2. 字段缺失
3. 数据类型错误

**处理策略**：
```javascript
parseCSV(csvText) {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV文件为空或格式不正确');
    }
    
    const headers = lines[0].split(',');
    const requiredHeaders = ['部门名称', '部门表数量', '前置机名称', '前置机表数量'];
    
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        throw new Error(`缺少必需字段：${header}`);
      }
    }
    
    // 解析数据行...
    
  } catch (error) {
    console.error('CSV解析错误：', error);
    this.showErrorMessage(`数据解析失败：${error.message}`);
    throw error;
  }
}
```

### 渲染错误

**错误类型**：
1. DOM元素不存在
2. D3.js渲染错误
3. 数据结构不正确

**处理策略**：
```javascript
try {
  const container = document.getElementById('sankey-container');
  if (!container) {
    throw new Error('桑基图容器不存在');
  }
  
  // 渲染桑基图...
  
} catch (error) {
  console.error('渲染错误：', error);
  this.showErrorMessage(`渲染失败：${error.message}`);
}
```

## 性能优化策略

### 数据加载优化

1. **并行加载**：同时加载汇总数据和明细数据
```javascript
const [summaryData, detailData] = await Promise.all([
  dataLoader.loadSummaryData(),
  dataLoader.loadDetailData()
]);
```

2. **缓存数据**：避免重复加载
```javascript
class DataLoader {
  constructor() {
    this.cache = {
      summaryData: null,
      detailData: null
    };
  }
  
  async loadSummaryData() {
    if (this.cache.summaryData) {
      return this.cache.summaryData;
    }
    const data = await this.fetchAndParse('data/汇总.csv');
    this.cache.summaryData = data;
    return data;
  }
}
```

### 渲染性能优化

1. **虚拟滚动**：明细数据弹窗表格使用虚拟滚动（如果数据量超过1000条）

2. **节流与防抖**：
```javascript
// 悬停事件使用防抖
const debouncedShowTooltip = debounce(this.showTooltip, 200);

// 滚动事件使用节流
const throttledScroll = throttle(this.handleScroll, 100);
```

3. **减少DOM操作**：批量更新DOM
```javascript
// 使用DocumentFragment批量插入表格行
const fragment = document.createDocumentFragment();
filteredData.forEach(row => {
  const tr = this.createTableRow(row);
  fragment.appendChild(tr);
});
tbody.appendChild(fragment);
```

4. **CSS硬件加速**：使用transform和opacity触发GPU加速
```css
.modal-container {
  transform: translateZ(0);
  will-change: transform, opacity;
}
```

### 内存优化

1. **及时清理事件监听器**：
```javascript
closeModal() {
  // 移除事件监听器
  document.removeEventListener('keydown', this.handleEscKey);
  overlay.removeEventListener('click', this.handleOverlayClick);
  
  // 清空DOM
  modalContainer.innerHTML = '';
  overlay.remove();
}
```

2. **避免内存泄漏**：
```javascript
// 使用WeakMap存储节点关联数据
const nodeDataMap = new WeakMap();
nodeDataMap.set(nodeElement, nodeData);
```


## 测试策略

### 单元测试

**测试框架**：Jest

**测试覆盖范围**：
1. DataLoader - CSV解析功能
2. DataTransformer - 数据转换功能
3. 推送状态统计计算
4. 颜色分配算法

**示例测试用例**：
```javascript
describe('DataTransformer', () => {
  test('应该正确计算推送状态统计', () => {
    const detailData = [
      {部门: '测试部门', 部门到前置机状态: '正常'},
      {部门: '测试部门', 部门到前置机状态: '异常'},
      {部门: '测试部门', 部门到前置机状态: '未推送'}
    ];
    
    const stats = transformer.calculateStatusStats(
      detailData, 
      '测试部门', 
      'dept-to-front'
    );
    
    expect(stats.normal).toBe(1);
    expect(stats.abnormal).toBe(1);
    expect(stats.unpushed).toBe(1);
    expect(stats.total).toBe(3);
  });
});
```

### 集成测试

**测试场景**：
1. 数据加载 → 数据转换 → 桑基图渲染
2. 用户点击连接线 → 打开明细数据弹窗 → 显示筛选后的数据
3. 用户点击部门节点 → 高亮数据流路径

### 端到端测试

**测试工具**：Playwright

**测试场景**：
1. 页面加载完成后，桑基图正确显示
2. 悬停在节点上，显示悬浮提示框
3. 点击连接线，打开明细数据弹窗
4. 点击部门节点，高亮数据流路径
5. 响应式布局在不同屏幕尺寸下正常工作

## 部署方案

### 静态文件部署

**文件结构**：
```
/
├── index.html
├── css/
│   └── main.css
├── js/
│   ├── data-loader.js
│   ├── data-transformer.js
│   ├── sankey-renderer.js
│   ├── interaction-handler.js
│   ├── modal-renderer.js
│   └── main.js
├── data/
│   ├── 汇总.csv
│   └── 明细.csv
├── lib/
│   ├── d3.v7.min.js
│   └── d3-sankey.min.js
└── README.md
```

**部署步骤**：
1. 将所有文件上传到Web服务器
2. 确保CSV文件编码为UTF-8或GB2312（系统会自动检测）
3. 配置Web服务器支持CORS（如果需要）
4. 访问index.html验证功能

### 浏览器兼容性

**支持的浏览器**：
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**不支持的浏览器**：
- IE 11及以下

**兼容性处理**：
- 使用Babel转译ES6+代码（如果需要支持旧浏览器）
- 使用Polyfill补充缺失的API

## 维护与扩展

### 数据更新

**更新流程**：
1. 更新data/汇总.csv和data/明细.csv文件
2. 刷新页面即可看到最新数据
3. 无需修改代码

**数据格式要求**：
- CSV文件支持UTF-8或GB2312编码
- 字段名称必须与设计文档一致
- 数据类型必须正确（数值字段不能包含非数字字符）
- 建议使用UTF-8编码以获得最佳兼容性

### 功能扩展

**可扩展点**：
1. 添加更多交互功能（如导出数据、打印报表）
2. 添加数据筛选功能（如按时间范围筛选）
3. 添加数据对比功能（如对比不同时间段的数据）
4. 添加数据钻取功能（如点击节点查看更详细的信息）

**扩展建议**：
- 保持模块化设计，新功能应该作为独立模块添加
- 遵循现有的代码风格和设计规范
- 添加单元测试和集成测试
- 更新文档说明新功能的使用方法

