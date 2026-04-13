/**
 * 交互处理模块 (InteractionHandler)
 * 负责处理桑基图的交互事件（悬停、点击）
 */

class InteractionHandler {
  /**
   * 初始化交互处理器
   * @param {Object} sankeyRenderer - 桑基图渲染器实例
   * @param {Object} modalRenderer - 弹窗渲染器实例（可选）
   */
  constructor(sankeyRenderer, modalRenderer = null) {
    this.sankeyRenderer = sankeyRenderer;
    this.modalRenderer = modalRenderer;
    this.selectedDepartment = null;
    this.summaryData = null;
    this.detailData = null;
    this.hoverTimeout = null;
    
    // 存储事件监听器引用以便清理
    this.eventListeners = [];
    
    // 创建悬浮提示框元素
    this.createTooltip();
  }
  
  /**
   * 创建悬浮提示框元素
   */
  createTooltip() {
    // 检查是否已存在
    let tooltip = document.getElementById('interaction-tooltip');
    if (tooltip) {
      this.tooltip = tooltip;
      return;
    }
    
    // 创建新的提示框
    tooltip = document.createElement('div');
    tooltip.id = 'interaction-tooltip';
    tooltip.className = 'interaction-tooltip';
    tooltip.style.display = 'none';
    
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
  }
  
  /**
   * 设置汇总数据（用于提示框显示）
   * @param {Array} summaryData - 汇总数据
   */
  setSummaryData(summaryData) {
    this.summaryData = summaryData;
  }
  
  /**
   * 设置明细数据（用于弹窗显示）
   * @param {Array} detailData - 明细数据
   */
  setDetailData(detailData) {
    this.detailData = detailData;
  }
  
  /**
   * 设置弹窗渲染器
   * @param {Object} modalRenderer - 弹窗渲染器实例
   */
  setModalRenderer(modalRenderer) {
    this.modalRenderer = modalRenderer;
  }
  
  /**
   * 初始化交互事件监听
   */
  init() {
    if (!this.sankeyRenderer || !this.sankeyRenderer.svg) {
      console.error('SankeyRenderer not initialized');
      return;
    }
    
    console.log('开始绑定节点事件...');
    // 绑定节点事件
    this.bindNodeEvents();
    console.log('✓ 节点事件绑定完成');
    
    console.log('开始绑定连接线事件...');
    // 绑定连接线事件
    this.bindLinkEvents();
    console.log('✓ 连接线事件绑定完成');
    
    console.log('开始绑定背景点击事件...');
    // 绑定背景点击事件（点击空白区域取消选中）
    this.bindBackgroundClick();
    console.log('✓ 背景点击事件绑定完成');
  }

  /**
   * 绑定节点事件（所有类型节点）
   */
  bindNodeEvents() {
    const self = this;
    const svg = this.sankeyRenderer.svg;
    
    console.log('  - 选择节点...');
    // 选择所有节点
    const nodes = svg.selectAll('.node');
    console.log(`  - 找到 ${nodes.size()} 个节点`);
    
    // 为非部门节点绑定事件（在节点矩形上）
    const nonDeptNodes = nodes.filter(d => d.type !== 'department');
    
    // 绑定mouseenter事件（200毫秒延迟）
    nonDeptNodes.on('mouseenter', function(event, d) {
      // 清除之前的延迟
      if (self.hoverTimeout) {
        clearTimeout(self.hoverTimeout);
      }
      
      // 200毫秒延迟显示提示框（不触发高亮效果）
      self.hoverTimeout = setTimeout(() => {
        // 只显示提示框，不调用handleNodeHover（避免高亮效果）
        self.showTooltip(d, event.pageX, event.pageY);
      }, 200);
    });
    
    // 绑定mousemove事件（更新提示框位置）
    nonDeptNodes.on('mousemove', function(event) {
      self.updateTooltipPosition(event.pageX, event.pageY);
    });
    
    // 绑定mouseleave事件
    nonDeptNodes.on('mouseleave', function(event, d) {
      // 清除延迟
      if (self.hoverTimeout) {
        clearTimeout(self.hoverTimeout);
        self.hoverTimeout = null;
      }
      
      // 隐藏悬浮提示框（不需要恢复样式，因为没有改变样式）
      self.hideTooltip();
    });
    
    console.log('  - 绑定部门节点标签事件...');
    // 为部门节点的标签绑定事件
    const deptLabels = svg.selectAll('.node')
      .filter(d => d.type === 'department')
      .select('.node-label');
    console.log(`  - 找到 ${deptLabels.size()} 个部门标签`);
    
    // 绑定mouseenter事件（200毫秒延迟）
    deptLabels.on('mouseenter', function(event, d) {
      // 清除之前的延迟
      if (self.hoverTimeout) {
        clearTimeout(self.hoverTimeout);
      }
      
      // 200毫秒延迟显示提示框（不触发高亮效果）
      self.hoverTimeout = setTimeout(() => {
        // 只显示提示框，不调用handleNodeHover（避免高亮效果）
        self.showTooltip(d, event.pageX, event.pageY);
      }, 200);
    });
    
    // 绑定mousemove事件（更新提示框位置）
    deptLabels.on('mousemove', function(event) {
      self.updateTooltipPosition(event.pageX, event.pageY);
    });
    
    // 绑定mouseleave事件
    deptLabels.on('mouseleave', function(event, d) {
      // 清除延迟
      if (self.hoverTimeout) {
        clearTimeout(self.hoverTimeout);
        self.hoverTimeout = null;
      }
      
      // 隐藏悬浮提示框（不需要恢复样式，因为没有改变样式）
      self.hideTooltip();
    });
    
    // 绑定点击事件（部门标签）
    deptLabels.on('click', function(event, d) {
      // 阻止事件冒泡到SVG背景
      event.stopPropagation();
      self.handleDepartmentNodeClick(d);
    });
    console.log('  - 部门标签事件绑定完成');
  }
  
