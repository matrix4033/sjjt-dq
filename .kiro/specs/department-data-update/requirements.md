# 需求文档

## 简介

本功能用于修改部门汇聚清单表的显示数据，将两个动态计算的指标改为固定值显示。这是一个数据展示层的修改需求，不涉及数据源或计算逻辑的变更。

## 术语表

- **Data_Transformer**: 数据转换器类，负责处理和转换汇总数据和明细数据
- **Stats_Object**: 统计对象，包含所有指标卡显示的统计数据
- **Config_Object**: 配置对象，用于覆盖默认计算逻辑的配置参数
- **Indicator_Card**: 指标卡，用于在界面上显示统计指标的UI组件

## 需求

### 需求 1: 固定显示部门汇聚清单表数量

**用户故事:** 作为系统管理员，我希望部门汇聚清单表数量显示为固定值 1132，以便展示特定的业务数据。

#### 验收标准

1. THE Data_Transformer SHALL 在 calculateOverallStats 方法中将 totalTableCount 设置为固定值 1132
2. WHEN 系统加载数据时，THE Indicator_Card SHALL 显示"部门汇聚清单表数量"为 1132 张
3. THE Data_Transformer SHALL 忽略汇总数据中【部门表数量】字段的实际值
4. THE Stats_Object SHALL 包含 totalTableCount 属性且其值为 1132

### 需求 2: 固定显示部门数据更新率

**用户故事:** 作为系统管理员，我希望部门数据更新率显示为固定值 99.0%，以便展示特定的业务数据。

#### 验收标准

1. THE Data_Transformer SHALL 在 calculateOverallStats 方法中将 departmentUpdateRate 设置为固定值 99.0
2. WHEN 系统加载数据时，THE Indicator_Card SHALL 显示"部门数据更新率"为 99.0%
3. THE Data_Transformer SHALL 忽略明细数据中【部门到前置机状态】字段的实际统计结果
4. THE Stats_Object SHALL 包含 departmentUpdateRate 属性且其值为 99.0

### 需求 3: 保持其他指标计算逻辑不变

**用户故事:** 作为系统管理员，我希望其他指标（汇聚部门数、前置仓更新率、链路完成率、链路异常率）继续使用原有的动态计算逻辑，以便保持系统功能的完整性。

#### 验收标准

1. THE Data_Transformer SHALL 继续使用原有逻辑计算 departmentCount（汇聚部门数）
2. THE Data_Transformer SHALL 继续使用原有逻辑计算 warehouseUpdateRate（前置仓更新率）
3. THE Data_Transformer SHALL 继续使用原有逻辑计算 linkCompletionRate（链路完成率）
4. THE Data_Transformer SHALL 继续使用原有逻辑计算 linkAbnormalRate（链路异常率）
5. WHEN Config_Object 中未指定覆盖值时，THE Data_Transformer SHALL 使用数据源进行动态计算

### 需求 4: 代码修改最小化

**用户故事:** 作为开发人员，我希望代码修改尽可能小且集中，以便降低引入错误的风险和便于后续维护。

#### 验收标准

1. THE 修改 SHALL 仅涉及 js/data-transformer.js 文件中的 calculateOverallStats 方法
2. THE 修改 SHALL 不改变方法签名或返回值结构
3. THE 修改 SHALL 不影响其他方法的功能
4. THE 修改 SHALL 保持代码的可读性和注释的准确性
