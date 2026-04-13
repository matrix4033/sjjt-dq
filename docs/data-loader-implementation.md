# 数据加载模块实现文档

## 概述

数据加载模块（Task 2）已完成实现，包含三个核心类：
- `DataLoader`: CSV文件加载和解析
- `ErrorHandler`: 统一错误处理
- `LoadingIndicator`: 加载状态管理

## 实现的功能

### 2.1 DataLoader类 - CSV文件加载

**实现的方法：**

1. `loadCSV(filePath)` - 异步加载单个CSV文件
   - 使用fetch API读取文件
   - 自动处理UTF-8编码的中文字符
   - 处理文件不存在错误（404）
   - 处理网络错误

2. `parseCSV(csvText)` - 解析CSV文本
   - 使用D3.js的`d3.csvParse`方法
   - 自动处理CSV特殊字符（逗号、引号、换行符）
   - 验证数据不为空

3. `loadMultipleCSV(filePaths)` - 同时加载多个CSV文件
   - 使用Promise.all并行加载
   - 返回键值对对象

**特性：**
- ✅ 处理UTF-8编码的中文字符
- ✅ 处理CSV中的特殊字符（逗号、引号、换行符）
- ✅ 异步加载，不阻塞UI
- ✅ 完整的错误处理

### 2.2 ErrorHandler类 - 错误处理机制

**实现的方法：**

1. `handle(error, context)` - 统一错误处理入口
   - 在控制台输出详细错误信息（用于调试）
   - 显示用户友好的错误提示

2. `getUserMessage(error, context)` - 生成用户友好的错误消息
   - 文件加载错误
   - CSV解析错误
   - 数据验证错误
   - 渲染错误

3. `showErrorMessage(message)` - 显示错误消息
   - 在页面右上角显示错误提示
   - 5秒后自动消失
   - 支持多个错误消息同时显示

4. `clearErrors()` - 清除所有错误消息

**错误类型处理：**
- ✅ 文件不存在错误（404）
- ✅ 网络访问错误
- ✅ CSV格式错误
- ✅ 数据为空错误

### 2.3 LoadingIndicator类 - 加载状态指示器

**实现的方法：**

1. `show(message)` - 显示加载指示器
   - 全屏遮罩
   - 旋转动画
   - 可自定义加载消息

2. `hide()` - 隐藏加载指示器

3. `updateMessage(message)` - 更新加载消息
   - 在加载过程中动态更新提示文本

**特性：**
- ✅ 全屏半透明遮罩
- ✅ 旋转加载动画
- ✅ 可自定义加载文本
- ✅ 平滑的显示/隐藏过渡

## 使用示例

### 基本使用

```javascript
// 创建DataLoader实例
const dataLoader = new DataLoader();

// 显示加载指示器
LoadingIndicator.show('正在加载数据...');

try {
  // 加载CSV文件
  const data = await dataLoader.loadCSV('data/汇总.csv');
  
  // 隐藏加载指示器
  LoadingIndicator.hide();
  
  // 处理数据
  console.log(`加载了 ${data.length} 条记录`);
  
} catch (error) {
  // 隐藏加载指示器
  LoadingIndicator.hide();
  
  // 处理错误
  ErrorHandler.handle(error, 'load_data');
}
```

### 同时加载多个文件

```javascript
const dataLoader = new DataLoader();

LoadingIndicator.show('正在加载数据...');

try {
  const data = await dataLoader.loadMultipleCSV({
    summary: 'data/汇总.csv',
    detail: 'data/明细.csv'
  });
  
  LoadingIndicator.hide();
  
  console.log('汇总数据:', data.summary);
  console.log('明细数据:', data.detail);
  
} catch (error) {
  LoadingIndicator.hide();
  ErrorHandler.handle(error, 'load_multiple');
}
```

## 测试

已创建测试页面 `test-data-loader.html`，可以测试以下功能：

1. ✅ 加载汇总数据（data/汇总.csv）
2. ✅ 加载明细数据（data/明细.csv）
3. ✅ 同时加载两个文件
4. ✅ 错误处理（不存在的文件）

**运行测试：**
1. 在浏览器中打开 `test-data-loader.html`
2. 点击各个测试按钮
3. 查看测试结果

## 满足的需求

### 需求5.1 - 异步数据加载
✅ 使用fetch API异步读取CSV文件，不阻塞页面渲染

### 需求5.2 - 文件不存在错误处理
✅ 检测404错误，显示友好提示

### 需求5.3 - 数据格式错误处理
✅ 捕获CSV解析错误，显示具体错误原因

### 需求5.4 - 加载状态指示器
✅ 在数据加载时显示全屏加载动画

### 需求5.5 - 加载完成后隐藏指示器
✅ 数据加载完成后自动隐藏加载指示器

### 需求9.3 - 中文字符处理
✅ 正确解析UTF-8编码的中文字符

### 需求9.4 - 逗号处理
✅ 使用d3.csvParse自动处理CSV中的逗号

### 需求9.5 - 换行符处理
✅ 使用d3.csvParse自动处理CSV中的换行符

### 需求9.9 - 错误信息输出
✅ 在控制台输出详细错误信息用于调试

## 技术细节

### CSV解析
使用D3.js的`d3.csvParse`方法，该方法：
- 符合RFC 4180标准
- 自动处理引号内的逗号和换行符
- 自动去除BOM标记
- 支持UTF-8编码

### 错误处理策略
1. 在DataLoader中捕获底层错误
2. 转换为用户友好的错误消息
3. 通过ErrorHandler统一显示
4. 在控制台保留详细错误信息用于调试

### 加载指示器设计
- 使用CSS动画实现旋转效果
- 全屏遮罩防止用户操作
- z-index: 9999 确保在最上层
- 半透明背景保持页面可见性

## 文件结构

```
js/
└── data-loader.js          # 数据加载模块
    ├── DataLoader          # CSV加载和解析
    ├── ErrorHandler        # 错误处理
    └── LoadingIndicator    # 加载状态管理

test-data-loader.html       # 测试页面
```

## 下一步

数据加载模块已完成，可以继续实现：
- Task 3: 数据转换模块
- Task 4: 整体汇聚情况展示模块
- Task 5: 桑基图渲染模块

## 注意事项

1. **浏览器兼容性**：需要支持fetch API和async/await（现代浏览器均支持）
2. **CORS限制**：本地文件访问可能受CORS限制，建议使用本地Web服务器
3. **文件路径**：确保CSV文件路径正确，相对于HTML文件的位置
4. **D3.js依赖**：确保在使用DataLoader前已加载D3.js库
