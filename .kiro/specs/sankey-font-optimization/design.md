# 设计文档

## 概述

本设计文档详细说明桑基图字体优化的实现方案。通过建立统一的字体系统、优化字体层级、调整间距和行高，以及实现响应式适配，全面提升桑基图可视化系统的专业性和可读性。

## 架构

### 字体系统架构

字体优化采用分层架构：

```
CSS变量层 (:root)
    ↓
字体族定义 (font-family)
    ↓
组件样式层 (各组件类)
    ↓
响应式调整层 (@media queries)
```

**核心原则：**
- 使用CSS变量集中管理字体配置
- 建立清晰的字体层级体系
- 确保跨浏览器和跨平台一致性
- 实现响应式字体缩放

## 组件和接口

### 1. CSS变量系统

在`:root`中定义全局字体变量：

```css
:root {
  /* 字体族 */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
  --font-family-mono: 'SF Mono', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace;
  --font-family-display: 'Inter', 'Segoe UI', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* 字体大小 */
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 13px;
  --font-size-md: 14px;
  --font-size-lg: 15px;
  --font-size-xl: 16px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
  --font-size-4xl: 28px;
  --font-size-5xl: 32px;
  --font-size-6xl: 36px;
  
  /* 字重 */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* 字间距 */
  --letter-spacing-tight: -0.5px;
  --letter-spacing-normal: 0px;
  --letter-spacing-relaxed: 0.3px;
  --letter-spacing-wide: 0.5px;
  --letter-spacing-wider: 1px;
  
  /* 行高 */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;
}
```

### 2. 字体族选择策略

**主字体 (--font-family-base):**
- 优先使用系统字体以获得最佳性能
- 中文优先：Microsoft YaHei (Windows), PingFang SC (macOS)
- 英文优先：Segoe UI (Windows), Roboto (Android), Inter (现代浏览器)
- 回退到系统默认sans-serif

**等宽字体 (--font-family-mono):**
- 用于数值显示，确保数字对齐
- 优先：SF Mono (macOS), Consolas (Windows)
- 回退到Courier New

**展示字体 (--font-family-display):**
- 用于标题和重要文本
- 优先使用Inter或Segoe UI以获得现代感

### 3. 组件字体规范

#### 3.1 页面标题 (.page-header h1)

```css
.page-header h1 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-4xl);  /* 28px */
  font-weight: var(--font-weight-bold);  /* 700 */
  letter-spacing: var(--letter-spacing-wide);  /* 0.5px */
  line-height: var(--line-height-tight);  /* 1.2 */
}
```

#### 3.2 层级标签 (.layer-label)

```css
.layer-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-lg);  /* 15px */
  font-weight: var(--font-weight-semibold);  /* 600 */
  letter-spacing: var(--letter-spacing-relaxed);  /* 0.3px */
  line-height: var(--line-height-tight);  /* 1.2 */
}
```

#### 3.3 节点标签 (.node-label)

```css
.node-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);  /* 13px，小节点12px */
  font-weight: var(--font-weight-medium);  /* 500 */
  letter-spacing: var(--letter-spacing-relaxed);  /* 0.3px */
  line-height: var(--line-height-tight);  /* 1.2 */
}
```

#### 3.4 指标卡片

**指标数值 (.metric-value):**
```css
.metric-value {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-5xl);  /* 32px */
  font-weight: var(--font-weight-bold);  /* 700 */
  letter-spacing: var(--letter-spacing-tight);  /* -0.5px */
  line-height: var(--line-height-tight);  /* 1.2 */
}
```

**指标标签 (.metric-label):**
```css
.metric-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);  /* 12px */
  font-weight: var(--font-weight-medium);  /* 500 */
  letter-spacing: var(--letter-spacing-relaxed);  /* 0.3px */
  line-height: var(--line-height-normal);  /* 1.5 */
  text-transform: uppercase;
}
```

#### 3.5 悬浮提示框

**提示框标题 (.tooltip-header):**
```css
.tooltip-header {
  font-family: var(--font-family-base);
  font-size: var(--font-size-lg);  /* 15px */
  font-weight: var(--font-weight-semibold);  /* 600 */
  letter-spacing: var(--letter-spacing-relaxed);  /* 0.3px */
  line-height: var(--line-height-tight);  /* 1.2 */
}
```

**提示框内容 (.tooltip-label, .tooltip-value):**
```css
.tooltip-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);  /* 13px */
  font-weight: var(--font-weight-normal);  /* 400 */
  letter-spacing: var(--letter-spacing-normal);  /* 0px */
  line-height: var(--line-height-relaxed);  /* 1.6 */
}

.tooltip-value {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-base);  /* 13px */
  font-weight: var(--font-weight-semibold);  /* 600 */
  letter-spacing: var(--letter-spacing-tight);  /* -0.5px */
  line-height: var(--line-height-relaxed);  /* 1.6 */
}
```

#### 3.6 数据表格

**表头 (.detail-table th):**
```css
.detail-table th {
  font-family: var(--font-family-base);
  font-size: var(--font-size-md);  /* 14px */
  font-weight: var(--font-weight-semibold);  /* 600 */
  letter-spacing: var(--letter-spacing-relaxed);  /* 0.3px */
  line-height: var(--line-height-normal);  /* 1.5 */
}
```

**表格内容 (.detail-table td):**
```css
.detail-table td {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);  /* 13px */
  font-weight: var(--font-weight-normal);  /* 400 */
  letter-spacing: var(--letter-spacing-normal);  /* 0px */
  line-height: var(--line-height-normal);  /* 1.5 */
}
```

### 4. 响应式字体策略

#### 4.1 小屏幕 (<768px)

