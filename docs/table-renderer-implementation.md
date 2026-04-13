# TableRenderer 实现文档

## 概述

TableRenderer 是明细列表渲染模块，负责渲染明细数据表格、应用状态颜色标识、支持数据筛选和更新。

## 功能特性

### 1. 表格渲染
- 动态生成表格HTML结构（表头、表体、筛选栏）
- 支持自定义列配置（字段、宽度、对齐方式）
- 自动处理空值显示为"-"
- 支持大量数据的流畅渲染

### 2. 状态颜色标识
- 为"异常"状态使用红色样式（#ff4d4f）
- 为非"异常"状态使用绿色样式（#52c41a）
- 状态单元格带有边框和背景色

### 3. 数据筛选
- 支持按部门筛选数据
- 显示当前筛选条件和结果数量
- 提供清除筛选按钮
- 筛选栏带有滑入动画效果

### 4. 样式效果
- 斑马纹表格行（偶数行浅灰色背景）
- 悬停效果（浅蓝色背景）
- 固定表头（滚动时表头保持可见）
- 自定义滚动条样式
- 表格行渐入动画（前10行带延迟）

## 类接口

### 构造函数

```javascript
constructor(containerId, config = {})
```

**参数：**
- `containerId` (string): 容器DOM元素ID
- `config` (Object): 配置参数
  - `columns` (Array): 列配置数组

**列配置格式：**
```javascript
{
  field: "部门",           // 字段名（对应CSV列名）
  width: "120px",          // 列宽度
  align: "left",           // 对齐方式：left/center/right
  colorize: false          // 是否为状态列（应用颜色标识）
}
```

### 主要方法

#### render(data)
渲染表格数据

**参数：**
- `data` (Array): 明细数据数组

**示例：**
```javascript
tableRenderer.render([
  {
    "部门": "人力资源社会保障厅",
    "表中文名": "AA10代码表",
    "部门到前置机对账状态": "正常",
    "异常原因说明": "",
    // ... 其他字段
  }
]);
```

#### filter(department)
根据部门筛选数据

**参数：**
- `department` (string): 部门名称

**示例：**
```javascript
tableRenderer.filter('人力资源社会保障厅');
```

#### clearFilter()
清除筛选，显示全部数据

**示例：**
```javascript
tableRenderer.clearFilter();
```

#### getCurrentFilter()
获取当前筛选的部门

**返回：**
- (string|null): 当前筛选的部门名称，无筛选时返回null

#### getCurrentData()
获取当前显示的数据

**返回：**
- (Array): 当前显示的数据数组

## 使用示例

### 基本使用

```javascript
// 1. 创建TableRenderer实例
const tableRenderer = new TableRenderer('table-container');

// 2. 加载并渲染数据
const detailData = await dataLoader.loadCSV('data/明细.csv');
tableRenderer.render(detailData);

// 3. 筛选数据
tableRenderer.filter('交通运输厅');

// 4. 清除筛选
tableRenderer.clearFilter();
```

### 自定义列配置

```javascript
const tableRenderer = new TableRenderer('table-container', {
  columns: [
    { field: "部门", width: "150px", align: "left" },
    { field: "表中文名", width: "250px", align: "left" },
    { field: "部门到前置机对账状态", width: "140px", align: "center", colorize: true },
    // ... 更多列配置
  ]
});
```

### 与交互模块集成

```javascript
// 在InteractionHandler中调用筛选
class InteractionHandler {
  handleNodeClick(node) {
    if (node.type === 'department') {
      // 筛选表格数据
      this.tableRenderer.filter(node.name);
      
      // 高亮节点
      this.sankeyRenderer.highlightNode(node.id);
    }
  }
}
```

## HTML结构

TableRenderer会在容器中生成以下HTML结构：

```html
<div id="table-container">
  <!-- 筛选信息栏（默认隐藏） -->
  <div class="filter-bar" style="display: none;">
    <span class="filter-info">
      当前筛选：<strong class="filter-department"></strong>
      （共 <strong class="filter-count"></strong> 条记录）
    </span>
    <button class="clear-filter-btn">清除筛选</button>
  </div>
  
  <!-- 表格 -->
  <div class="table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>部门</th>
          <th>表中文名</th>
          <!-- ... 更多表头 -->
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>人力资源社会保障厅</td>
          <td>AA10代码表</td>
          <td><span class="status-cell status-normal">正常</span></td>
          <!-- ... 更多单元格 -->
        </tr>
        <!-- ... 更多行 -->
      </tbody>
    </table>
  </div>
</div>
```

## CSS类说明

### 容器类
- `.table-container`: 表格容器，白色背景，圆角，阴影
- `.table-wrapper`: 表格包装器，支持滚动

### 筛选栏类
- `.filter-bar`: 筛选信息栏，浅灰色背景
- `.filter-info`: 筛选信息文本
- `.filter-department`: 部门名称（蓝色加粗）
- `.filter-count`: 结果数量（蓝色加粗）
- `.clear-filter-btn`: 清除筛选按钮

