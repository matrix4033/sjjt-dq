# DataTransformer 模块实现文档

## 概述

DataTransformer 模块负责将CSV数据转换为桑基图所需的节点和连接数据结构，并提供数据验证和统计计算功能。

## 实现的功能

### 1. transformToSankeyData() - 数据转换

将汇总CSV数据转换为桑基图所需的节点和连接数据结构。

**输入**: 汇总CSV数据数组
**输出**: `{ nodes: Array, links: Array }`

#### 节点结构

**部门节点**:
```javascript
{
  id: "部门_交通运输厅",
  name: "交通运输厅",
  layer: 0,
  type: "department",
  metadata: {
    departmentTableCount: 30,
    serverTableCount: 8,
    serverDataVolume: 10000,
    warehouseTableCount: 7,
    warehouseDataVolume: 20000,
    sourceTableCount: 5,
    sourceDataVolume: 3000
  }
}
```

**系统节点** (前置机、前置仓、贴源层):
```javascript
{
  id: "前置机",
  name: "前置机",
  layer: 1,
  type: "server"
}
```

#### 连接结构

```javascript
{
  source: "部门_交通运输厅",
  target: "前置机",
  value: 30,  // 表数量作为流量值
  department: "交通运输厅",
  metadata: {
    tableCount: 30,
    dataVolume: 0
  }
}
```

#### 实现特点

- ✅ 为每个部门创建独立的部门节点
- ✅ 创建前置机、前置仓、贴源层的单一节点
- ✅ 使用表数量字段作为连接线流量值
- ✅ 自动过滤表数量为0的部门数据
- ✅ 保存完整的元数据供交互使用

### 2. calculateOverallStats() - 统计计算

计算整体汇聚情况的统计指标。

**输入**: 
- `summaryData`: 汇总CSV数据数组
- `config`: 配置对象（可选），包含固定值

**输出**: 统计指标对象

```javascript
{
  departmentCount: 45,      // 总部门数量
  tableCount: 2205,         // 总表数量
  dataVolume: 135000,       // 总数据量
  completionRate: 10.2      // 汇聚完成率(%)
}
```

#### 配置支持

支持从配置中读取固定值或自动计算：

```javascript
const stats = transformer.calculateOverallStats(summaryData, {
  departmentCount: null,    // null = 自动计算
  tableCount: null,         // null = 自动计算
  dataVolume: null,         // null = 自动计算
  completionRate: 95.5      // 固定值
});
```

#### 计算逻辑

- **部门数量**: 过滤掉表数量为0的部门后计数
- **表数量**: 汇总所有部门的"部门汇聚清单（表数量）"
- **数据量**: 汇总所有部门的"贴源层（数据量）"
- **完成率**: (贴源层表数量 / 部门表数量) × 100%

### 3. validateData() - 数据验证

验证汇总数据和明细数据的完整性和一致性。

**输入**:
- `summaryData`: 汇总数据
- `detailData`: 明细数据

**输出**: 验证结果对象

```javascript
{
  isValid: true,
  warnings: [
    "明细数据中存在汇总数据中没有的部门: XXX"
  ]
}
```

#### 验证项目

1. **汇总数据验证**:
   - ✅ 数据不为空
   - ✅ 必填字段存在（部门名称、各层级表数量和数据量）
   - ✅ 部门名称不为空
   - ✅ 表数量字段为有效数字

2. **明细数据验证**:
   - ✅ 必填字段存在（部门、表中文名）
   - ✅ 部门名称与汇总数据匹配

3. **控制台输出**:
   - 所有验证警告信息输出到控制台
   - 验证通过时输出确认信息

### 4. 辅助方法

#### handleEmptyValue()

处理空值字段，将空值转换为默认显示值。

```javascript
handleEmptyValue(value, defaultValue = '-')
// null, undefined, '' → '-'
// '正常' → '正常'
```

#### cleanDetailData()

清洗明细数据，处理所有字段的空值。

```javascript
const cleanedData = transformer.cleanDetailData(detailData);
// 所有空值字段都会被替换为 '-'
```

## 数据流程

```
汇总CSV数据
    ↓
transformToSankeyData()
    ↓
桑基图数据 { nodes, links }
    ↓
桑基图渲染
```

```
汇总CSV数据 + 配置
    ↓
calculateOverallStats()
    ↓
统计指标 { departmentCount, tableCount, ... }
    ↓
概览面板显示
```

```
汇总数据 + 明细数据
    ↓
validateData()
    ↓
验证结果 { isValid, warnings }
    ↓
控制台输出 / 错误提示
```

## 测试

运行测试页面验证实现：

```bash
# 在浏览器中打开
test-data-transformer.html
```

测试覆盖：
1. ✅ 数据加载和转换
2. ✅ 统计计算（自动计算和固定值）
3. ✅ 数据验证
4. ✅ 桑基图数据结构检查

## 需求覆盖

### 需求2.4-2.12 (桑基图数据流向可视化)
- ✅ 2.4: 为每个部门创建独立节点
- ✅ 2.5: 创建单一前置机节点
- ✅ 2.6: 创建单一前置仓节点
- ✅ 2.7: 创建单一贴源层节点
- ✅ 2.8: 使用表数量字段作为流量值
- ✅ 2.9: 使用前置机表数量作为流量值
- ✅ 2.10: 使用前置仓表数量作为流量值
- ✅ 2.12: 形成完整的数据流转路径

### 需求1.2-1.6 (整体汇聚情况)
- ✅ 1.2: 支持手动设置固定值
- ✅ 1.3: 展示总部门数量
- ✅ 1.4: 展示总表数量
- ✅ 1.5: 展示总数据量
- ✅ 1.6: 展示数据汇聚完成率

### 需求9.6-9.9 (数据准确性)
- ✅ 9.6: 过滤表数量为0的部门
- ✅ 9.7: 处理空值字段
- ✅ 9.8: 验证部门名称匹配
- ✅ 9.9: 控制台输出验证信息

## 使用示例

```javascript
// 创建实例
const dataLoader = new DataLoader();
const dataTransformer = new DataTransformer();

// 加载数据
const summaryData = await dataLoader.loadCSV('汇总.csv');
const detailData = await dataLoader.loadCSV('明细.csv');

// 验证数据
const validation = dataTransformer.validateData(summaryData, detailData);
if (!validation.isValid) {
  console.error('数据验证失败', validation.warnings);
}

// 转换为桑基图数据
const sankeyData = dataTransformer.transformToSankeyData(summaryData);
console.log('节点数:', sankeyData.nodes.length);
console.log('连接数:', sankeyData.links.length);

// 计算统计数据
const stats = dataTransformer.calculateOverallStats(summaryData, {
  completionRate: 95.5  // 使用固定值
});
console.log('统计结果:', stats);

// 清洗明细数据
const cleanedDetail = dataTransformer.cleanDetailData(detailData);
```

## 性能考虑

- 使用数组的 `filter`、`map`、`reduce` 方法进行高效数据处理
- 避免不必要的循环和重复计算
- 支持100+部门的数据处理（已测试45个部门）

## 下一步

DataTransformer 模块已完成，可以继续实现：
- 任务 4: 整体汇聚情况展示模块 (OverviewPanel)
- 任务 5: 桑基图渲染模块 (SankeyRenderer)
- 任务 6: 交互处理模块 (InteractionHandler)
- 任务 7: 明细列表渲染模块 (TableRenderer)