```css
@media (max-width: 767px) {
  :root {
    --font-size-xs: 10px;
    --font-size-sm: 11px;
    --font-size-base: 12px;
    --font-size-md: 13px;
    --font-size-lg: 14px;
    --font-size-xl: 15px;
    --font-size-2xl: 18px;
    --font-size-3xl: 20px;
    --font-size-4xl: 24px;
    --font-size-5xl: 28px;
    --font-size-6xl: 32px;
  }
}
```

#### 4.2 超大屏幕 (>1920px)

```css
@media (min-width: 1920px) {
  :root {
    --font-size-4xl: 32px;  /* 标题增大 */
    --font-size-5xl: 36px;  /* 指标数值增大 */
    --font-size-6xl: 40px;
  }
}
```

#### 4.3 触摸设备优化

```css
@media (hover: none) and (pointer: coarse) {
  :root {
    /* 触摸设备上增加字体大小以提升可读性 */
    --font-size-base: 14px;
    --font-size-md: 15px;
    --font-size-lg: 16px;
  }
}
```

### 5. 字体渲染优化

在`body`元素上应用全局字体渲染优化：

```css
body {
  font-family: var(--font-family-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'kern' 1;  /* 启用字距调整 */
}
```

**优化说明：**
- `-webkit-font-smoothing: antialiased`: 在Webkit浏览器中使用抗锯齿渲染
- `-moz-osx-font-smoothing: grayscale`: 在macOS的Firefox中使用灰度渲染
- `text-rendering: optimizeLegibility`: 优化文本可读性，启用连字和字距调整
- `font-feature-settings: 'kern' 1`: 显式启用字距调整特性

## 数据模型

字体配置数据结构（用于动态主题切换，可选实现）：

```javascript
const fontConfig = {
  families: {
    base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', ...",
    mono: "'SF Mono', 'Consolas', 'Monaco', ...",
    display: "'Inter', 'Segoe UI', 'Roboto', ..."
  },
  sizes: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    // ...
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  spacing: {
    tight: '-0.5px',
    normal: '0px',
    relaxed: '0.3px',
    wide: '0.5px',
    wider: '1px'
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6
  }
};
```

## 错误处理

### 字体加载失败

**问题：** 自定义字体（如Inter）加载失败

**解决方案：**
- 使用完整的字体回退链，确保始终有可用字体
- 不依赖外部字体CDN，优先使用系统字体
- 如需使用Web字体，实现字体加载检测和降级策略

### 跨浏览器兼容性

**问题：** 某些CSS属性在旧浏览器中不支持

**解决方案：**
- 为关键属性提供回退值
- 使用CSS变量时提供默认值
- 测试主流浏览器（Chrome, Firefox, Safari, Edge）

```css
/* 示例：提供回退值 */
.element {
  font-family: -apple-system, sans-serif;  /* 回退 */
  font-family: var(--font-family-base, -apple-system, sans-serif);  /* CSS变量 */
}
```

### 中文字体显示问题

**问题：** 某些系统缺少中文字体

**解决方案：**
- 在字体族中包含多个中文字体选项
- 最终回退到系统默认sans-serif
- Windows: Microsoft YaHei
- macOS: PingFang SC
- Linux: Hiragino Sans GB, WenQuanYi Micro Hei

## 测试策略

### 1. 视觉回归测试

**测试内容：**
- 对比优化前后的截图
- 验证字体大小、粗细、间距是否符合设计规范
- 检查不同组件的字体层级是否清晰

**测试工具：**
- 浏览器开发者工具
- 手动视觉检查

### 2. 跨浏览器测试

**测试浏览器：**
- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

**测试内容：**
- 字体渲染质量
- CSS变量支持
- 字体回退是否正常

### 3. 响应式测试

**测试设备：**
- 桌面 (1920x1080, 1366x768)
- 平板 (768x1024)
- 手机 (375x667, 414x896)

**测试内容：**
- 字体大小是否适配
- 可读性是否良好
- 触摸目标是否足够大

### 4. 性能测试

**测试指标：**
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 字体加载时间

**验收标准：**
- 字体优化不应显著增加页面加载时间
- 使用系统字体应保持快速渲染

### 5. 可访问性测试

**测试内容：**
- 最小字体大小不小于11px
- 对比度符合WCAG AA标准
- 文本可缩放（浏览器缩放功能）

**测试工具：**
- Chrome DevTools Lighthouse
- WAVE浏览器扩展

## 实现注意事项

1. **渐进增强：** 优先确保基础字体可读，再添加高级特性
2. **性能优先：** 使用系统字体避免额外的网络请求
3. **一致性：** 通过CSS变量确保全局字体配置一致
4. **可维护性：** 集中管理字体配置，便于未来调整
5. **测试覆盖：** 在多种设备和浏览器上验证效果

## 设计决策

### 为什么选择系统字体？

**决策：** 优先使用系统字体而非Web字体

**理由：**
- 零网络延迟，即时渲染
- 用户熟悉的字体，阅读舒适
- 跨平台一致性好
- 无需管理字体文件和许可证

### 为什么使用CSS变量？

**决策：** 使用CSS变量管理字体配置

**理由：**
- 集中管理，易于维护
- 支持动态主题切换（未来扩展）
- 响应式调整更简单
- 现代浏览器支持良好

### 为什么区分三种字体族？

**决策：** 定义base、mono、display三种字体族

**理由：**
- base: 通用文本，平衡中英文显示
- mono: 数值对齐，专业感强
- display: 标题突出，现代感强
- 不同场景使用不同字体，提升视觉层次

## 参考资料

- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- [System Font Stack](https://systemfontstack.com/)
- [MDN - font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family)
- [MDN - CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Web Typography Best Practices](https://www.smashingmagazine.com/2020/07/css-techniques-legibility/)
