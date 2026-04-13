# 交互处理模块实现文档

## 概述

交互处理模块 (InteractionHandler) 负责处理桑基图和列表的所有交互事件，包括悬停显示提示框、点击筛选数据等功能。

## 实现的功能

### 1. 悬浮提示框 (Tooltip)

#### 功能特性
- 智能定位算法，自动避免超出视口边界
- 支持多种数据类型的提示内容
- 平滑的显示/隐藏动画
- 数字千分位格式化显示

#### 提示框类型

**部门节点提示框**
- 显示部门名称
- 显示各层级的表数量和数据量：
  - 部门表数量
  - 前置机表数量和数据量
  - 前置仓表数量和数据量
  - 贴源层表数量和数据量

**其他节点提示框（前置机/前置仓/贴源层）**
- 显示节点名称
- 显示汇总表数量
- 显示汇总数据量

**连接线提示框**
- 显示源节点名称
- 显示目标节点名称
- 显示流量值（表数量）

### 2. 部门节点交互

#### 悬停效果
- 鼠标悬停时边框宽度从1px增加到2px
- 显示详细的部门数据提示框
- 鼠标离开时恢复原状（除非节点被选中）

#### 点击效果
- 点击部门节点进行选中
- 添加蓝色高亮边框（2px宽度）
- 触发列表筛选功能（如果表格渲染器已初始化）
- 再次点击同一节点取消选中
- 点击响应时间 < 200ms

### 3. 其他节点交互

#### 悬停效果
- 鼠标悬停时显示汇总数据提示框
- 自动计算所有部门在该层级的汇总数据
- 鼠标离开时隐藏提示框

### 4. 连接线交互

#### 悬停效果
- 鼠标悬停时透明度从0.4增加到0.8
- 显示连接线的源节点、目标节点和流量值
- 鼠标离开时恢复原透明度

## 类结构

### InteractionHandler

```javascript
class InteractionHandler {
  constructor(components)
  setSummaryData(summaryData)
  bindSankeyEvents()
  bindDepartmentNodeEvents()
  bindOtherNodeEvents()
  bindLinkEvents()
  calculateNodeTotalData(node)
  handleNodeClick(node)
  highlightNode(nodeId)
  clearSelection()
  showTooltip(data, x, y)
  hideTooltip()
  positionTooltip(x, y)
  generateTooltipContent(data)
  formatNumber(num)
}
```

## 使用方法

### 基本使用

```javascript
// 1. 创建桑基图渲染器
const sankeyRenderer = new SankeyRenderer('sankey-container');
sankeyRenderer.render(sankeyData);

// 2. 创建交互处理器
const interactionHandler = new InteractionHandler({
  sankeyRenderer: sankeyRenderer,
  tableRenderer: tableRenderer  // 可选
});

// 3. 设置汇总数据（用于计算节点汇总信息）
interactionHandler.setSummaryData(summaryData);

// 4. 绑定交互事件
interactionHandler.bindSankeyEvents();
```

### 手动控制

```javascript
// 手动高亮节点
interactionHandler.highlightNode('部门_交通运输厅');

// 清除选择
interactionHandler.clearSelection();

// 手动显示提示框
const tooltipData = {
  type: 'department',
  name: '交通运输厅',
  data: { /* ... */ }
};
interactionHandler.showTooltip(tooltipData, 100, 100);

// 隐藏提示框
interactionHandler.hideTooltip();
```

## 技术实现细节

### 1. 智能定位算法

提示框定位算法确保提示框始终在视口内可见：

```javascript
positionTooltip(x, y) {
  // 默认位置：鼠标右下方
  let left = x + 10;
  let top = y + 10;
  
  // 如果超出右边界，显示在鼠标左侧
  if (left + tooltipRect.width > viewportWidth) {
    left = x - tooltipRect.width - 10;
  }
  
  // 如果超出下边界，显示在鼠标上方
  if (top + tooltipRect.height > viewportHeight) {
    top = y - tooltipRect.height - 10;
  }
  
  // 确保不超出左边界和上边界
  left = Math.max(10, left);
  top = Math.max(10, top);
}
```

