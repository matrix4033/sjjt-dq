# 整体汇聚情况展示模块实现文档

## 概述

整体汇聚情况展示模块（OverviewPanel）负责在页面顶部以卡片式布局展示关键统计指标，包括接入部门数、汇聚表数量、总数据量和汇聚完成率。

## 实现文件

- **JavaScript**: `js/overview-panel.js`
- **CSS**: `css/main.css` (overview-panel 相关样式)
- **测试页面**: `test-overview-panel.html`

## 类设计

### OverviewPanel 类

#### 构造函数

```javascript
constructor(containerId, config = {})
```

**参数:**
- `containerId` (string): 容器DOM元素的ID
- `config` (Object): 可选配置对象

**配置对象结构:**
```javascript
{
  metrics: [
    {
      key: "departmentCount",      // 指标键
      label: "接入部门",            // 显示标签
      icon: "🏢",                   // 图标（emoji）
      unit: "个",                   // 单位
      value: null                   // 固定值（null表示使用统计数据）
    },
    // ... 更多指标
  ]
}
```

#### 主要方法

##### render(stats)

渲染整个概览面板。

**参数:**
- `stats` (Object): 统计数据对象

**示例:**
```javascript
const panel = new OverviewPanel('overview-panel');
panel.render({
  departmentCount: 45,
  tableCount: 2205,
  dataVolume: 900000,
  completionRate: 95.5
});
```

##### updateMetric(key, value)

更新单个指标的值，带有动画效果。

**参数:**
- `key` (string): 指标键
- `value` (any): 新值

**示例:**
```javascript
panel.updateMetric('departmentCount', 50);
```

##### getStats()

获取当前的统计数据。

**返回:**
- (Object): 当前统计数据的副本

##### clear()

清空面板内容。

## CSS 样式

### 主要样式类

#### .overview-panel
- 使用 CSS Grid 布局
- 4列网格（响应式调整）
- 20px 间距

#### .metric-card
- 白色背景
- 圆角 8px
- 阴影效果
- Flexbox 布局
- 悬停动画（上移4px，增强阴影）

#### .metric-icon
- 字体大小 48px
- 不缩放

#### .metric-value
- 字体大小 32px
- 粗体 700
- 蓝色 (#1890ff)

#### .metric-label
- 字体大小 14px
- 灰色 (#666)

### 响应式设计

#### 中等屏幕 (≤1200px)
- 2列网格布局

#### 小屏幕 (≤768px)
- 1列网格布局
- 减小卡片内边距
- 调整图标和文字大小

## 功能特性

### 1. 数字格式化

#### 千分位分隔
普通数字使用千分位分隔符：
- 2205 → "2,205"
- 45678 → "45,678"

#### 大数字单位转换
数据量字段自动转换单位：
- < 10,000: 显示原值（千分位分隔）
- ≥ 10,000: 显示为"万"（保留2位小数）
- ≥ 100,000,000: 显示为"亿"（保留2位小数）

**示例:**
- 900000 → "90.00万条"
- 1234567890 → "12.35亿条"

### 2. 固定值配置

支持为指标配置固定值，优先级高于统计数据：

```javascript
const panel = new OverviewPanel('overview-panel', {
  metrics: [
    {
      key: "completionRate",
      label: "汇聚完成率",
      icon: "✅",
      unit: "%",
      value: 95.5  // 固定值，不使用统计数据
    }
  ]
});
```

### 3. 动态更新动画

调用 `updateMetric()` 时会触发动画效果：
- 数值放大到 1.1 倍
- 颜色变为绿色
- 持续 0.6 秒
- 平滑过渡

### 4. 悬停效果

鼠标悬停在卡片上时：
- 卡片上移 4px
- 阴影增强
- 过渡时间 0.3 秒

## 使用示例

### 基本使用

```javascript
// 创建实例
const overviewPanel = new OverviewPanel('overview-panel');

// 渲染数据
overviewPanel.render({
  departmentCount: 45,
  tableCount: 2205,
  dataVolume: 900000,
  completionRate: 95.5
});
```

### 自定义配置

```javascript
// 创建带自定义配置的实例
const overviewPanel = new OverviewPanel('overview-panel', {
  metrics: [
    {
      key: "departmentCount",
      label: "接入部门",
      icon: "🏢",
      unit: "个",
      value: null  // 使用统计数据
    },
    {
      key: "completionRate",
      label: "汇聚完成率",
      icon: "✅",
      unit: "%",
      value: 98.5  // 固定值
    }
  ]
});

overviewPanel.render({
  departmentCount: 45,
  completionRate: 95.5  // 会被固定值覆盖
});
```

### 动态更新

```javascript
// 更新单个指标
overviewPanel.updateMetric('departmentCount', 50);
overviewPanel.updateMetric('tableCount', 2500);

// 获取当前数据
const currentStats = overviewPanel.getStats();
console.log(currentStats);
```

## 测试

运行测试页面：
```bash
# 在浏览器中打开
test-overview-panel.html
```

测试页面包含4个测试场景：
1. **基本渲染**: 测试使用统计数据渲染
2. **固定值配置**: 测试固定值优先级
3. **动态更新**: 测试实时更新功能（带按钮交互）
4. **大数字格式化**: 测试亿、万单位转换

## 需求覆盖

本模块实现了以下需求：

### 需求1.1
✅ 在页面顶部展示整体汇聚情况区域

### 需求1.7
✅ 使用卡片式布局横向排列关键指标

### 需求1.8
✅ 为每个指标卡片设置固定宽度和高度以保持一致性（通过Grid布局实现）

### 需求1.9
✅ 使用大号字体（32px）显示数值

### 需求1.10
✅ 使用小号字体（14px）显示指标名称

### 需求1.11
✅ 为每个指标卡片添加图标以增强视觉识别

### 需求1.12
✅ 使用白色背景和阴影效果突出指标卡片

### 需求1.13
✅ 在整体汇聚情况区域与桑基图区域之间添加24px间距

### 需求6.12
✅ 使用阴影效果区分不同的功能区域

### 需求6.13
✅ 实现悬停动画效果

## 注意事项

1. **容器必须存在**: 在创建 OverviewPanel 实例前，确保 DOM 中存在对应 ID 的容器元素
2. **数据格式**: 统计数据对象的键必须与配置中的 `key` 匹配
3. **固定值优先**: 如果配置中设置了 `value`，将忽略统计数据中的对应值
4. **响应式**: 样式已实现响应式设计，在不同屏幕尺寸下自动调整布局

## 后续集成

在主应用中集成时：

```javascript
// 在 main.js 中
const overviewPanel = new OverviewPanel('overview-panel', config.overviewMetrics);

// 加载数据后
const stats = dataTransformer.calculateOverallStats(summaryData);
overviewPanel.render(stats);
```

## 性能考虑

- 使用 CSS transform 实现动画，性能优于修改 top/left
- 避免频繁调用 `render()`，使用 `updateMetric()` 更新单个指标
- Grid 布局比 Flexbox 在多列场景下性能更好
