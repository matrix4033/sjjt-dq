# 桑基图渲染模块实现文档

## 概述

桑基图渲染模块 (SankeyRenderer) 已完成实现，提供了完整的桑基图可视化功能，包括节点渲染、连接线渲染、层级标签、动画效果和响应式支持。

## 实现的功能

### 1. SankeyRenderer 类基础结构 ✓

**实现内容：**
- SVG容器创建和初始化
- 配置参数管理（宽度、高度、节点宽度、节点间距）
- 四种渐变色定义（部门蓝色、前置机绿色、前置仓橙色、贴源层紫色）
- `getNodeGradient()` 方法：根据节点类型返回对应的渐变色
- `getLinkColor()` 方法：根据源节点类型返回连接线颜色

**渐变色配置：**
```javascript
colors: {
  department: ["#1890ff", "#096dd9"],  // 蓝色渐变
  server: ["#52c41a", "#389e0d"],      // 绿色渐变
  warehouse: ["#fa8c16", "#d46b08"],   // 橙色渐变
  source: ["#722ed1", "#531dab"]       // 紫色渐变
}
```

### 2. 节点渲染功能 ✓

**实现内容：**
- `renderNodes()` 方法：渲染所有节点
- 节点矩形渲染，应用渐变色填充和白色边框
- 节点标签渲染（显示部门名称或层级名称）
- 为非部门节点添加表数量显示
- 节点高度自动与流量成正比（由d3-sankey布局算法计算）
- 部门节点设置为可点击（cursor: pointer）

**特性：**
- 节点标签智能定位（左侧节点标签在右边，右侧节点标签在左边）
- 非部门节点在中心显示表数量值
- 所有文本设置 `pointer-events: none` 避免干扰交互

### 3. 连接线渲染功能 ✓

**实现内容：**
- `renderLinks()` 方法：使用 d3-sankey 的 link 生成器渲染连接线
- 连接线颜色与源节点类型一致
- 连接线默认透明度为 0.4
- 连接线宽度表示表数量（由d3-sankey自动计算）
- 连接线设置为可点击（cursor: pointer）

**数据属性：**
- `data-source`: 源节点名称
- `data-target`: 目标节点名称
- `data-value`: 流量值

### 4. 层级标签渲染 ✓

**实现内容：**
- `renderLayerLabels()` 方法：在四个层级位置添加标签
- 标签内容：部门层、前置机层、前置仓层、贴源层
- 标签字体大小：14px
- 标签位置：根据桑基图宽度自动计算

**标签位置：**
- 部门层：左侧边距位置
- 前置机层：宽度的 33% 位置
- 前置仓层：宽度的 66% 位置
- 贴源层：右侧边距位置

### 5. 渐入动画 ✓

**实现内容：**
- `addNodeAnimation()` 方法：为节点添加延迟渐入动画
- `addLinkAnimation()` 方法：为连接线添加延迟渐入动画
- 节点动画：500ms 持续时间，每个节点延迟 50ms
- 连接线动画：500ms 持续时间，每个连接线延迟 30ms
- 总渲染时间控制在 500ms 内完成

**动画效果：**
- 节点从透明（opacity: 0）渐变到不透明（opacity: 1）
- 连接线从透明渐变到配置的透明度（0.4）
- 节点和连接线依次出现，形成流畅的视觉效果

### 6. 响应式桑基图 ✓

**实现内容：**
- `ResponsiveSankeyRenderer` 类：继承自 SankeyRenderer
- `resize()` 方法：监听窗口大小变化并重新渲染
- `calculateHeight()` 方法：根据宽度计算合适的高度
- 防抖处理：resize 事件使用 300ms 防抖
- `destroy()` 方法：清理事件监听器和DOM元素

**响应式规则：**
- 宽度 >= 1200px：高度 600px
- 宽度 >= 768px：高度 500px
- 宽度 < 768px：高度 400px

## 主要方法

### render(data)
主渲染方法，接收包含 nodes 和 links 的数据对象，完成整个桑基图的渲染。

**渲染流程：**
1. 清除之前的内容（保留 defs 定义）
2. 配置 d3-sankey 布局参数
3. 计算节点和连接位置
4. 渲染层级标签
5. 渲染连接线（在节点下方）
6. 渲染节点
7. 添加渐入动画

### update(data)
更新桑基图数据，内部调用 render() 方法。

### highlightNode(nodeId)
高亮指定节点，为节点添加蓝色边框（2px）。

