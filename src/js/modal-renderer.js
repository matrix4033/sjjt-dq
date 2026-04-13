/**
 * 弹窗渲染模块 (ModalRenderer)
 * 负责渲染明细数据弹窗
 */

class ModalRenderer {
  constructor() {
    this.overlay = null;
    this.container = null;
    this.isOpen = false;
    this.currentLink = null;
    this.detailData = null;
    
    // 绑定事件处理函数
    this.handleEscKey = this.handleEscKey.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  
  /**
   * 打开明细数据弹窗
   * @param {Object} link - 连接线数据
   * @param {Array} detailData - 明细数据数组
   */
  openModal(link, detailData) {
    this.currentLink = link;
    this.detailData = detailData;
    
    // 筛选明细数据
    const filteredData = this.filterDetailData(detailData, link.department, link.stage);
    
    // 创建弹窗
    this.createModal();
    
    // 渲染弹窗内容
    this.renderModalContent(link, filteredData);
    
    // 显示弹窗
    this.showModal();
    
    // 绑定事件
    this.bindEvents();
    
    this.isOpen = true;
  }
  
  /**
   * 创建弹窗DOM结构
   */
  createModal() {
    // 如果已存在，先移除
    if (this.overlay) {
      this.overlay.remove();
    }
    
    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.opacity = '0';
    
    // 创建弹窗容器
    this.container = document.createElement('div');
    this.container.className = 'modal-container';
    this.container.style.opacity = '0';
    this.container.style.transform = 'scale(0.95)';
    
    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);
  }
  
