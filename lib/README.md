# 外部库说明

本项目使用以下外部库，通过CDN方式加载：

## D3.js v7
- **用途**: 数据可视化基础库
- **CDN链接**: https://cdn.jsdelivr.net/npm/d3@7
- **官方文档**: https://d3js.org/

## d3-sankey v0.12
- **用途**: 桑基图布局算法
- **CDN链接**: https://cdn.jsdelivr.net/npm/d3-sankey@0.12
- **官方文档**: https://github.com/d3/d3-sankey

## 为什么使用CDN？

1. **简化部署**: 无需下载和管理库文件
2. **自动更新**: 使用最新的稳定版本
3. **性能优化**: CDN提供全球分布式缓存
4. **减小项目体积**: 不需要将库文件包含在项目中

## 离线使用

如果需要离线使用，可以下载以下文件到本目录：

```bash
# 下载 D3.js
curl -o d3.min.js https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js

# 下载 d3-sankey
curl -o d3-sankey.min.js https://cdn.jsdelivr.net/npm/d3-sankey@0.12/dist/d3-sankey.min.js
```

然后修改 index.html 中的引用：

```html
<!-- 本地引用 -->
<script src="lib/d3.min.js"></script>
<script src="lib/d3-sankey.min.js"></script>
```
