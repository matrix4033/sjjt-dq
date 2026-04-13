# Tooltip问题修复说明

## 问题原因

Tooltip没有显示的根本原因是：`.metric-card` 样式中设置了 `overflow: hidden;`，这导致tooltip（使用`::after`伪元素实现）被裁剪掉了。

## 修复方案

### 1. 修改overflow属性 (css/main.css)

```css
.metric-card {
  /* ... 其他样式 ... */
  overflow: visible;  /* 从 hidden 改为 visible */
}
```

### 2. 调整装饰条样式

为了确保装饰条不会溢出卡片的圆角，添加了border-radius：

```css
.metric-card::before {
  /* ... 其他样式 ... */
  border-radius: 10px 10px 0 0;  /* 匹配卡片的圆角 */
}
```

### 3. 添加调试日志

在 `js/overview-panel.js` 和 `js/data-transformer.js` 中添加了console.log，方便调试：

```javascript
// overview-panel.js
if (metric.unit === '%' && stats[metric.key + '_detail']) {
  console.log(`✓ 添加tooltip: ${metric.key} = ${tooltipText}`);
}

// data-transformer.js
console.log('=== 指标详细数据 ===');
console.log('departmentUpdateRate_detail:', stats.departmentUpdateRate_detail);
// ...
```

## 测试方法

### 方法1：使用主页面
1. 打开 `index.html`
2. 等待数据加载完成
3. 将鼠标悬停在第二行的任意指标卡上
4. 应该看到tooltip显示 "数量 / 总数"

### 方法2：使用测试页面
1. 打开 `test-tooltip-simple.html` - 纯CSS测试
2. 打开 `test-tooltip.html` - 完整功能测试

### 方法3：检查控制台
打开浏览器控制台（F12），应该看到：
```
=== 指标详细数据 ===
departmentUpdateRate_detail: {count: 1234, total: 1447}
warehouseUpdateRate_detail: {count: 1341, total: 1447}
linkCompletionRate_detail: {count: 1136, total: 1447}
linkAbnormalRate_detail: {count: 178, total: 1447}
===================

✓ 添加tooltip: departmentUpdateRate = 1,234 / 1,447
✓ 添加tooltip: warehouseUpdateRate = 1,341 / 1,447
✓ 添加tooltip: linkCompletionRate = 1,136 / 1,447
✓ 添加tooltip: linkAbnormalRate = 178 / 1,447
```

## 预期效果

悬停在第二行指标卡时：
- ✓ 显示tooltip
- ✓ 淡入淡出动画
- ✓ 缩放动画（0.9 → 1）
- ✓ 对应颜色的边框发光
- ✓ 数字使用千分位分隔符

## 修改的文件

1. `css/main.css` - 修改overflow和装饰条样式
2. `js/overview-panel.js` - 添加调试日志
3. `js/data-transformer.js` - 添加调试日志
4. `test-tooltip-simple.html` - 纯CSS测试页面
5. `test-tooltip.html` - 完整功能测试页面
6. `Tooltip问题修复说明.md` - 本文档

## 关键点

- **overflow: visible** 是关键，必须设置才能显示tooltip
- 装饰条使用border-radius确保不溢出
- tooltip使用`::after`伪元素，z-index设置为1000确保在最上层
- 只有百分比类型的指标（第二行）才显示tooltip