  /**
   * 渲染弹窗内容
   * @param {Object} link - 连接线数据
   * @param {Array} filteredData - 筛选后的明细数据
   */
  renderModalContent(link, filteredData) {
    // 生成流转环节名称
    const stageName = this.getStageName(link);
    
    // 计算状态统计
    const stats = this.calculateStats(filteredData, link.stage);
    
    // 生成HTML内容
    const html = `
      <div class="modal-header">
        <div style="flex: 1;">
          <h3 class="modal-title">${stageName}</h3>
          <div class="modal-stats">
            <span>总表数量：<strong>${this.formatNumber(stats.total)}</strong></span>
            <span class="status-normal">正常：<strong>${this.formatNumber(stats.normal)} (${stats.normalPct}%)</strong></span>
            <span class="status-abnormal">异常：<strong>${this.formatNumber(stats.abnormal)} (${stats.abnormalPct}%)</strong></span>
            <span class="status-unpushed">未推送：<strong>${this.formatNumber(stats.unpushed)} (${stats.unpushedPct}%)</strong></span>
          </div>
        </div>
        <button class="modal-close" aria-label="关闭">×</button>
      </div>
      <div class="modal-body">
        <div class="table-wrapper">
          ${this.renderTable(filteredData, link.stage)}
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  /**
   * 渲染数据表格（使用DocumentFragment批量更新DOM）
   * @param {Array} data - 明细数据
   * @param {string} stage - 流转环节
   * @returns {string} 表格HTML
   */
  renderTable(data, stage) {
    // 确定状态字段和异常原因字段
    const { statusField, reasonField } = this.getFieldNames(stage);
    
    // 生成表头
    const tableHeader = `
      <thead>
        <tr>
          <th>部门</th>
          <th>表中文名</th>
          <th>表英文名</th>
          <th>推送状态</th>
          <th>异常原因说明</th>
        </tr>
      </thead>
    `;
    
    // 如果没有数据，显示提示
    if (data.length === 0) {
      return `
        <table class="detail-table">
          ${tableHeader}
          <tbody><tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr></tbody>
        </table>
      `;
    }
    
    // 使用DocumentFragment批量创建表格行（性能优化）
    const fragment = document.createDocumentFragment();
    const tbody = document.createElement('tbody');
    
    data.forEach(row => {
      const department = row['部门'] || '-';
      const tableNameCn = row['表中文名'] || '-';
      const tableNameEn = row['表英文名'] || '-';
      const status = row[statusField] || '未推送';
      const reason = row[reasonField] || '-';
      
      // 确定状态样式类
      const statusClass = this.getStatusClass(status);
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${this.escapeHtml(department)}</td>
        <td>${this.escapeHtml(tableNameCn)}</td>
        <td>${this.escapeHtml(tableNameEn)}</td>
        <td><span class="status-cell ${statusClass}">${this.escapeHtml(status)}</span></td>
        <td>${this.escapeHtml(reason)}</td>
      `;
      
      tbody.appendChild(tr);
    });
    
    fragment.appendChild(tbody);
    
    // 创建临时容器来获取HTML
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment.cloneNode(true));
    const tableBody = tempDiv.innerHTML;
    
    return `
      <table class="detail-table">
        ${tableHeader}
        ${tableBody}
      </table>
    `;
  }
  
  /**
   * 筛选明细数据
   * @param {Array} detailData - 明细数据数组
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节
   * @returns {Array} 筛选后的明细数据
   */
  filterDetailData(detailData, department, stage) {
    if (!detailData || detailData.length === 0) {
      return [];
    }
    
    // 标准化部门名称
    const normalizedDepartment = this.normalizeDepartmentName(department);
    
    // 筛选该部门的明细数据
    const filtered = detailData.filter(row => {
      const rowDepartment = this.normalizeDepartmentName(row['部门']);
      return rowDepartment === normalizedDepartment;
    });
    
    return filtered;
  }
  
  /**
   * 计算状态统计
   * @param {Array} data - 明细数据
   * @param {string} stage - 流转环节
   * @returns {Object} 状态统计
   */
  calculateStats(data, stage) {
    const { statusField } = this.getFieldNames(stage);
    
    let normal = 0;
    let abnormal = 0;
    let unpushed = 0;
    
    data.forEach(row => {
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
    
    const total = data.length;
    const normalPct = total > 0 ? ((normal / total) * 100).toFixed(1) : '0.0';
    const abnormalPct = total > 0 ? ((abnormal / total) * 100).toFixed(1) : '0.0';
    const unpushedPct = total > 0 ? ((unpushed / total) * 100).toFixed(1) : '0.0';
    
    return {
      normal,
      abnormal,
      unpushed,
      total,
      normalPct,
      abnormalPct,
      unpushedPct
    };
  }
  
  /**
   * 获取流转环节名称
   * @param {Object} link - 连接线数据
   * @returns {string} 流转环节名称
   */
  getStageName(link) {
    const sourceName = link.source.name || link.source;
    const targetName = link.target.name || link.target;
    return `${sourceName} → ${targetName}`;
  }
  
  /**
   * 获取字段名称
   * @param {string} stage - 流转环节
   * @returns {Object} {statusField, reasonField}
   */
  getFieldNames(stage) {
    let statusField, reasonField;
    
    // 经过预处理后，异常原因说明字段已经被重命名为明确的名称
    switch (stage) {
      case 'toServer':
      case 'dept-to-front':
        statusField = '部门到前置机状态';
        reasonField = '异常原因说明（对应部门到前置机）';
        break;
      case 'toWarehouse':
      case 'front-to-warehouse':
        statusField = '前置机到前置仓状态';
        reasonField = '异常原因说明（对应前置机到前置仓）';
        break;
      case 'toSource':
      case 'warehouse-to-source':
        statusField = '前置仓到贴源层状态';
        reasonField = '异常原因说明（对应前置仓到贴源层）';
        break;
      default:
        statusField = '部门到前置机状态';
        reasonField = '异常原因说明（对应部门到前置机）';
    }
    
    return { statusField, reasonField };
  }
  
  /**
   * 获取状态样式类
   * @param {string} status - 推送状态
   * @returns {string} CSS类名
   */
  getStatusClass(status) {
    if (!status || status.trim() === '' || status === '未推送') {
      return 'status-unpushed';
    } else if (status === '正常') {
      return 'status-normal';
    } else if (status === '异常') {
      return 'status-abnormal';
    } else {
      return 'status-unpushed';
    }
  }
  
  /**
   * 显示弹窗（带淡入动画）
   */
  showModal() {
    // 强制重排以触发动画
    this.overlay.offsetHeight;
    
    // 淡入动画
    requestAnimationFrame(() => {
      this.overlay.style.transition = 'opacity 300ms ease-in-out';
      this.overlay.style.opacity = '1';
      
      this.container.style.transition = 'opacity 300ms ease-in-out, transform 300ms ease-in-out';
      this.container.style.opacity = '1';
      this.container.style.transform = 'scale(1)';
    });
    
    // 禁止页面滚动
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * 关闭明细数据弹窗
   */
  closeModal() {
    if (!this.isOpen) {
      return;
    }
    
    // 淡出动画
    this.overlay.style.opacity = '0';
    this.container.style.opacity = '0';
    this.container.style.transform = 'scale(0.95)';
    
    // 等待动画完成后移除DOM
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.remove();
      }
      this.overlay = null;
      this.container = null;
      this.isOpen = false;
      
      // 恢复页面滚动
      document.body.style.overflow = '';
    }, 300);
    
    // 移除事件监听
    this.unbindEvents();
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 绑定Esc键关闭
    document.addEventListener('keydown', this.handleEscKey);
    
    // 绑定遮罩层点击关闭
    if (this.overlay) {
      this.overlay.addEventListener('click', this.handleOverlayClick);
    }
    
    // 绑定关闭按钮点击
    const closeBtn = this.container.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', this.closeModal);
    }
  }
  
  /**
   * 移除事件监听
   */
  unbindEvents() {
    document.removeEventListener('keydown', this.handleEscKey);
    
    if (this.overlay) {
      this.overlay.removeEventListener('click', this.handleOverlayClick);
    }
  }
  
  /**
   * 处理Esc键事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleEscKey(event) {
    if (event.key === 'Escape' || event.keyCode === 27) {
      this.closeModal();
    }
  }
  
  /**
   * 处理遮罩层点击事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleOverlayClick(event) {
    // 只有点击遮罩层本身时才关闭（不包括弹窗容器）
    if (event.target === this.overlay) {
      this.closeModal();
    }
  }
  
  /**
   * 标准化部门名称
   * @param {string} departmentName - 原始部门名称
   * @returns {string} 标准化后的部门名称
   */
  normalizeDepartmentName(departmentName) {
    if (!departmentName) return '';
    return departmentName.trim().replace(/\s+/g, ' ');
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
   * 转义HTML特殊字符
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
