# 指标卡Tooltip功能说明

## 功能描述

鼠标悬停在第二行的指标卡（百分比类型）时，会显示对应的数量和总数。

## 实现细节

### 1. 数据准备 (js/data-transformer.js)

在 `calculateOverallStats` 方法中，为每个百分比指标添加 `_detail` 字段：

```javascript
stats.departmentUpdateRate = 85.3;
stats.departmentUpdateRate_detail = {
  count: 1234,  // 正常数量
  total: 1447   // 总数量
};
```

支持的指标：
- `departmentUpdateRate_detail` - 部门数据更新率详情
- `warehouseUpdateRate_detail` - 前置仓更新率详情
- `linkCompletionRate_detail` - 链路完成率详情
- `linkAbnormalRate_detail` - 链路异常率详情

### 2. Tooltip生成 (js/overview-panel.js)

在 `createMetricCard` 方法中：

```javascript
// 为百分比类型的指标添加tooltip
if (metric.unit === '%' && stats[metric.key + '_detail']) {
  const detail = stats[metric.key + '_detail'];
  const tooltipText = `${formatNumber(detail.count)} / ${formatNumber(detail.total)}`;
  card.setAttribute('data-tooltip', tooltipText);
  card.classList.add('has-tooltip');
}
```

### 3. 样式实现 (css/main.css)

使用CSS伪元素 `::after` 实现tooltip：

```css
.metric-card.has-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  background: rgba(20, 20, 20, 0.95);
  /* ... 其他样式 */
  opacity: 0;
}

.metric-card.has-tooltip:hover::after {
  opacity: 1;
  transform: translateX(-50%) scale(1);
  bottom: -40px;
}
```

## 视觉效果

### Tooltip样式特点
- 暗黑背景，半透明
- 白色文字，清晰易读
- 圆角边框，现代感
- 淡入淡出动画
- 缩放动画（0.9 → 1）
- 每个指标卡的tooltip有对应颜色的边框发光效果

### 显示位置
- 位于卡片下方
- 水平居中对齐
- 距离卡片底部40px
- 悬停时向下移动5px（动画效果）

### 颜色区分
- 部门数据更新率：橙色边框发光
- 前置仓更新率：紫色边框发光
- 链路完成率：深绿色边框发光
- 链路异常率：红色边框发光

## 显示内容示例

| 指标 | 百分比 | Tooltip显示 |
|------|--------|-------------|
| 部门数据更新率 | 85.3% | 1,234 / 1,447 |
| 前置仓更新率 | 92.7% | 1,341 / 1,447 |
| 链路完成率 | 78.5% | 1,136 / 1,447 |
| 链路异常率 | 12.3% | 178 / 1,447 |

## 注意事项

1. **仅第二行显示**：只有百分比类型的指标（第二行的4个卡片）才显示tooltip
2. **第一行不显示**：汇聚部门数和清单表数量不显示tooltip（它们本身就是数量）
3. **数字格式化**：数量使用千分位分隔符格式化（如 1,234）
4. **响应式**：tooltip会自动适应不同屏幕尺寸

## 修改的文件

1. `js/data-transformer.js` - 添加 `_detail` 字段
2. `js/overview-panel.js` - 添加tooltip生成逻辑
3. `css/main.css` - 添加tooltip样式
4. `指标卡Tooltip功能说明.md` - 本文档

## 测试方法

1. 打开 `index.html`
2. 等待数据加载完成
3. 将鼠标悬停在第二行的任意指标卡上
4. 验证：
   - ✓ 显示 "数量 / 总数" 格式的tooltip
   - ✓ Tooltip有淡入淡出动画
   - ✓ Tooltip有对应颜色的边框发光
   - ✓ 数字使用千分位分隔符
   - ✓ 第一行的卡片不显示tooltip