  /**
   * 处理节点悬停事件
   * @param {Object} node - 节点数据
   * @param {Event} event - 鼠标事件
   */
  handleNodeHover(node, event) {
    // 如果有部门被选中，不改变样式
    if (this.selectedDepartment) {
      // 只显示提示框
      this.showTooltip(node, event.pageX, event.pageY);
      return;
    }
    
    // 增强节点发光效果
    const nodeElement = this.sankeyRenderer.svg.select(`[data-id="${node.id}"]`);
    nodeElement.select('rect')
      .style('filter', () => {
        const mainColor = this.sankeyRenderer.getNodeMainColor(node.type);
        const rgb = this.sankeyRenderer.hexToRgb(mainColor);
        return `drop-shadow(0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9))`;
      });
    
    // 显示悬浮提示框
    this.showTooltip(node, event.pageX, event.pageY);
  }

  /**
   * 绑定连接线事件
   */
  bindLinkEvents() {
    const self = this;
    const svg = this.sankeyRenderer.svg;
    
    console.log('  - 选择连接线...');
    // 选择所有连接线
    const links = svg.selectAll('.link');
    console.log(`  - 找到 ${links.size()} 条连接线`);
    
    console.log('  - 设置鼠标样式...');
    // 设置鼠标指针为pointer
    links.style('cursor', 'pointer');
    console.log('  - 鼠标样式设置完成');
    
    // 绑定mouseenter事件（200毫秒延迟）
    links.on('mouseenter', function(event, d) {
      // 清除之前的延迟
      if (self.hoverTimeout) {
        clearTimeout(self.hoverTimeout);
      }
      
      // 200毫秒延迟显示提示框
      self.hoverTimeout = setTimeout(() => {
        self.handleLinkHover(d, event, this);
      }, 200);
    });
    
    // 绑定mousemove事件（更新提示框位置）
    links.on('mousemove', function(event) {
      self.updateTooltipPosition(event.pageX, event.pageY);
    });
    
    // 绑定mouseleave事件
    links.on('mouseleave', function(event, d) {
      // 清除延迟
      if (self.hoverTimeout) {
        clearTimeout(self.hoverTimeout);
        self.hoverTimeout = null;
      }
      
      // 如果有部门被选中，不恢复样式
      if (self.selectedDepartment) {
        self.hideTooltip();
        return;
      }
      
      // 恢复连接线样式
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', self.sankeyRenderer.config.linkOpacity)
        .style('filter', 'none');
      
      // 不再恢复节点样式 - 节点保持默认样式
      
      // 隐藏悬浮提示框
      self.hideTooltip();
    });
    
    console.log('  - 绑定连接线点击事件...');
    // 绑定点击事件
    links.on('click', function(event, d) {
      self.handleLinkClick(d, this);
    });
    console.log('  - 连接线点击事件绑定完成');
  }
  
