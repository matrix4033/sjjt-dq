/**
 * 桑基图渲染模块 (SankeyRenderer)
 * 负责使用D3.js和d3-sankey渲染桑基图
 */

class SankeyRenderer {
  /**
   * 初始化桑基图渲染器
   * @param {string} containerId - 容器DOM元素ID
   * @param {Object} config - 配置参数
   */
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    // 根据屏幕宽度调整配置（响应式，以4K为基准）
    const screenWidth = window.innerWidth;
    let nodeWidth = 20;  // 4K基准
    let nodePadding = 30;  // 4K基准
    
    if (screenWidth < 1920) {
      // 小于1080p：缩小到40%
      nodeWidth = 8;
      nodePadding = 12;
    } else if (screenWidth < 2560) {
      // 1080p：缩小到50%
      nodeWidth = 10;
      nodePadding = 15;
    } else if (screenWidth < 3200) {
      // 2K/3K（如2880x1800）：缩小到75%
      nodeWidth = 15;
      nodePadding = 23;
    } else {
      // 4K及以上：保持基准
      nodeWidth = 20;
      nodePadding = 30;
    }
    
    // 默认配置 - 使用统一的蓝绿渐变色系
    this.config = {
      width: 1200,
      height: 600,
      nodeWidth: nodeWidth,
      nodePadding: nodePadding,
      colors: {
        department: ["#9DC7DD", "#7AB8D3"],  // 浅蓝色渐变（部门层）
        server: ["#6BB8C8", "#5AA8B8"],      // 青蓝色渐变（前置机层）
        warehouse: ["#5BA88F", "#4A9880"],   // 青绿色渐变（前置仓层）
        source: ["#3D9F3C", "#2D8F2C"]       // 深绿色渐变（贴源层/完成）
      },
      linkOpacity: 0.6,
      linkOpacityHover: 0.9,
      ...config
    };
    
    this.svg = null;
    this.currentData = null;
    this.exceptionRateCalculator = null;  // 异常率计算器实例
    this.zoomLevel = 1;  // 缩放级别
    