### clearHighlight()
清除所有节点的高亮效果。

## 使用示例

### 基本使用

```javascript
// 创建桑基图渲染器
const renderer = new SankeyRenderer('sankey-container', {
  width: 1200,
  height: 600,
  nodeWidth: 20,
  nodePadding: 30
});

// 准备数据
const data = {
  nodes: [
    { id: "部门_交通运输厅", name: "交通运输厅", layer: 0, type: "department" },
    { id: "前置机", name: "前置机", layer: 1, type: "server" },
    { id: "前置仓", name: "前置仓", layer: 2, type: "warehouse" },
    { id: "贴源层", name: "贴源层", layer: 3, type: "source" }
  ],
  links: [
    { source: "部门_交通运输厅", target: "前置机", value: 30 },
    { source: "前置机", target: "前置仓", value: 30 },
    { source: "前置仓", target: "贴源层", value: 30 }
  ]
};

// 渲染桑基图
renderer.render(data);
```

### 响应式使用

```javascript
// 创建响应式桑基图渲染器
const renderer = new ResponsiveSankeyRenderer('sankey-container', {
  width: 1200,
  height: 600
});

// 渲染桑基图
renderer.render(data);

// 窗口大小变化时会自动重新渲染

// 销毁渲染器（清理事件监听器）
renderer.destroy();
```

### 节点高亮

```javascript
// 高亮指定节点
renderer.highlightNode('部门_交通运输厅');

// 清除高亮
renderer.clearHighlight();
```

## 配置选项

```javascript
{
  width: 1200,              // 桑基图宽度
  height: 600,              // 桑基图高度
  nodeWidth: 20,            // 节点宽度
  nodePadding: 30,          // 节点间距
  colors: {                 // 颜色配置
    department: ["#1890ff", "#096dd9"],
    server: ["#52c41a", "#389e0d"],
    warehouse: ["#fa8c16", "#d46b08"],
    source: ["#722ed1", "#531dab"]
  },
  linkOpacity: 0.4,         // 连接线默认透明度
  linkOpacityHover: 0.8     // 连接线悬停透明度（预留）
}
```

## 数据格式

### 节点数据格式

```javascript
{
  id: "部门_交通运输厅",      // 唯一标识
  name: "交通运输厅",          // 显示名称
  layer: 0,                   // 层级（0-3）
  type: "department",         // 类型：department/server/warehouse/source
  metadata: {                 // 可选的元数据
    departmentTableCount: 30,
    serverTableCount: 8,
    // ...
  }
}
```

### 连接线数据格式

```javascript
{
  source: "部门_交通运输厅",   // 源节点ID
  target: "前置机",            // 目标节点ID
  value: 30,                  // 流量值（表数量）
  department: "交通运输厅",    // 可选：所属部门
  metadata: {                 // 可选的元数据
    tableCount: 30,
    dataVolume: 10000
  }
}
```

## 依赖项

- **D3.js v7**: 核心可视化库
- **d3-sankey**: 桑基图布局算法库

## 测试

运行测试文件 `test-sankey-renderer.html` 可以验证所有功能：

1. 在浏览器中打开 `test-sankey-renderer.html`
2. 查看桑基图是否正确渲染
3. 观察节点和连接线的渐入动画
4. 调整浏览器窗口大小测试响应式功能
5. 查看控制台输出的测试结果

## 性能优化

- 使用 D3.js 的高效 DOM 操作
- 动画使用 CSS transition 实现硬件加速
- 响应式 resize 事件使用 300ms 防抖
- 清除旧内容时保留 defs 定义避免重复创建

## 已知限制

1. 节点标签可能在节点过多时重叠（可通过调整 nodePadding 解决）
2. 连接线悬停透明度变化需要在交互模块中实现
3. 触摸设备优化需要在交互模块中实现

## 下一步

桑基图渲染模块已完成，接下来需要实现：
- 任务 6：交互处理模块（悬浮提示框、点击事件）
- 任务 7：明细列表渲染模块
- 任务 8：页面整体布局和样式
- 任务 9：主程序入口和配置

## 相关文件

- `js/sankey-renderer.js` - 桑基图渲染器实现
- `test-sankey-renderer.html` - 测试文件
- `.kiro/specs/sankey-data-visualization/design.md` - 设计文档
- `.kiro/specs/sankey-data-visualization/requirements.md` - 需求文档