  /**
   * 处理连接线悬停事件
   * @param {Object} link - 连接线数据
   * @param {Event} event - 鼠标事件
   * @param {Element} element - 连接线DOM元素
   */
  handleLinkHover(link, event, element) {
    // 如果有部门被选中，不响应悬停效果
    if (this.selectedDepartment) {
      // 只显示提示框，不改变样式
      this.showTooltip(link, event.pageX, event.pageY);
      return;
    }
    
    const linkElement = d3.select(element);
    
    // 获取存储的发光颜色（用于小数值连接线）
    const glowColor = linkElement.attr('data-glow-color');
    
    // 增强连接线发光效果和不透明度
    linkElement
      .transition()
      .duration(200)
      .attr('opacity', 0.9)
      .style('filter', () => {
        // 优先使用智能发光颜色，否则使用默认颜色
        const color = glowColor || link.color || link.baseColor || '#00D9FF';
        const rgb = this.sankeyRenderer.hexToRgb(color);
        // 小数值连接线使用更强的发光效果
        const glowRadius = link.value <= 10 ? 8 : 6;
        const glowIntensity = link.value <= 10 ? 0.9 : 0.8;
        return `drop-shadow(0 0 ${glowRadius}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowIntensity}))`;
      });
    
    // 不再高亮源节点和目标节点 - 只高亮连接线本身
    
    // 显示悬浮提示框
    this.showTooltip(link, event.pageX, event.pageY);
  }

  /**
   * 绑定背景点击事件
   */
  bindBackgroundClick() {
    const self = this;
    const svg = this.sankeyRenderer.svg;
    const container = this.sankeyRenderer.container;
    
    // 在SVG容器上绑定点击事件
    svg.on('click', function(event) {
      // 检查点击的是否是空白区域（不是节点或连接线）
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      const classList = target.classList || [];
      
      // 如果点击的是SVG背景或main-group（空白区域）
      const isSvgBackground = tagName === 'svg' || 
                             (tagName === 'g' && classList.contains('main-group'));
      
      if (isSvgBackground && self.selectedDepartment) {
        // 点击空白区域，取消选中
        self.clearHighlight();
      }
    });
    
    // 在容器上也绑定点击事件（处理SVG外部的空白区域）
    container.addEventListener('click', function(event) {
      // 检查点击的是否是容器本身（不是SVG内部元素）
      if (event.target === container && self.selectedDepartment) {
        self.clearHighlight();
      }
    });
  }
  
  /**
   * 处理部门节点点击事件
   * @param {Object} node - 节点数据
   */
  handleDepartmentNodeClick(node) {
    const departmentName = node.name;
    
    // 如果点击的是已选中的部门，则取消高亮
    if (this.selectedDepartment === departmentName) {
      this.clearHighlight();
      return;
    }
    
    // 设置选中部门
    this.selectedDepartment = departmentName;
    
    // 高亮部门数据流路径
    this.highlightDepartmentPath(departmentName);
  }
  
  /**
   * 处理连接线点击事件
   * @param {Object} link - 连接线数据
   * @param {Element} element - 连接线DOM元素
   */
  handleLinkClick(link, element) {
    // 保持连接线高亮状态
    d3.select(element)
      .attr('opacity', 0.9)
      .style('filter', () => {
        const linkColor = link.color || link.baseColor || '#00D9FF';
        const rgb = this.sankeyRenderer.hexToRgb(linkColor);
        return `drop-shadow(0 0 6px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8))`;
      });
    
    // 打开明细数据弹窗
    if (this.modalRenderer && this.detailData) {
      this.modalRenderer.openModal(link, this.detailData);
    } else {
      console.warn('Modal renderer or detail data not available');
    }
  }
  
