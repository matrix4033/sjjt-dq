# 实施计划

- [x] 1. 建立CSS变量字体系统





  - 在`:root`中定义字体族变量（base、mono、display）
  - 定义字体大小变量（xs到6xl）
  - 定义字重变量（normal、medium、semibold、bold）
  - 定义字间距变量（tight到wider）
  - 定义行高变量（tight、normal、relaxed）
  - _需求: 1.1, 1.2, 1.3, 1.4_

- [x] 2. 优化全局字体配置





  - 更新body元素的font-family为var(--font-family-base)
  - 添加-webkit-font-smoothing: antialiased
  - 添加-moz-osx-font-smoothing: grayscale
  - 添加text-rendering: optimizeLegibility
  - 添加font-feature-settings: 'kern' 1
  - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. 更新页面标题字体样式





  - 应用display字体族
  - 设置字体大小为28px（使用CSS变量）
  - 设置字重为700
  - 设置字间距为0.5px
  - 设置行高为1.2
  - _需求: 2.1_

- [x] 4. 更新层级标签字体样式





  - 修改sankey-renderer.js中的renderLayerLabels方法
  - 应用base字体族
  - 设置字体大小为15px
  - 设置字重为600
  - 设置字间距为0.3px
  - _需求: 2.2_

- [x] 5. 更新节点标签字体样式





  - 修改sankey-renderer.js中的renderNodes方法
  - 应用base字体族
  - 根据节点大小动态设置字体大小（12-14px）
  - 设置字重为500
  - 设置字间距为0.3px
  - _需求: 2.3_

- [x] 6. 更新指标卡片字体样式





- [x] 6.1 优化指标数值样式


  - 应用mono字体族
  - 设置字体大小为32px
  - 设置字重为700
  - 设置字间距为-0.5px（紧凑数字）
  - _需求: 2.4_

- [x] 6.2 优化指标标签样式


  - 应用base字体族
  - 设置字体大小为12px
  - 设置字重为500
  - 设置字间距为0.3px
  - 保持text-transform: uppercase
  - _需求: 2.5_

- [x] 7. 更新悬浮提示框字体样式






- [x] 7.1 优化提示框标题样式

  - 应用base字体族
  - 设置字体大小为15px
  - 设置字重为600
  - 设置字间距为0.3px
  - _需求: 2.6_

- [x] 7.2 优化提示框内容样式


  - tooltip-label应用base字体族，13px，字重400
  - tooltip-value应用mono字体族，13px，字重600
  - 设置行高为1.6
  - 调整字间距（label: 0px, value: -0.5px）
  - _需求: 2.7_

- [x] 8. 更新数据表格字体样式





- [x] 8.1 优化表头样式


  - 应用base字体族
  - 设置字体大小为14px
  - 设置字重为600
  - 设置字间距为0.3px
  - _需求: 2.8_


- [x] 8.2 优化表格内容样式

  - 应用base字体族
  - 设置字体大小为13px
  - 设置字重为400
  - 设置行高为1.5
  - _需求: 2.9_

- [ ] 9. 实现响应式字体适配
- [ ] 9.1 添加小屏幕字体调整
  - 在@media (max-width: 767px)中重新定义CSS变量
  - 将所有字体大小缩小10-15%
  - 确保最小字体不小于11px
  - _需求: 4.1, 4.3_

- [ ] 9.2 添加超大屏幕字体调整
  - 在@media (min-width: 1920px)中重新定义CSS变量
  - 将标题和指标数值字体增大10-20%
  - _需求: 4.2_

- [ ] 9.3 添加触摸设备字体优化
  - 在@media (hover: none) and (pointer: coarse)中调整字体
  - 增加基础字体大小以提升可读性
  - _需求: 4.4_

- [ ] 10. 验证和测试
- [ ] 10.1 进行视觉检查
  - 在浏览器中打开index.html
  - 检查所有组件的字体是否符合设计规范
  - 验证字体层级是否清晰
  - 确认可读性是否提升

- [ ] 10.2 进行跨浏览器测试
  - 在Chrome中测试字体渲染
  - 在Firefox中测试字体渲染
  - 在Safari中测试字体渲染（如可用）
  - 在Edge中测试字体渲染（如可用）

- [ ] 10.3 进行响应式测试
  - 测试桌面尺寸（1920x1080, 1366x768）
  - 测试平板尺寸（768x1024）
  - 测试手机尺寸（375x667）
  - 验证字体在各尺寸下的可读性
