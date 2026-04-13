/**
 * TableRenderer - 明细列表渲染模块
 * 负责渲染明细数据表格、应用状态颜色标识、支持数据筛选和更新
 */
class TableRenderer {
  /**
   * 初始化表格渲染器
   * @param {string} containerId - 容器DOM元素ID
   * @param {Object} config - 配置参数
   */
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.config = {
      columns: [
        { field: "部门", width: "120px", align: "left" },
        { field: "表中文名", width: "200px", align: "left" },
        { field: "部门到前置机对账状态", width: "120px", align: "center", colorize: true },
        { field: "异常原因说明", width: "150px", align: "left" },
        { field: "前置机到前置仓对账状态\n", width: "140px", align: "center", colorize: true },
        { field: "异常原因说明", width: "150px", align: "left" },
        { field: "前置仓数据量核对", width: "120px", align: "center", colorize: true },
        { field: "前置仓到贴源层调度状态", width: "140px", align: "center", colorize: true },
        { field: "异常原因说明", width: "150px", align: "left" }
      ],
      ...config
    };
    
    this.allData = [];
    this.filteredData = [];
    this.currentFilter = null;
    
    this.init();
  }
  
  /**
   * 初始化表格HTML结构
   */
  init() {
    if (!this.container) {
      console.error(`Container with id "${this.containerId}" not found`);
      return;
    }
    
    // 创建表格容器HTML结构
    this.container.innerHTML = `
      <!-- 筛选信息栏 -->
      <div class="filter-bar" style="display: none;">
        <span class="filter-info">
          当前筛选：<strong class="filter-department"></strong>
          （共 <strong class="filter-count"></strong> 条记录）
        </span>
        <button class="clear-filter-btn">清除筛选</button>
      </div>
      
      <!-- 表格 -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              ${this.generateTableHeaders()}
            </tr>
          </thead>
          <tbody>
            <!-- 动态生成的数据行 -->
          </tbody>
        </table>
      </div>
    `;
    
    // 绑定清除筛选按钮事件
    const clearBtn = this.container.querySelector('.clear-filter-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilter());
    }
  }
  
  /**
   * 生成表格表头HTML
   * @returns {string} 表头HTML字符串
   */
  generateTableHeaders() {
    return this.config.columns.map(col => {
      const displayName = col.field.replace(/\n/g, '');
      return `<th style="width: ${col.width}; text-align: ${col.align};">${displayName}</th>`;
    }).join('');
  }
  
  /**
   * 渲染表格数据
   * @param {Array} data - 明细数据数组
   */
  render(data) {
    this.allData = data;
    this.filteredData = data;
    this.renderTableBody(data);
  }
  
  /**
   * 渲染表格主体
   * @param {Array} data - 要渲染的数据
   */
  renderTableBody(data) {
    const tbody = this.container.querySelector('.data-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${this.config.columns.length}" style="text-align: center; padding: 40px; color: #999;">
            暂无数据
          </td>
        </tr>
      `;
      return;
    }
    
    data.forEach((row, index) => {
      const tr = document.createElement('tr');
      
      // 为每一列创建单元格
      this.config.columns.forEach(col => {
        const fieldName = col.field;
        const value = row[fieldName];
        
        if (col.colorize) {
          // 创建状态单元格（带颜色标识）
          tr.appendChild(this.createStatusCell(value));
        } else {
          // 创建普通单元格
          tr.appendChild(this.createCell(value, col.align));
        }
      });
      
      tbody.appendChild(tr);
    });
  }
  
  /**
   * 创建普通单元格
   * @param {string} content - 单元格内容
   * @param {string} align - 对齐方式
   * @returns {HTMLElement} td元素
   */
  createCell(content, align) {
    const td = document.createElement('td');
    // 处理空值显示为"-"
    td.textContent = (content === null || content === undefined || content === '') ? '-' : content;
    td.style.textAlign = align;
    return td;
  }
  
  /**
   * 创建状态单元格（带颜色标识）
   * @param {string} status - 状态值
   * @returns {HTMLElement} td元素
   */
  createStatusCell(status) {
    const td = document.createElement('td');
    td.style.textAlign = 'center';
    
    // 处理空值
    if (status === null || status === undefined || status === '') {
      td.textContent = '-';
      return td;
    }
    
    const span = document.createElement('span');
    span.className = 'status-cell';
    span.textContent = status;
    
    // 判断是否为异常状态
    if (status === '异常') {
      span.classList.add('status-abnormal');
    } else {
      span.classList.add('status-normal');
    }
    
    td.appendChild(span);
    return td;
  }
  
  /**
   * 根据部门筛选数据
   * @param {string} department - 部门名称
   */
  filter(department) {
    if (!department) {
      this.clearFilter();
      return;
    }
    
    this.currentFilter = department;
    this.filteredData = this.allData.filter(row => row['部门'] === department);
    
    this.renderTableBody(this.filteredData);
    this.updateFilterInfo(department, this.filteredData.length);
  }
  
  /**
   * 清除筛选
   */
  clearFilter() {
    this.currentFilter = null;
    this.filteredData = this.allData;
    
    this.renderTableBody(this.allData);
    this.hideFilterBar();
  }
  
  /**
   * 更新筛选信息显示
   * @param {string} department - 部门名称
   * @param {number} count - 结果数量
   */
  updateFilterInfo(department, count) {
    const filterBar = this.container.querySelector('.filter-bar');
    const filterDepartment = this.container.querySelector('.filter-department');
    const filterCount = this.container.querySelector('.filter-count');
    
    if (filterBar && filterDepartment && filterCount) {
      filterDepartment.textContent = department;
      filterCount.textContent = count;
      filterBar.style.display = 'flex';
    }
  }
  
  /**
   * 隐藏筛选栏
   */
  hideFilterBar() {
    const filterBar = this.container.querySelector('.filter-bar');
    if (filterBar) {
      filterBar.style.display = 'none';
    }
  }
  
  /**
   * 获取当前筛选的部门
   * @returns {string|null} 当前筛选的部门名称
   */
  getCurrentFilter() {
    return this.currentFilter;
  }
  
  /**
   * 获取当前显示的数据
   * @returns {Array} 当前显示的数据数组
   */
  getCurrentData() {
    return this.filteredData;
  }
}