### 表格类
- `.data-table`: 数据表格
- `.data-table thead`: 表头（固定定位）
- `.data-table tbody tr`: 表格行（斑马纹、悬停效果、渐入动画）
- `.data-table th`: 表头单元格
- `.data-table td`: 数据单元格

### 状态类
- `.status-cell`: 状态单元格基础样式
- `.status-normal`: 正常状态（绿色）
- `.status-abnormal`: 异常状态（红色）

## 动画效果

### 1. 表格行渐入动画
前10行带有延迟的渐入动画，每行延迟50ms：

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 2. 筛选栏滑入动画
筛选栏显示时从上方滑入：

```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 响应式设计

### 中等屏幕 (768px - 1199px)
- 表格支持横向滚动
- 表格最小宽度1200px

### 小屏幕 (< 768px)
- 字体大小减小到12px
- 单元格内边距减小
- 筛选栏改为垂直布局

## 性能优化

### 1. 虚拟滚动（可选）
对于超大数据集（>1000行），可以实现虚拟滚动：

```javascript
renderVirtualRows(startIndex, endIndex) {
  const visibleData = this.filteredData.slice(startIndex, endIndex);
  this.renderTableBody(visibleData);
}
```

### 2. 事件委托
使用事件委托减少事件监听器数量：

```javascript
this.container.querySelector('.data-table tbody').addEventListener('click', (event) => {
  const row = event.target.closest('tr');
  if (row) {
    this.handleRowClick(row);
  }
});
```

## 数据验证

TableRenderer会自动处理以下情况：

1. **空值处理**: null、undefined、空字符串显示为"-"
2. **数据类型**: 所有值转换为字符串显示
3. **特殊字符**: 使用textContent避免XSS攻击

## 测试

### 单元测试

```javascript
// 测试渲染
test('render should display all data', () => {
  const data = [/* 测试数据 */];
  tableRenderer.render(data);
  const rows = document.querySelectorAll('.data-table tbody tr');
  expect(rows.length).toBe(data.length);
});

// 测试筛选
test('filter should show only matching department', () => {
  tableRenderer.filter('交通运输厅');
  const rows = document.querySelectorAll('.data-table tbody tr');
  rows.forEach(row => {
    expect(row.cells[0].textContent).toBe('交通运输厅');
  });
});

// 测试状态颜色
test('status cell should have correct color class', () => {
  const abnormalCell = document.querySelector('.status-abnormal');
  expect(abnormalCell.textContent).toBe('异常');
});
```

### 集成测试

使用 `test-table-renderer.html` 进行手动测试：

1. 打开测试页面
2. 点击"加载测试数据"按钮
3. 验证表格正确显示
4. 测试筛选功能
5. 验证样式效果（斑马纹、悬停、动画）

## 常见问题

### Q: 表格列宽度不正确
A: 检查列配置中的width属性，确保使用正确的CSS单位（px、%等）

### Q: 状态颜色不显示
A: 确保列配置中设置了 `colorize: true`，并且数据值为"异常"或其他状态值

### Q: 筛选后数据不更新
A: 检查部门名称是否完全匹配（区分大小写），确保CSV数据中的部门字段名正确

### Q: 动画效果不流畅
A: 检查数据量是否过大（>1000行），考虑实现虚拟滚动或分页

## 需求覆盖

本实现覆盖以下需求：

- ✅ 需求4.1: 在桑基图下方展示列表组件
- ✅ 需求4.3: 使用表格形式展示列表数据
- ✅ 需求4.4: 展示所有必需字段
- ✅ 需求4.5: 添加斑马纹样式
- ✅ 需求4.6: 为"异常"状态使用红色
- ✅ 需求4.7: 为非"异常"状态使用绿色
- ✅ 需求4.8: 显示全部记录（未筛选时）
- ✅ 需求4.9: 根据部门筛选数据
- ✅ 需求4.10: 仅显示匹配部门的记录
- ✅ 需求4.11: 显示筛选条件和结果数量
- ✅ 需求4.12: 支持清除筛选
- ✅ 需求4.13: 支持垂直滚动
- ✅ 需求6.3: 添加表格行渐入动画
- ✅ 需求6.4: 字体大小14px
- ✅ 需求6.5: 行间距1.5倍
- ✅ 需求9.7: 空值显示为"-"

## 下一步

TableRenderer已完成实现，可以继续实现：

1. **任务8**: 实现页面整体布局和样式
2. **任务9**: 实现主程序入口和配置
3. **任务10**: 集成测试和优化

在主程序中集成TableRenderer：

```javascript
// main.js
const tableRenderer = new TableRenderer('table-container');
const detailData = await dataLoader.loadCSV('data/明细.csv');
tableRenderer.render(detailData);

// 与交互处理器集成
interactionHandler.onDepartmentClick = (department) => {
  tableRenderer.filter(department);
};
```