  /**
   * 高亮部门数据流路径
   * @param {string} department - 部门名称
   */
  highlightDepartmentPath(department) {
    const svg = this.sankeyRenderer.svg;
    
    console.log('高亮部门:', department);
    
    // 先恢复所有部门节点的默认样式
    svg.selectAll('.node')
      .filter(d => d.type === 'department')
      .select('rect')
      .attr('stroke', '#333333')
      .attr('stroke-width', 2)
      .style('filter', d => {
        const mainColor = this.sankeyRenderer.getNodeMainColor(d.type);
        const rgb = this.sankeyRenderer.hexToRgb(mainColor);
        return `drop-shadow(0 0 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6))`;
      });
    
    // 为选中的部门节点添加高亮边框和发光效果
    const selectedNodes = svg.selectAll('.node')
      .filter(d => d.type === 'department' && d.name === department);
    
    console.log('找到选中的部门节点数量:', selectedNodes.size());
    
    selectedNodes.select('rect')
      .attr('stroke', '#00D9FF')
      .attr('stroke-width', 3)
      .style('filter', () => {
        const rgb = this.sankeyRenderer.hexToRgb('#00D9FF');
        return `drop-shadow(0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9))`;
      });
    
    // 移除之前的选中标记
    svg.selectAll('.selection-marker').remove();
    
    // 添加新的选中标记
    selectedNodes.append('circle')
      .attr('class', 'selection-marker')
      .attr('cx', d => d.x1 + 10)
      .attr('cy', d => (d.y0 + d.y1) / 2)
      .attr('r', 5)
      .attr('fill', '#00D9FF')
      .style('filter', 'drop-shadow(0 0 4px rgba(0, 217, 255, 0.8))');
    
    // 高亮该部门的所有连接线，并移除异常动画
    svg.selectAll('.link')
      .each(function(d) {
        const link = d3.select(this);
        if (d.department === department) {
          // 高亮该部门的连接线
          link.attr('opacity', 0.9)
              .classed('link-abnormal', false)  // 移除异常动画类
              .style('animation', 'none');      // 禁用动画
        } else {
          // 淡化其他连接线
          link.attr('opacity', 0.2)
              .classed('link-abnormal', false)  // 移除异常动画类
              .style('animation', 'none');      // 禁用动画
        }
      });
  }
  
  /**
   * 取消高亮
   */
  clearHighlight() {
    this.selectedDepartment = null;
    const svg = this.sankeyRenderer.svg;
    
    // 恢复所有节点样式
    svg.selectAll('.node rect')
      .attr('stroke', '#333333')
      .attr('stroke-width', 2)
      .style('filter', d => {
        const mainColor = this.sankeyRenderer.getNodeMainColor(d.type);
        const rgb = this.sankeyRenderer.hexToRgb(mainColor);
        return `drop-shadow(0 0 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6))`;
      });
    
    // 移除选中标记
    svg.selectAll('.selection-marker').remove();
    
    // 恢复所有连接线不透明度和动画
    svg.selectAll('.link')
      .each(function(d) {
        const link = d3.select(this);
        // 恢复异常连接线的动画类
        const hasAbnormal = d.statusStats && d.statusStats.abnormal > 0;
        link.classed('link-abnormal', hasAbnormal)
            .style('animation', null);  // 恢复CSS动画
      })
      .transition()
      .duration(300)
      .attr('opacity', this.sankeyRenderer.config.linkOpacity);
  }

  /**
   * 显示悬浮提示框
   * @param {Object} data - 节点或连接线数据
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  showTooltip(data, x, y) {
    if (!this.tooltip) {
      return;
    }
    
    // 生成提示框内容
    const content = this.generateTooltipContent(data);
    
    // 设置内容
    this.tooltip.innerHTML = content;
    
    // 显示提示框
    this.tooltip.style.display = 'block';
    
    // 定位提示框
    this.updateTooltipPosition(x, y);
  }
  
  /**
   * 隐藏悬浮提示框
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }
  
  /**
   * 更新提示框位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  updateTooltipPosition(x, y) {
    if (!this.tooltip || this.tooltip.style.display === 'none') {
      return;
    }
    
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 默认位置：鼠标右下方
    let left = x + 15;
    let top = y + 15;
    
    // 如果超出右边界，显示在鼠标左侧
    if (left + tooltipRect.width > viewportWidth - 10) {
      left = x - tooltipRect.width - 15;
    }
    
    // 如果超出下边界，显示在鼠标上方
    if (top + tooltipRect.height > viewportHeight - 10) {
      top = y - tooltipRect.height - 15;
    }
    
    // 确保不超出左边界和上边界
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  /**
   * 生成提示框内容
   * @param {Object} data - 节点或连接线数据
   * @returns {string} HTML内容
   */
  generateTooltipContent(data) {
    // 判断是节点还是连接线
    if (data.source && data.target) {
      // 连接线
      return this.generateLinkTooltipContent(data);
    } else {
      // 节点
      return this.generateNodeTooltipContent(data);
    }
  }
  