    // 初始化SVG容器
    this.initSVG();
  }
  
  /**
   * 初始化SVG容器和defs定义区域
   */
  initSVG() {
    // 创建SVG元素 - 使用配置的固定尺寸，允许滚动查看
    this.svg = d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .attr('class', 'sankey-chart');
    
    // 创建主绘图组
    this.mainGroup = this.svg.append('g')
      .attr('class', 'main-group');
    
    // 创建defs区域用于定义渐变色
    const defs = this.svg.append('defs');
    
    // 定义部门节点渐变色（高饱和蓝色，垂直方向）
    const departmentGradient = defs.append('linearGradient')
      .attr('id', 'gradient-department')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    departmentGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', `stop-color:${this.config.colors.department[0]};stop-opacity:1`);
    
    departmentGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', `stop-color:${this.config.colors.department[1]};stop-opacity:1`);
    
    // 定义前置机节点渐变色（高饱和绿色，垂直方向）
    const serverGradient = defs.append('linearGradient')
      .attr('id', 'gradient-server')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    serverGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', `stop-color:${this.config.colors.server[0]};stop-opacity:1`);
    
    serverGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', `stop-color:${this.config.colors.server[1]};stop-opacity:1`);
    
    // 定义前置仓节点渐变色（高饱和橙色，垂直方向）
    const warehouseGradient = defs.append('linearGradient')
      .attr('id', 'gradient-warehouse')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    warehouseGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', `stop-color:${this.config.colors.warehouse[0]};stop-opacity:1`);
    
    warehouseGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', `stop-color:${this.config.colors.warehouse[1]};stop-opacity:1`);
    
    // 定义贴源层节点渐变色（高饱和紫色，垂直方向）
    const sourceGradient = defs.append('linearGradient')
      .attr('id', 'gradient-source')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    sourceGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', `stop-color:${this.config.colors.source[0]};stop-opacity:1`);
    
    sourceGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', `stop-color:${this.config.colors.source[1]};stop-opacity:1`);
  }
  
  /**
   * 获取节点渐变色ID
   * @param {string} nodeType - 节点类型
   * @returns {string} 渐变色ID
   */
  getNodeGradient(nodeType) {
    const gradientMap = {
      department: 'url(#gradient-department)',
      server: 'url(#gradient-server)',
      warehouse: 'url(#gradient-warehouse)',
      source: 'url(#gradient-source)'
    };
    
    return gradientMap[nodeType] || 'url(#gradient-department)';
  }
  
  /**
   * 设置异常率计算器实例
   * @param {ExceptionRateCalculator} calculator - 异常率计算器实例
   */
  setExceptionRateCalculator(calculator) {
    this.exceptionRateCalculator = calculator;
  }
  
  /**
   * 创建连接线水平渐变（从起点到终点）
   * @param {Object} link - 连接线对象
   * @param {string} linkId - 连接线唯一ID
   * @returns {string} 渐变色URL
   */
  createLinkGradient(link, linkId) {
    const defs = this.svg.select('defs');
    
    // 使用连接线的颜色（已经过状态叠加处理）
    const linkColor = link.color || link.baseColor || '#00D9FF';
    
    // 创建水平渐变（x1=0%, x2=100%，与数据流动方向一致）
    const gradient = defs.append('linearGradient')
      .attr('id', `link-gradient-${linkId}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%')
      .attr('gradientUnits', 'userSpaceOnUse');
    
    // 起点颜色（稍亮）
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('style', `stop-color:${linkColor};stop-opacity:1`);
    
    // 终点颜色（稍暗）
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('style', `stop-color:${this.darkenColor(linkColor, 0.2)};stop-opacity:1`);
    
    return `url(#link-gradient-${linkId})`;
  }
  
  /**
   * 加深颜色
   * @param {string} color - 十六进制颜色
   * @param {number} factor - 加深因子（0-1）
   * @returns {string} 加深后的颜色
   */
  darkenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r * (1 - factor));
    const newG = Math.round(g * (1 - factor));
    const newB = Math.round(b * (1 - factor));
    
    const toHex = (x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  }
  
  /**
   * 获取节点主色（用于发光效果）
   * @param {string} nodeType - 节点类型
   * @returns {string} 主色
   */
  getNodeMainColor(nodeType) {
    const colorMap = {
      department: this.config.colors.department[0],
      server: this.config.colors.server[0],
      warehouse: this.config.colors.warehouse[0],
      source: this.config.colors.source[0]
    };
    
    return colorMap[nodeType] || '#00D9FF';
  }
  
  /**
   * 渲染节点
   * @param {Array} nodes - 节点数组
   */
  renderNodes(nodes) {
    const nodeGroup = this.mainGroup.append('g').attr('class', 'nodes');
    
    const nodeElements = nodeGroup.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('data-id', d => d.id)
      .attr('data-type', d => d.type);
    
    // 渲染节点矩形，添加发光效果和最小高度
    nodeElements.append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => {
        // 如果节点太小，调整y坐标以保持居中
        const originalHeight = d.y1 - d.y0;
        const minHeight = this.calculateNodeMinHeight(d);
        if (originalHeight < minHeight) {
          return d.y0 - (minHeight - originalHeight) / 2;
        }
        return d.y0;
      })
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => {
        // 确保节点有最小高度
        const originalHeight = d.y1 - d.y0;
        return Math.max(originalHeight, this.calculateNodeMinHeight(d));
      })
      .attr('fill', d => this.getNodeGradient(d.type))
      .attr('stroke', '#333333')
      .attr('stroke-width', 2)
      .attr('rx', d => {
        // 小节点使用更圆润的边角
        const height = Math.max(d.y1 - d.y0, this.calculateNodeMinHeight(d));
        return height < 15 ? 3 : 2;
      })
      .style('filter', d => {
        const mainColor = this.getNodeMainColor(d.type);
        const rgb = this.hexToRgb(mainColor);
        // 小节点增强发光效果
        const value = d.value || 0;
        const glowIntensity = value <= 10 ? 0.9 : 0.6;
        return `drop-shadow(0 0 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowIntensity}))`;
      })
      .style('cursor', d => d.type === 'department' ? 'pointer' : 'default');
    
    // 为部门节点添加标签背景框（增强可读性）- 已移除以避免遮挡连接线
    // 部门标签现在使用文字阴影来增强可读性，不再使用背景框
    
    // 渲染节点标签（智能布局，避免重叠）
    const labelElements = nodeElements.append('text')
      .attr('class', 'node-label')
      .attr('x', d => this.calculateLabelX(d))
      .attr('y', d => this.calculateLabelY(d, nodes))
      .attr('dy', '0.35em')
      .attr('text-anchor', d => {
        // 部门节点（depth=0）：右对齐
        if (d.depth === 0) return 'end';
        // 其他节点：根据位置决定
        return d.x0 < this.config.width / 2 ? 'start' : 'end';
      })
      .text(d => d.name)
      .style('font-family', 'var(--font-family-base)')
      .style('font-size', d => {
        // 部门节点使用更大的字体
        if (d.depth === 0) return '18px';  // 从14px放大到18px
        return this.calculateLabelFontSize(d);
      })
      .style('font-weight', d => {
        // 部门节点使用更粗的字重
        if (d.depth === 0) return '600';
        return '500';
      })
      .style('letter-spacing', '0.5px')  // 增加字间距
      .style('fill', '#FFFFFF')
      .style('text-shadow', d => {
        // 部门节点使用更强的阴影效果
        if (d.depth === 0) return '0 0 8px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8)';
        return '0 0 4px rgba(0, 0, 0, 0.8)';
      })
      .style('pointer-events', d => {
        // 部门节点的标签可以接收鼠标事件
        if (d.depth === 0) return 'all';
        return 'none';
      })
      .style('cursor', d => {
        // 部门节点的标签显示指针
        if (d.depth === 0) return 'pointer';
        return 'default';
      });
    
    // 背景框已移除，不再需要更新背景框尺寸
    
    // 为部门节点添加引导线（从标签右端连接到节点左边）
    const departmentLabels = nodeElements.filter(d => d.depth === 0);
    
    // 先渲染标签，然后根据实际文本宽度添加引导线
    departmentLabels.each(function(d) {
      const labelElement = d3.select(this).select('.node-label');
      const labelBBox = labelElement.node().getBBox();
      const labelX = parseFloat(labelElement.attr('x'));
      const labelY = parseFloat(labelElement.attr('y'));
      const nodeY = (d.y0 + d.y1) / 2;
      
      // 只在标签和节点Y坐标相差较大时才显示引导线
      if (Math.abs(labelY - nodeY) > 5) {
        d3.select(this).append('line')
          .attr('class', 'label-connector')
          .attr('x1', labelX + 4)  // 从标签右端开始（标签是右对齐的，所以labelX就是右端）
          .attr('y1', labelY)
          .attr('x2', d.x0)  // 到节点左边
          .attr('y2', nodeY)
          .attr('stroke', '#666666')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.5)
          .style('pointer-events', 'none');
      }
    });
    
    // 节点内部数值已隐藏，通过悬浮提示框显示详细信息
    // 如需显示，可取消下方注释
    
    /*
    // 在前置机、前置仓、贴源层节点内部居中显示表数量数值（白色文字，12px，粗体）
    nodeElements.filter(d => d.type === 'server')
      .append('text')
      .attr('class', 'node-value')
      .attr('x', d => (d.x0 + d.x1) / 2)
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(d => d.totalTableCount || '')
      .style('font-size', '12px')
      .style('fill', '#FFFFFF')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');
    
    nodeElements.filter(d => d.type === 'warehouse' || d.type === 'source')
      .append('text')
      .attr('class', 'node-value')
      .attr('x', d => (d.x0 + d.x1) / 2)
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(d => d.value || '')
      .style('font-size', '12px')
      .style('fill', '#FFFFFF')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');
    */
  }
  
  /**
   * 将十六进制颜色转换为RGB
   * @param {string} hex - 十六进制颜色
   * @returns {Object} {r, g, b}
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 217, b: 255 };
  }
  
  /**
   * 计算节点的最小高度（确保小数值节点清晰可见）
   * @param {Object} node - 节点数据
   * @returns {number} 最小高度（像素）
   */
  calculateNodeMinHeight(node) {
    const value = node.value || 0;
    
    // 根据数值分段设置最小高度
    if (value <= 1) {
      return 12;  // 1张表：12px高度
    } else if (value <= 5) {
      return 10;  // 2-5张表：10px高度
    } else if (value <= 10) {
      return 8;   // 6-10张表：8px高度
    } else {
      return 6;   // 10张表以上：6px最小高度
    }
  }
  
  /**
   * 计算标签的X坐标（根据节点位置）
   * @param {Object} node - 节点数据
   * @returns {number} X坐标
   */
  calculateLabelX(node) {
    // 部门节点（depth=0）：标签在节点左侧，右对齐到节点左边缘
    if (node.depth === 0) {
      // 标签右对齐到节点左边缘，留出一点间距
      return node.x0 - 10;  // 节点左边缘左侧10px，右对齐
    }
    
    // 其他节点：左侧节点标签在右边，右侧节点标签在左边
    const isLeftSide = node.x0 < this.config.width / 2;
    const offset = node.value <= 10 ? 8 : 6;  // 小节点增加偏移量
    return isLeftSide ? node.x1 + offset : node.x0 - offset;
  }
  
  /**
   * 计算标签的Y坐标（智能避免重叠 - 使用缓存避免递归）
   * @param {Object} node - 当前节点
   * @param {Array} allNodes - 所有节点
   * @returns {number} Y坐标
   */
  calculateLabelY(node, allNodes) {
    const centerY = (node.y0 + node.y1) / 2;
    
    // 只对部门节点（第一列）进行智能布局
    if (node.depth !== 0) {
      return centerY;
    }
    
    // 初始化标签位置缓存（如果不存在）
    if (!this.labelPositionCache) {
      this.labelPositionCache = this.calculateAllLabelPositions(allNodes);
    }
    
    // 从缓存中获取位置
    return this.labelPositionCache[node.id] || centerY;
  }
  
  /**
   * 一次性计算所有部门节点的标签位置（避免递归）
   * @param {Array} allNodes - 所有节点
   * @returns {Object} 节点ID到Y坐标的映射
   */
  calculateAllLabelPositions(allNodes) {
    const positions = {};
    const minLabelSpacing = 22;  // 标签最小间距（增加到22px，避免堆叠）
    const maxOffset = 50;  // 最大偏移量（增加到50px，允许更大的调整范围）
    
    // 获取所有部门节点，按Y坐标排序
    const departmentNodes = allNodes
      .filter(n => n.depth === 0)
      .sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);
    
    // 逐个计算标签位置
    departmentNodes.forEach((node, index) => {
      const centerY = (node.y0 + node.y1) / 2;
      let proposedY = centerY;
      
      // 检查与所有已计算的标签的距离
      for (let i = 0; i < index; i++) {
        const prevNode = departmentNodes[i];
        const prevLabelY = positions[prevNode.id];
        
        // 如果太近，需要调整
        if (Math.abs(proposedY - prevLabelY) < minLabelSpacing) {
          // 向下偏移到安全距离
          proposedY = prevLabelY + minLabelSpacing;
        }
      }
      
      // 限制最大偏移量
      const offset = proposedY - centerY;
      if (Math.abs(offset) > maxOffset) {
        proposedY = centerY + (offset > 0 ? maxOffset : -maxOffset);
      }
      
      positions[node.id] = proposedY;
    });
    
    return positions;
  }
  
  /**
   * 计算标签字体大小（根据节点大小）
   * @param {Object} node - 节点数据
   * @returns {string} 字体大小
   */
  calculateLabelFontSize(node) {
    const value = node.value || 0;
    
    // 小节点使用较小字体，避免标签过大
    if (value <= 5) {
      return '12px';
    } else if (value <= 20) {
      return '13px';
    } else {
      return '14px';
    }
  }
  
  /**
   * 智能计算连接线宽度（确保小数值也清晰可见，同时保持比例）
   * @param {Object} link - 连接线数据
   * @returns {number} 计算后的宽度
   */
  calculateLinkWidth(link) {
    const originalWidth = link.width || 1;  // d3-sankey计算的比例宽度
    
    // 根据原始宽度设置最小宽度阈值
    // 保持d3-sankey的比例关系，只为太细的连接线设置最小可见宽度
    if (originalWidth < 2) {
      return 2;  // 最小2px，确保可见
    } else if (originalWidth < 4) {
      return Math.max(originalWidth, 3);  // 2-4px之间，最小3px
    } else {
      return originalWidth;  // 使用d3-sankey计算的原始宽度
    }
  }
  
  /**
   * 获取连接线的发光颜色（用于小数值增强）
   * @param {Object} link - 连接线数据
   * @returns {string} 颜色值
   */
  getLinkGlowColor(link) {
    // 根据连接线的状态统计决定发光颜色
    const stats = link.statusStats;
    if (stats && stats.total > 0) {
      const normalRate = stats.normal / stats.total;
      const abnormalRate = stats.abnormal / stats.total;
      
      if (abnormalRate > 0.5) {
        return '#FF4444';  // 异常率高：红色发光
      } else if (normalRate > 0.8) {
        return '#00FF88';  // 正常率高：绿色发光
      } else {
        return '#FF9500';  // 混合状态：橙色发光
      }
    }
    
    // 默认使用源节点颜色
    const sourceType = link.source.type;
    return this.getNodeMainColor(sourceType);
  }
  
  /**
   * 渲染连接线
   * @param {Array} links - 连接线数组
   */
  renderLinks(links) {
    const linkGroup = this.mainGroup.append('g')
      .attr('class', 'links')
      .attr('fill', 'none');
    
    // 使用d3-sankey的link生成器
    const link = d3.sankeyLinkHorizontal();
    
    linkGroup.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', d => {
        // 如果有异常，添加特殊class用于告警动画
        const hasAbnormal = d.statusStats && d.statusStats.abnormal > 0;
        return hasAbnormal ? 'link link-abnormal' : 'link';
      })
      .attr('d', link)
      .attr('stroke', (d, i) => {
        // 为每个连接线创建水平渐变
        return this.createLinkGradient(d, i);
      })
      .attr('stroke-width', d => this.calculateLinkWidth(d))  // 使用智能宽度计算
      .attr('opacity', this.config.linkOpacity)
      .attr('data-source', d => d.source.name)
      .attr('data-target', d => d.target.name)
      .attr('data-value', d => d.value)
      .attr('data-department', d => d.department || '')
      .attr('data-stage', d => d.stage || '')
      .attr('data-abnormal-count', d => d.statusStats ? d.statusStats.abnormal : 0)  // 存储异常数量
      .attr('data-status-distribution', d => {
        // 存储推送状态统计
        if (d.statusStats) {
          return JSON.stringify(d.statusStats);
        }
        return '';
      })
      .attr('data-glow-color', d => this.getLinkGlowColor(d))  // 存储发光颜色供悬停使用
      .style('cursor', 'pointer');
  }
  
  /**
   * 渲染推送状态颜色图例（右下角，确保在容器内）
   */
  renderLegend() {
    const legendGroup = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.config.width - 210}, ${this.config.height - 130})`);
    
    // 图例容器背景
    legendGroup.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 180)
      .attr('height', 100)
      .attr('fill', 'rgba(30, 30, 30, 0.9)')
      .attr('stroke', '#444444')
      .attr('stroke-width', 1)
      .attr('rx', 6);
    
    // 图例标题
    legendGroup.append('text')
      .attr('x', 90)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .text('连接线状态')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', '#FFFFFF');
    
    // 状态项数据（新配色方案）
    const statusItems = [
      { label: '健康（正常率高）', color: '#3D9F3C', y: 40 },
      { label: '异常（告警）', color: '#FF4444', y: 60 },
      { label: '未推送', color: '#9DC7DD', y: 80 }
    ];
    
    // 渲染状态项
    statusItems.forEach(item => {
      // 色块
      legendGroup.append('rect')
        .attr('x', 15)
        .attr('y', item.y)
        .attr('width', 20)
        .attr('height', 12)
        .attr('fill', item.color)
        .attr('rx', 2)
        .style('filter', item.label.includes('告警') ? 'drop-shadow(0 0 4px rgba(255, 68, 68, 0.6))' : 'none');
      
      // 标签
      legendGroup.append('text')
        .attr('x', 45)
        .attr('y', item.y + 10)
        .text(item.label)
        .style('font-size', '11px')
        .style('fill', '#FFFFFF');
    });
  }
  
  /**
   * 渲染缩放控制按钮（右下角，避免遮挡内容）
   */
  renderZoomControls() {
    const controlsGroup = this.svg.append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${this.config.width - 60}, ${this.config.height - 160})`);
    
    // 放大按钮
    const zoomInButton = controlsGroup.append('g')
      .attr('class', 'zoom-button')
      .attr('transform', 'translate(0, 0)')
      .style('cursor', 'pointer')
      .on('click', () => this.zoomIn());
    
    zoomInButton.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 40)
      .attr('height', 40)
      .attr('fill', 'rgba(30, 30, 30, 0.9)')
      .attr('stroke', '#444444')
      .attr('stroke-width', 1)
      .attr('rx', 6);
    
    zoomInButton.append('text')
      .attr('x', 20)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('+')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('fill', '#FFFFFF')
      .style('pointer-events', 'none');
    
    // 缩小按钮
    const zoomOutButton = controlsGroup.append('g')
      .attr('class', 'zoom-button')
      .attr('transform', 'translate(0, 50)')
      .style('cursor', 'pointer')
      .on('click', () => this.zoomOut());
    
    zoomOutButton.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 40)
      .attr('height', 40)
      .attr('fill', 'rgba(30, 30, 30, 0.9)')
      .attr('stroke', '#444444')
      .attr('stroke-width', 1)
      .attr('rx', 6);
    
    zoomOutButton.append('text')
      .attr('x', 20)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('−')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('fill', '#FFFFFF')
      .style('pointer-events', 'none');
    
    // 重置按钮
    const resetButton = controlsGroup.append('g')
      .attr('class', 'zoom-button')
      .attr('transform', 'translate(0, 100)')
      .style('cursor', 'pointer')
      .on('click', () => this.resetZoom());
    
    resetButton.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 40)
      .attr('height', 40)
      .attr('fill', 'rgba(30, 30, 30, 0.9)')
      .attr('stroke', '#444444')
      .attr('stroke-width', 1)
      .attr('rx', 6);
    
    resetButton.append('text')
      .attr('x', 20)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('⟲')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#FFFFFF')
      .style('pointer-events', 'none');
  }
  
  /**
   * 放大
   */
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
    this.applyZoom();
  }
  
  /**
   * 缩小
   */
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
    this.applyZoom();
  }
  
  /**
   * 重置缩放
   */
  resetZoom() {
    this.zoomLevel = 1;
    this.applyZoom();
  }
  
  /**
   * 应用缩放变换
   */
  applyZoom() {
    this.mainGroup
      .transition()
      .duration(300)
      .attr('transform', `scale(${this.zoomLevel})`);
  }
  
  /**
   * 渲染层级标签
   * @param {Array} nodes - 节点数组，用于计算每层的实际位置
   */
  renderLayerLabels(nodes) {
    // 按层级分组节点，计算每层的中心位置
    // 使用d3-sankey计算的depth属性（而不是自定义的layer）
    const layerGroups = {
      0: { name: '部门层', nodes: [] },
      1: { name: '前置机层', nodes: [] },
      2: { name: '前置仓层', nodes: [] },
      3: { name: '贴源层', nodes: [] }
    };
    
    // 将节点按depth分组
    nodes.forEach(node => {
      const depth = node.depth || 0;
      if (layerGroups[depth]) {
        layerGroups[depth].nodes.push(node);
      }
    });
    
    // 计算每层的X坐标（取该层所有节点的平均X位置）
    const layers = Object.keys(layerGroups).map(layer => {
      const layerData = layerGroups[layer];
      let x;
      
      if (layerData.nodes.length > 0) {
        // 计算该层所有节点的中心X坐标的平均值
        const avgX = layerData.nodes.reduce((sum, node) => {
          return sum + (node.x0 + node.x1) / 2;
        }, 0) / layerData.nodes.length;
        x = avgX;
      } else {
        // 如果该层没有节点，使用默认位置
        x = this.config.nodePadding + (parseInt(layer) * (this.config.width - 2 * this.config.nodePadding) / 3);
      }
      
      return {
        name: layerData.name,
        x: x
      };
    });
    
    const labelGroup = this.mainGroup.append('g').attr('class', 'layer-labels');
    
    labelGroup.selectAll('.layer-label')
      .data(layers)
      .enter()
      .append('text')
      .attr('class', 'layer-label')
      .attr('x', d => d.x)
      .attr('y', 25)  // 调整到顶部边距内
      .attr('text-anchor', 'middle')
      .text(d => d.name)
      .style('font-family', 'var(--font-family-base)')
      .style('font-size', '15px')
      .style('font-weight', '600')
      .style('letter-spacing', '0.3px')
      .style('fill', '#CCCCCC')  // 使用更亮的颜色以适应暗黑背景
      .style('text-shadow', '0 0 4px rgba(0, 0, 0, 0.8)')  // 添加文字阴影增强可读性
      .style('pointer-events', 'none');
  }
  
  /**
   * 为整个桑基图添加简单的淡入动画
   * @param {Selection} svgGroup - D3选择的SVG组元素
   */
  addFadeInAnimation(svgGroup) {
    svgGroup
      .style('opacity', 0)
      .transition()
      .duration(500)
      .style('opacity', 1);
  }
  
  /**
   * 主渲染方法
   * @param {Object} data - {nodes, links}
   */
  render(data) {
    this.currentData = data;
    
    // 清除标签位置缓存
    this.labelPositionCache = null;
    
    // 使用配置的固定尺寸，不再根据容器尺寸动态调整
    // 这样可以让内容有固定的大小，超出容器时显示滚动条
    // 如果配置中没有指定尺寸，则使用默认值
    if (!this.config.width) {
      this.config.width = 1800;
    }
    if (!this.config.height) {
      this.config.height = 1800;
    }
    
    // 更新SVG尺寸以匹配配置
    this.svg
      .attr('width', this.config.width)
      .attr('height', this.config.height);
    
    // 清除之前的内容（保留defs和mainGroup）
    this.mainGroup.selectAll('*').remove();
    this.svg.selectAll('.legend').remove();
    this.svg.selectAll('.zoom-controls').remove();
    
    // 优化布局边距，为部门标签留出足够空间
    const leftMarginForLabels = 180;  // 增加左侧边距到180px，防止文字被裁剪
    const rightMarginForLabels = 80;  // 减少右侧边距到80px
    
    const margin = { 
      top: 40,                    // 顶部固定40px给层级标签
      right: rightMarginForLabels,  // 右侧边距
      bottom: 20,                 // 底部固定20px
      left: leftMarginForLabels   // 左侧边距，为部门标签留出空间
    };
    
    const sankey = d3.sankey()
      .nodeId(d => d.id)  // 告诉d3-sankey使用id属性来匹配节点
      .nodeWidth(this.config.nodeWidth)
      .nodePadding(this.config.nodePadding)
      .nodeAlign(d3.sankeyJustify)  // 使用justify对齐，自动优化层级间距
      .extent([[margin.left, margin.top], [this.config.width - margin.right, this.config.height - margin.bottom]])
      .iterations(32);  // 增加迭代次数，优化布局
    
    // 计算节点和连接位置
    const { nodes, links } = sankey({
      nodes: data.nodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d))
    });
    
    // 调试：检查d3-sankey计算后的连接线宽度
    console.log('d3-sankey计算结果:');
    console.log('  节点数:', nodes.length);
    console.log('  连接线数:', links.length);
    if (links.length > 0) {
      console.log('  前3条连接线的详细信息:');
      for (let i = 0; i < Math.min(3, links.length); i++) {
        const link = links[i];
        console.log(`    连接线${i+1}:`, {
          value: link.value,
          width: link.width,
          y0: link.y0,
          y1: link.y1,
          source: link.source.id,
          target: link.target.id,
          sourceY0: link.source.y0,
          sourceY1: link.source.y1
        });
      }
    }
    
    // 检查节点信息
    console.log('  前3个节点的信息:');
    for (let i = 0; i < Math.min(3, nodes.length); i++) {
      const node = nodes[i];
      console.log(`    节点${i+1}:`, {
        id: node.id,
        depth: node.depth,
        height: node.height,
        value: node.value,
        y0: node.y0,
        y1: node.y1
      });
    }
    
    // 渲染层级标签（传入计算后的节点数组以获取实际位置）
    this.renderLayerLabels(nodes);
    
    // 渲染连接线（先渲染，在节点下方）
    this.renderLinks(links);
    
    // 渲染节点
    this.renderNodes(nodes);
    
    // 渲染推送状态颜色图例（右下角）
    this.renderLegend();
    
    // 渲染缩放控制按钮（右上角）
    this.renderZoomControls();
    
    // 添加简单的整体淡入动画（500ms）
    const allGroups = this.mainGroup.selectAll('.links, .nodes, .layer-labels');
    this.addFadeInAnimation(allGroups);
  }
  
  /**
   * 更新桑基图
   * @param {Object} data - 新的数据
   */
  update(data) {
    this.render(data);
  }
  
  /**
   * 高亮指定节点
   * @param {string} nodeId - 节点ID
   */
  highlightNode(nodeId) {
    // 清除之前的高亮
    this.mainGroup.selectAll('.node rect')
      .attr('stroke', '#333333')
      .attr('stroke-width', 2);
    
    // 高亮选中节点
    this.mainGroup.select(`[data-id="${nodeId}"] rect`)
      .attr('stroke', '#00D9FF')
      .attr('stroke-width', 3);
  }
  
  /**
   * 清除高亮
   */
  clearHighlight() {
    this.mainGroup.selectAll('.node rect')
      .attr('stroke', '#333333')
      .attr('stroke-width', 2);
  }
}

/**
 * 响应式桑基图渲染器
 * 继承自SankeyRenderer，添加响应式功能
 */
class ResponsiveSankeyRenderer extends SankeyRenderer {
  /**
   * 初始化响应式桑基图渲染器
   * @param {string} containerId - 容器DOM元素ID
   * @param {Object} config - 配置参数
   */
  constructor(containerId, config = {}) {
    super(containerId, config);
    this.resizeHandler = null;
    this.initResponsive();
  }
  
  /**
   * 初始化响应式功能
   */
  initResponsive() {
    // 创建防抖的resize处理函数
    this.resizeHandler = this.debounce(() => {
      this.resize();
    }, 300);
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.resizeHandler);
  }
  
  /**
   * 响应窗口大小变化
   */
  resize() {
    if (!this.currentData) {
      return;
    }
    
    // 重新渲染（render方法会自动获取容器尺寸）
    this.render(this.currentData);
  }
  
  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * 销毁渲染器，清理事件监听器
   */
  destroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    // 清理DOM
    if (this.svg) {
      this.svg.selectAll('*').remove();
    }
    
    this.svg = null;
    this.currentData = null;
    this.mainGroup = null;
  }
}