### 2. 数据汇总计算

自动计算节点的汇总数据：

```javascript
calculateNodeTotalData(node) {
  let totalTableCount = 0;
  let totalDataVolume = 0;
  
  if (node.type === 'server') {
    this.summaryData.forEach(row => {
      totalTableCount += parseInt(row['前置机（表数量）']) || 0;
      totalDataVolume += parseInt(row['前置机（数据量）']) || 0;
    });
  }
  // ... 其他节点类型
  
  return { totalTableCount, totalDataVolume };
}
```

### 3. 事件绑定

使用D3.js的事件绑定机制：

```javascript
// 部门节点事件
departmentNodes
  .on('mouseenter', function(event, d) { /* ... */ })
  .on('mouseleave', function(event, d) { /* ... */ })
  .on('click', function(event, d) { /* ... */ });

// 连接线事件
links
  .on('mouseenter', function(event, d) { /* ... */ })
  .on('mouseleave', function() { /* ... */ });
```

### 4. 动画效果

使用D3.js的transition实现平滑动画：

```javascript
// 边框宽度动画
d3.select(this).select('rect')
  .transition()
  .duration(200)
  .attr('stroke-width', 2);

// 透明度动画
d3.select(this)
  .transition()
  .duration(200)
  .attr('opacity', 0.8);
```

## 性能优化

### 1. 事件节流
- 悬停事件响应时间 < 100ms
- 点击事件响应时间 < 200ms

### 2. DOM操作优化
- 使用D3.js的选择器缓存
- 最小化DOM查询次数
- 批量更新样式

### 3. 内存管理
- 及时清理事件监听器
- 避免内存泄漏

## 样式定制

### CSS变量

可以通过修改CSS来定制提示框样式：

```css
.tooltip {
  background: rgba(0, 0, 0, 0.85);  /* 背景色 */
  color: #fff;                       /* 文字颜色 */
  padding: 12px 16px;                /* 内边距 */
  border-radius: 4px;                /* 圆角 */
  font-size: 13px;                   /* 字体大小 */
}

.tooltip-header {
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
```

## 测试

### 测试文件
- `test-interaction-handler.html` - 交互处理模块测试页面

### 测试步骤
1. 在浏览器中打开 `test-interaction-handler.html`
2. 悬停在部门节点上，验证提示框显示
3. 悬停在其他节点上，验证汇总数据显示
4. 悬停在连接线上，验证流量信息显示
5. 点击部门节点，验证高亮效果
6. 再次点击，验证取消高亮

### 预期结果
- ✅ 提示框正确显示各类数据
- ✅ 提示框智能定位，不超出视口
- ✅ 数字正确格式化（千分位分隔）
- ✅ 悬停动画流畅
- ✅ 点击高亮效果正确
- ✅ 取消选择功能正常

## 依赖关系

### 必需依赖
- D3.js v7
- SankeyRenderer（桑基图渲染器）
- HTML中的tooltip元素

### 可选依赖
- TableRenderer（表格渲染器，用于筛选功能）

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## 已知限制

1. 需要在桑基图渲染完成后才能绑定事件
2. 提示框内容为HTML字符串，需注意XSS防护
3. 触摸设备需要额外处理（未在当前版本实现）

## 未来改进

1. 添加触摸设备支持
2. 添加键盘导航支持
3. 添加提示框动画效果
4. 支持自定义提示框模板
5. 添加事件节流/防抖优化

## 相关文档

- [桑基图渲染模块](./sankey-renderer-implementation.md)
- [数据转换模块](./data-transformer-implementation.md)
- [设计文档](../.kiro/specs/sankey-data-visualization/design.md)