  /**
   * 生成节点提示框内容
   * @param {Object} node - 节点数据
   * @returns {string} HTML内容
   */
  generateNodeTooltipContent(node) {
    let html = `<div><div class="tooltip-header">${node.name}</div><div class="tooltip-content">`;
    
    if (node.type === 'department') {
      // 部门节点提示框
      const metadata = node.metadata || {};
      const deptTableCount = metadata.departmentTableCount || 0;
      const serverTableCount = metadata.serverTableCount || 0;
      const warehouseTableCount = metadata.warehouseTableCount || 0;
      const sourceTableCount = metadata.sourceTableCount || 0;
      const completionRate = deptTableCount > 0 ? ((sourceTableCount / deptTableCount) * 100).toFixed(1) : 0;
      
      html += `
        <div class="tooltip-row">
          <span class="tooltip-label">总表数量</span>
          <span class="tooltip-value">${this.formatNumber(deptTableCount)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">前置机IP</span>
          <span class="tooltip-value">${metadata.serverName || '-'}</span>
        </div>
        <div style="margin: 12px 0; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">数据流转进度</div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12px; font-weight: 600;">
            <span style="color: #00D9FF; text-shadow: 0 0 8px rgba(0, 217, 255, 0.4);">${this.formatNumber(deptTableCount)}</span>
            <span style="color: rgba(255, 255, 255, 0.3);">→</span>
            <span style="color: #00FF88; text-shadow: 0 0 8px rgba(0, 255, 136, 0.4);">${this.formatNumber(serverTableCount)}</span>
            <span style="color: rgba(255, 255, 255, 0.3);">→</span>
            <span style="color: #FF9500; text-shadow: 0 0 8px rgba(255, 149, 0, 0.4);">${this.formatNumber(warehouseTableCount)}</span>
            <span style="color: rgba(255, 255, 255, 0.3);">→</span>
            <span style="color: #AA00FF; text-shadow: 0 0 8px rgba(170, 0, 255, 0.4);">${this.formatNumber(sourceTableCount)}</span>
          </div>
        </div>
      `;
      
      // 添加推送状态汇总（如果有明细数据）
      if (this.detailData && this.detailData.length > 0) {
        const stages = [
          { name: '部门→前置机', stage: 'toServer' },
          { name: '前置机→前置仓', stage: 'toWarehouse' },
          { name: '前置仓→贴源层', stage: 'toSource' }
        ];
        
        html += '<div style="margin-top: 8px;"><div style="color: #CCCCCC; margin-bottom: 4px; font-size: 11px;">推送状态汇总：</div>';
        
        stages.forEach(({ name, stage }) => {
          const stats = this.calculateStatusStats(node.name, stage);
          if (stats && stats.total > 0) {
            html += `
              <div class="tooltip-row" style="font-size: 11px; padding: 2px 0;">
                <span style="color: rgba(255, 255, 255, 0.6);">${name}</span>
                <span style="display: flex; gap: 8px;">
                  <span style="color: #00FF88;">✓${stats.normal}</span>
                  <span style="color: #FF4444;">✗${stats.abnormal}</span>
                  <span style="color: #AAAAAA;">○${stats.unpushed}</span>
                </span>
              </div>
            `;
          }
        });
        
        html += '</div>';
      }
      
      html += `
        <div class="tooltip-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <span class="tooltip-label">数据完整率</span>
          <span class="tooltip-value status-normal">${completionRate}%</span>
        </div>
      `;
      
    } else if (node.type === 'server') {
      // 前置机节点提示框
      const departmentCount = node.departmentCount || 0;
      const totalTableCount = node.totalTableCount || 0;
      const departments = node.departments || [];
      
      html += `
        <div class="tooltip-row">
          <span class="tooltip-label">汇聚部门数</span>
          <span class="tooltip-value">${this.formatNumber(departmentCount)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">汇总表数量</span>
          <span class="tooltip-value">${this.formatNumber(totalTableCount)}</span>
        </div>
      `;
      
      if (departments.length > 0 && departments.length <= 5) {
        html += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);"><div style="color: rgba(255, 255, 255, 0.6); margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">汇聚部门列表</div>';
        departments.forEach(dept => {
          html += `<div style="color: rgba(255, 255, 255, 0.9); font-size: 12px; margin-bottom: 4px; padding-left: 8px; border-left: 2px solid rgba(0, 217, 255, 0.3);">${dept}</div>`;
        });
        html += '</div>';
      } else if (departments.length > 5) {
        html += `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); font-size: 11px;">汇聚 ${departments.length} 个部门</div>`;
      }
      
    } else if (node.type === 'warehouse') {
      // 前置仓节点提示框
      const totalTableCount = node.value || 0;
      
      html += `
        <div class="tooltip-row">
          <span class="tooltip-label">汇总表数量</span>
          <span class="tooltip-value">${this.formatNumber(totalTableCount)}</span>
        </div>
      `;
      
      // 添加推送状态分布（如果有明细数据）
      if (this.detailData && this.detailData.length > 0) {
        const allStats = this.calculateAllStatusStats('toSource');
        if (allStats && allStats.total > 0) {
          html += `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">推送状态分布</div>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #00FF88;">✓ 正常</span>
                  <span style="color: #00FF88; font-weight: 600;">${allStats.normal} (${((allStats.normal/allStats.total)*100).toFixed(1)}%)</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #FF4444;">✗ 异常</span>
                  <span style="color: #FF4444; font-weight: 600;">${allStats.abnormal} (${((allStats.abnormal/allStats.total)*100).toFixed(1)}%)</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #AAAAAA;">○ 未推送</span>
                  <span style="color: #AAAAAA; font-weight: 600;">${allStats.unpushed} (${((allStats.unpushed/allStats.total)*100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          `;
        }
      }
      
    } else if (node.type === 'source') {
      // 贴源层节点提示框
      const totalTableCount = node.value || 0;
      
      html += `
        <div class="tooltip-row">
          <span class="tooltip-label">汇总表数量</span>
          <span class="tooltip-value">${this.formatNumber(totalTableCount)}</span>
        </div>
      `;
      
      // 计算整体完成率
      if (this.summaryData && this.summaryData.length > 0) {
        const totalDeptTables = this.summaryData.reduce((sum, row) => {
          return sum + (parseInt(row['部门汇聚清单（表数量）']) || 0);
        }, 0);
        const completionRate = totalDeptTables > 0 ? ((totalTableCount / totalDeptTables) * 100).toFixed(1) : 0;
        
        html += `
          <div class="tooltip-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <span class="tooltip-label">整体完成率</span>
            <span class="tooltip-value status-normal">${completionRate}%</span>
          </div>
        `;
      }
    }
    
    html += '</div></div>';
    return html;
  }
  
  /**
   * 生成连接线提示框内容
   * @param {Object} link - 连接线数据
   * @returns {string} HTML内容
   */
  generateLinkTooltipContent(link) {
    const stageName = `${link.source.name} → ${link.target.name}`;
    const totalTables = link.actualValue || link.value || 0;
    const stats = link.statusStats || { normal: 0, abnormal: 0, unpushed: 0, total: 0 };
    
    let html = `
      <div><div class="tooltip-header">${stageName}</div><div class="tooltip-content">
      <div class="tooltip-row">
        <span class="tooltip-label">总表数量</span>
        <span class="tooltip-value">${this.formatNumber(totalTables)}</span>
      </div>
    `;
    
    // 如果有推送状态统计
    if (stats.total > 0) {
      const normalPct = ((stats.normal / stats.total) * 100).toFixed(1);
      const abnormalPct = ((stats.abnormal / stats.total) * 100).toFixed(1);
      const unpushedPct = ((stats.unpushed / stats.total) * 100).toFixed(1);
      
      html += `
        <div style="margin: 12px 0; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div class="tooltip-row">
              <span style="color: #00FF88; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">✓</span> 正常</span>
              <span style="color: #00FF88; font-weight: 600;">${this.formatNumber(stats.normal)} <span style="color: rgba(255, 255, 255, 0.5); font-size: 11px;">(${normalPct}%)</span></span>
            </div>
            <div class="tooltip-row">
              <span style="color: #FF4444; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">✗</span> 异常</span>
              <span style="color: #FF4444; font-weight: 600;">${this.formatNumber(stats.abnormal)} <span style="color: rgba(255, 255, 255, 0.5); font-size: 11px;">(${abnormalPct}%)</span></span>
            </div>
            <div class="tooltip-row">
              <span style="color: #AAAAAA; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">○</span> 未推送</span>
              <span style="color: #AAAAAA; font-weight: 600;">${this.formatNumber(stats.unpushed)} <span style="color: rgba(255, 255, 255, 0.5); font-size: 11px;">(${unpushedPct}%)</span></span>
            </div>
          </div>
        </div>
        <div style="margin-top: 12px;">
          <div style="height: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 5px; overflow: hidden; display: flex; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5) inset;">
            <div style="width: ${normalPct}%; background: linear-gradient(90deg, #00FF88, #00CC66); box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);"></div>
            <div style="width: ${abnormalPct}%; background: linear-gradient(90deg, #FF4444, #CC0000); box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);"></div>
            <div style="width: ${unpushedPct}%; background: linear-gradient(90deg, #AAAAAA, #888888);"></div>
          </div>
        </div>
      `;
    }
    
    html += `
      <div class="tooltip-hint">
        点击查看明细
      </div>
      </div></div>
    `;
    
    return html;
  }
  
  /**
   * 计算推送状态统计
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节
   * @returns {Object} 状态统计
   */
  calculateStatusStats(department, stage) {
    if (!this.detailData || this.detailData.length === 0) {
      return null;
    }
    
    // 确定状态字段名
    let statusField;
    switch (stage) {
      case 'toServer':
        statusField = '部门到前置机状态';
        break;
      case 'toWarehouse':
        statusField = '前置机到前置仓状态';
        break;
      case 'toSource':
        statusField = '前置仓到贴源层状态';
        break;
      default:
        return null;
    }
    
    // 筛选该部门的明细数据
    const departmentDetails = this.detailData.filter(row => {
      const rowDepartment = (row['部门'] || '').trim();
      return rowDepartment === department;
    });
    
    // 统计各状态的数量
    let normal = 0;
    let abnormal = 0;
    let unpushed = 0;
    
    departmentDetails.forEach(row => {
      const status = row[statusField];
      if (!status || status.trim() === '' || status === '未推送') {
        unpushed++;
      } else if (status === '正常') {
        normal++;
      } else if (status === '异常') {
        abnormal++;
      } else {
        unpushed++;
      }
    });
    
    const total = departmentDetails.length;
    
    return { normal, abnormal, unpushed, total };
  }
  
  /**
   * 计算所有部门的状态统计汇总
   * @param {string} stage - 流转环节
   * @returns {Object} 状态统计
   */
  calculateAllStatusStats(stage) {
    if (!this.detailData || this.detailData.length === 0) {
      return null;
    }
    
    // 确定状态字段名
    let statusField;
    switch (stage) {
      case 'toServer':
        statusField = '部门到前置机状态';
        break;
      case 'toWarehouse':
        statusField = '前置机到前置仓状态';
        break;
      case 'toSource':
        statusField = '前置仓到贴源层状态';
        break;
      default:
        return null;
    }
    
    // 统计各状态的数量
    let normal = 0;
    let abnormal = 0;
    let unpushed = 0;
    
    this.detailData.forEach(row => {
      const status = row[statusField];
      if (!status || status.trim() === '' || status === '未推送') {
        unpushed++;
      } else if (status === '正常') {
        normal++;
      } else if (status === '异常') {
        abnormal++;
      } else {
        unpushed++;
      }
    });
    
    const total = this.detailData.length;
    
    return { normal, abnormal, unpushed, total };
  }
  
  /**
   * 格式化数字（千分位分隔）
   * @param {number} num - 数字
   * @returns {string} 格式化后的字符串
   */
  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  /**
   * 清理所有事件监听器（避免内存泄漏）
   */
  destroy() {
    // 清除悬停延迟
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    // 移除所有事件监听器
    if (this.eventListeners && this.eventListeners.length > 0) {
      this.eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventListeners = [];
    }
    
    // 移除悬浮提示框
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.remove();
    }
    this.tooltip = null;
    
    // 清空引用
    this.sankeyRenderer = null;
    this.modalRenderer = null;
    this.summaryData = null;
    this.detailData = null;
    this.selectedDepartment = null;
    
    console.log('✓ InteractionHandler 已清理');
  }
  
  /**
   * 添加事件监听器并记录（用于后续清理）
   * @param {Element} element - DOM元素
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  addEventListenerWithTracking(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }
}
