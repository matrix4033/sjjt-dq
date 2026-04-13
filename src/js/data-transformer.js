/**
 * 数据转换模块
 * 负责将CSV数据转换为桑基图所需的节点和连接数据结构
 */

class DataTransformer {
  /**
   * 标准化部门名称（去除空格和特殊字符）
   * @param {string} departmentName - 原始部门名称
   * @returns {string} 标准化后的部门名称
   */
  normalizeDepartmentName(departmentName) {
    if (!departmentName) return '';
    // 去除首尾空格，并将多个空格替换为单个空格
    return departmentName.trim().replace(/\s+/g, ' ');
  }

  /**
   * 为部门分配统一颜色（所有部门使用相同颜色）
   * @param {number} index - 部门索引（未使用）
   * @param {number} total - 部门总数（未使用）
   * @returns {string} 统一的浅蓝色
   */
  assignDepartmentColor(index, total) {
    // 所有部门使用统一的浅蓝色
    return '#9DC7DD';
  }

  /**
   * 计算推送状态统计
   * @param {Array} detailData - 明细数据数组
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节（'dept-to-front', 'front-to-warehouse', 'warehouse-to-source'）
   * @returns {Object} {normal: number, abnormal: number, unpushed: number, total: number}
   */
  calculateStatusStats(detailData, department, stage) {
    // 标准化部门名称
    const normalizedDepartment = this.normalizeDepartmentName(department);
    
    // 根据流转环节确定状态字段名
    let statusField;
    switch (stage) {
      case 'dept-to-front':
      case 'toServer':
        statusField = '部门到前置机状态';
        break;
      case 'front-to-warehouse':
      case 'toWarehouse':
        statusField = '前置机到前置仓状态';
        break;
      case 'warehouse-to-source':
      case 'toSource':
        statusField = '前置仓到贴源层状态';
        break;
      default:
        console.warn(`未知的流转环节: ${stage}`);
        return { normal: 0, abnormal: 0, unpushed: 0, total: 0 };
    }
    
    // 筛选该部门的明细数据
    const departmentDetails = detailData.filter(row => {
      const rowDepartment = this.normalizeDepartmentName(row['部门']);
      return rowDepartment === normalizedDepartment;
    });
    
    // 统计各状态的数量
    let normal = 0;
    let abnormal = 0;
    let unpushed = 0;
    
    departmentDetails.forEach(row => {
      const status = row[statusField];
      if (!status || status.trim() === '') {
        unpushed++;
      } else if (status === '正常') {
        normal++;
      } else if (status === '异常') {
        abnormal++;
      } else if (status === '未推送') {
        unpushed++;
      } else {
        // 其他状态视为未推送
        unpushed++;
      }
    });
    
    const total = departmentDetails.length;
    
    return { normal, abnormal, unpushed, total };
  }

  /**
   * 基于推送状态计算连接线颜色（根据正常/未推送比例渐变，异常突出显示）
   * @param {string} baseColor - 基础色（#9DC7DD）
   * @param {Object} statusStats - 推送状态统计 {normal, abnormal, unpushed, total}
   * @returns {string} 计算后的颜色
   */
  applyStatusColorOverlay(baseColor, statusStats) {
    if (!statusStats || statusStats.total === 0) {
      return baseColor;  // 默认浅蓝色
    }
    
    const normalRate = statusStats.normal / statusStats.total;
    const abnormalRate = statusStats.abnormal / statusStats.total;
    const unpushedRate = statusStats.unpushed / statusStats.total;
    
    // 如果有异常（任何比例），使用红色突出告警
    if (abnormalRate > 0) {
      // 异常比例越高，红色越深
      const redIntensity = Math.min(abnormalRate * 2, 1);  // 最多100%红色
      return this.blendColors('#9DC7DD', '#FF4444', redIntensity * 0.7);  // 混合70%红色
    }
    
    // 无异常时，根据正常/未推送比例渐变
    // 正常率高 → 深绿色 #3D9F3C（健康）
    // 未推送率高 → 浅蓝色 #9DC7DD（中性）
    // 使用正常率来决定绿色的强度
    if (normalRate > 0) {
      // 正常率越高，绿色越深
      return this.blendColors('#9DC7DD', '#3D9F3C', normalRate * 0.8);  // 最多混合80%绿色
    }
    
    // 全部未推送，保持浅蓝色
    return baseColor;
  }

  /**
   * 混合两种颜色
   * @param {string} color1 - 颜色1（如#00D9FF）
   * @param {string} color2 - 颜色2（如#FF4444）
   * @param {number} ratio - 混合比例（0-1，color2的比例）
   * @returns {string} 混合后的颜色
   */
  blendColors(color1, color2, ratio) {
    // 解析颜色
    const parseColor = (color) => {
      const hex = color.replace('#', '');
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    };
    
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    
    // 混合
    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
    
    // 转换为十六进制
    const toHex = (x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * 转换汇总数据为桑基图数据
   * @param {Array} summaryData - 汇总CSV数据
   * @param {Array} detailData - 明细CSV数据（用于计算推送状态统计）
   * @returns {Object} {nodes: Array, links: Array}
   */
  transformToSankeyData(summaryData, detailData = []) {
    const nodes = [];
    const links = [];
    const serverNodeMap = new Map();  // 用于跟踪前置机节点
    const departmentToServerMap = new Map();  // 用于跟踪部门到前置机的映射关系
    
    // 创建前置仓和贴源层节点
    const warehouseNode = { id: "前置仓", name: "前置仓", type: "warehouse" };
    const sourceNode = { id: "贴源层", name: "贴源层", type: "source" };
    
    // 过滤有效部门数据，不做额外排序，让d3-sankey自动优化布局
    const finalDepartments = summaryData
      .filter(row => {
        const tableCount = parseInt(row['部门表数量']) || 0;
        return tableCount > 0;
      });
    
    const totalDepartments = finalDepartments.length;
    
    // 第一步：遍历汇总数据，创建部门节点和所有连接线（以部门为维度）
    finalDepartments.forEach((row, index) => {
      const rawDepartmentName = row['部门名称'];
      const departmentName = this.normalizeDepartmentName(rawDepartmentName);
      const departmentTableCount = parseInt(row['部门表数量']) || 0;
      const serverName = row['前置机名称'];  // 关键字段：前置机名称
      const serverTableCount = parseInt(row['前置机表数量']) || 0;
      const serverDataVolume = 0;  // CSV中没有数据量字段
      const warehouseTableCount = parseInt(row['前置仓表数量']) || 0;
      const warehouseDataVolume = 0;  // CSV中没有数据量字段
      const sourceTableCount = parseInt(row['贴源层表数量']) || 0;
      const sourceDataVolume = 0;  // CSV中没有数据量字段
      
      // 为部门分配专属色系
      const departmentColor = this.assignDepartmentColor(index, totalDepartments);
      
      // 创建部门节点
      const departmentNodeId = `部门_${departmentName}`;
      const departmentNode = {
        id: departmentNodeId,
        name: departmentName,
        type: "department",
        color: departmentColor,  // 部门专属色系
        metadata: {
          departmentTableCount,
          serverName,
          serverTableCount,
          serverDataVolume,
          warehouseTableCount,
          warehouseDataVolume,
          sourceTableCount,
          sourceDataVolume
        }
      };
      nodes.push(departmentNode);
      
      // 记录部门到前置机的映射关系
      departmentToServerMap.set(departmentName, serverName);
      
      // 创建前置机节点（如果还不存在）
      if (!serverNodeMap.has(serverName)) {
        serverNodeMap.set(serverName, {
          id: serverName,
          name: serverName,
          type: "server",
          departmentCount: 0,
          totalTableCount: 0,
          totalDataVolume: 0,
          departments: []  // 记录该前置机服务的部门列表
        });
      }
      
      // 更新前置机节点的统计信息
      const serverNode = serverNodeMap.get(serverName);
      serverNode.departmentCount++;
      serverNode.totalTableCount += departmentTableCount;
      serverNode.departments.push(departmentName);
      serverNode.totalDataVolume += serverDataVolume;
      
      // 创建部门到前置机的连接（以部门为维度）
      if (departmentTableCount > 0) {
        // 计算推送状态统计
        const statusStats = this.calculateStatusStats(detailData, departmentName, 'toServer');
        
        // 基于推送状态叠加颜色
        const linkColor = this.applyStatusColorOverlay(departmentColor, statusStats);
        
        // 确保连接线最小宽度为2像素（通过value字段控制）
        const linkValue = Math.max(departmentTableCount, 2);
        
        links.push({
          source: departmentNodeId,
          target: serverName,
          value: linkValue,             // 确保最小宽度为2像素
          actualValue: departmentTableCount,  // 实际表数量
          department: departmentName,   // 标准化后的部门名称
          stage: 'toServer',            // 流转环节：部门到前置机
          color: linkColor,             // 连接线颜色（叠加后）
          baseColor: departmentColor,   // 基础色
          statusStats: statusStats,     // 推送状态统计
          metadata: {
            tableCount: departmentTableCount,
            dataVolume: 0  // 部门层没有数据量字段
          }
        });
        
        // 输出调试信息
        if (statusStats.total > 0) {
          console.log(`[${departmentName} → ${serverName}] 状态统计:`, 
            `正常: ${statusStats.normal} (${(statusStats.normal/statusStats.total*100).toFixed(1)}%), `,
            `异常: ${statusStats.abnormal} (${(statusStats.abnormal/statusStats.total*100).toFixed(1)}%), `,
            `未推送: ${statusStats.unpushed} (${(statusStats.unpushed/statusStats.total*100).toFixed(1)}%)`
          );
        }
      }
      
      // 创建前置机到前置仓的连接（以部门为维度）
      if (serverTableCount > 0) {
        // 计算推送状态统计
        const statusStats = this.calculateStatusStats(detailData, departmentName, 'toWarehouse');
        
        // 基于推送状态叠加颜色
        const linkColor = this.applyStatusColorOverlay(departmentColor, statusStats);
        
        // 确保连接线最小宽度为2像素
        const linkValue = Math.max(serverTableCount, 2);
        
        links.push({
          source: serverName,
          target: "前置仓",
          value: linkValue,             // 确保最小宽度为2像素
          actualValue: serverTableCount,  // 实际表数量
          department: departmentName,   // 标准化后的部门名称
          stage: 'toWarehouse',         // 流转环节：前置机到前置仓
          color: linkColor,             // 连接线颜色（叠加后）
          baseColor: departmentColor,   // 基础色
          statusStats: statusStats,     // 推送状态统计
          metadata: {
            tableCount: serverTableCount,
            dataVolume: serverDataVolume
          }
        });
        
        // 输出调试信息
        if (statusStats.total > 0) {
          console.log(`[${serverName} → 前置仓] ${departmentName} 状态统计:`, 
            `正常: ${statusStats.normal} (${(statusStats.normal/statusStats.total*100).toFixed(1)}%), `,
            `异常: ${statusStats.abnormal} (${(statusStats.abnormal/statusStats.total*100).toFixed(1)}%), `,
            `未推送: ${statusStats.unpushed} (${(statusStats.unpushed/statusStats.total*100).toFixed(1)}%)`
          );
        }
      }
      
      // 创建前置仓到贴源层的连接（以部门为维度）
      if (warehouseTableCount > 0) {
        // 计算推送状态统计
        const statusStats = this.calculateStatusStats(detailData, departmentName, 'toSource');
        
        // 基于推送状态叠加颜色
        const linkColor = this.applyStatusColorOverlay(departmentColor, statusStats);
        
        // 确保连接线最小宽度为2像素
        const linkValue = Math.max(warehouseTableCount, 2);
        
        links.push({
          source: "前置仓",
          target: "贴源层",
          value: linkValue,             // 确保最小宽度为2像素
          actualValue: warehouseTableCount,  // 实际表数量
          department: departmentName,   // 标准化后的部门名称
          stage: 'toSource',            // 流转环节：前置仓到贴源层
          color: linkColor,             // 连接线颜色（叠加后）
          baseColor: departmentColor,   // 基础色
          statusStats: statusStats,     // 推送状态统计
          metadata: {
            tableCount: warehouseTableCount,
            dataVolume: warehouseDataVolume
          }
        });
        
        // 输出调试信息
        if (statusStats.total > 0) {
          console.log(`[前置仓 → 贴源层] ${departmentName} 状态统计:`, 
            `正常: ${statusStats.normal} (${(statusStats.normal/statusStats.total*100).toFixed(1)}%), `,
            `异常: ${statusStats.abnormal} (${(statusStats.abnormal/statusStats.total*100).toFixed(1)}%), `,
            `未推送: ${statusStats.unpushed} (${(statusStats.unpushed/statusStats.total*100).toFixed(1)}%)`
          );
        }
      }
    });
    
    // 第二步：重新组织节点数组，按层级顺序添加
    // d3-sankey需要节点按层级顺序排列才能正确布局
    const orderedNodes = [];
    
    // 第1层：部门节点（已经在nodes数组中）
    const departmentNodes = nodes.filter(n => n.type === 'department');
    orderedNodes.push(...departmentNodes);
    
    // 第2层：前置机节点
    serverNodeMap.forEach(serverNode => {
      orderedNodes.push(serverNode);
    });
    
    // 第3层：前置仓节点
    orderedNodes.push(warehouseNode);
    
    // 第4层：贴源层节点
    orderedNodes.push(sourceNode);
    
    return { nodes: orderedNodes, links };
  }
  
  /**
   * 计算整体汇聚情况统计
   * @param {Array} summaryData - 汇总CSV数据
   * @param {Object} config - 配置对象，可包含固定值
   * @param {Object} statusStats - 推送状态统计数据
   * @param {Array} detailData - 明细CSV数据（用于计算链路完成率和异常率）
   * @returns {Object} 统计指标对象
   */
  calculateOverallStats(summaryData, config = {}, statusStats = null, detailData = null) {
    const stats = {};
    
    // 1. 汇聚部门数：汇总.csv中【部门名称】的去重数量
    if (config.departmentCount !== null && config.departmentCount !== undefined) {
      stats.departmentCount = config.departmentCount;
    } else {
      const departments = new Set(summaryData.map(row => row['部门名称']));
      stats.departmentCount = departments.size;
    }
    
    // 2. 部门汇聚清单表数量：汇总.csv中【部门表数量】的总和
    if (config.totalTableCount !== null && config.totalTableCount !== undefined) {
      stats.totalTableCount = config.totalTableCount;
    } else {
      stats.totalTableCount = summaryData.reduce((sum, row) => {
        const count = parseInt(row['部门表数量']) || 0;
        return sum + count;
      }, 0);
    }
    
    // 3. 部门数据更新率：明细.csv中【部门到前置机状态】为"正常"的数量 / 总数量
    if (config.departmentUpdateRate !== null && config.departmentUpdateRate !== undefined) {
      stats.departmentUpdateRate = config.departmentUpdateRate;
    } else if (statusStats && statusStats.byStage['dept-to-front']) {
      const stage = statusStats.byStage['dept-to-front'];
      if (stage.total > 0) {
        stats.departmentUpdateRate = (stage.normal / stage.total) * 100;
      } else {
        stats.departmentUpdateRate = 0;
      }
    } else {
      stats.departmentUpdateRate = 0;
    }
    
    // 4. 前置仓更新率：明细.csv中【前置机到前置仓状态】为"正常"的数量 / 总数量
    if (config.warehouseUpdateRate !== null && config.warehouseUpdateRate !== undefined) {
      stats.warehouseUpdateRate = config.warehouseUpdateRate;
    } else if (statusStats && statusStats.byStage['front-to-warehouse']) {
      const stage = statusStats.byStage['front-to-warehouse'];
      if (stage.total > 0) {
        stats.warehouseUpdateRate = (stage.normal / stage.total) * 100;
      } else {
        stats.warehouseUpdateRate = 0;
      }
    } else {
      stats.warehouseUpdateRate = 0;
    }
    
    // 5. 链路完成率：明细.csv中三个状态都为"正常"的数量 / 总数量
    if (config.linkCompletionRate !== null && config.linkCompletionRate !== undefined) {
      stats.linkCompletionRate = config.linkCompletionRate;
    } else if (detailData && detailData.length > 0) {
      let allNormalCount = 0;
      detailData.forEach(row => {
        const status1 = row['部门到前置机状态'] || '';
        const status2 = row['前置机到前置仓状态'] || '';
        const status3 = row['前置仓到贴源层状态'] || '';
        
        // 三个状态都为"正常"
        if (status1 === '正常' && status2 === '正常' && status3 === '正常') {
          allNormalCount++;
        }
      });
      
      stats.linkCompletionRate = (allNormalCount / detailData.length) * 100;
    } else {
      stats.linkCompletionRate = 0;
    }
    
    // 6. 链路异常率：明细.csv中任意一个状态为"异常"的数量 / 总数量
    if (config.linkAbnormalRate !== null && config.linkAbnormalRate !== undefined) {
      stats.linkAbnormalRate = config.linkAbnormalRate;
    } else if (detailData && detailData.length > 0) {
      let anyAbnormalCount = 0;
      detailData.forEach(row => {
        const status1 = row['部门到前置机状态'] || '';
        const status2 = row['前置机到前置仓状态'] || '';
        const status3 = row['前置仓到贴源层状态'] || '';
        
        // 任意一个状态为"异常"
        if (status1 === '异常' || status2 === '异常' || status3 === '异常') {
          anyAbnormalCount++;
        }
      });
      
      stats.linkAbnormalRate = (anyAbnormalCount / detailData.length) * 100;
    } else {
      stats.linkAbnormalRate = 0;
    }
    
    // 调试：输出detail数据
    console.log('=== 指标详细数据 ===');
    console.log('departmentUpdateRate_detail:', stats.departmentUpdateRate_detail);
    console.log('warehouseUpdateRate_detail:', stats.warehouseUpdateRate_detail);
    console.log('linkCompletionRate_detail:', stats.linkCompletionRate_detail);
    console.log('linkAbnormalRate_detail:', stats.linkAbnormalRate_detail);
    console.log('===================');
    
    return stats;
  }
  
  /**
   * 验证数据完整性
   * @param {Array} summaryData - 汇总数据
   * @param {Array} detailData - 明细数据
   * @returns {Object} 验证结果 {isValid: boolean, warnings: Array}
   */
  validateData(summaryData, detailData) {
    const warnings = [];
    let isValid = true;
    
    // 验证汇总数据
    if (!summaryData || summaryData.length === 0) {
      warnings.push('汇总数据为空');
      isValid = false;
      return { isValid, warnings };
    }
    
    // 验证必填字段是否存在
    const requiredFields = [
      '部门名称',
      '部门表数量',
      '前置机名称',
      '前置机表数量',
      '前置仓名称',
      '前置仓表数量',
      '贴源层名称',
      '贴源层表数量'
    ];
    
    const firstRow = summaryData[0];
    const missingFields = requiredFields.filter(field => !(field in firstRow));
    
    if (missingFields.length > 0) {
      warnings.push(`汇总数据缺少必填字段: ${missingFields.join(', ')}`);
      isValid = false;
    }
    
    // 验证部门名称字段
    summaryData.forEach((row, index) => {
      const departmentName = row['部门名称'];
      if (!departmentName || departmentName.trim() === '') {
        warnings.push(`汇总数据第 ${index + 2} 行缺少部门名称`);
      }
      
      // 验证表数量字段是否为有效数字
      const tableCount = row['部门表数量'];
      if (tableCount && isNaN(parseInt(tableCount))) {
        warnings.push(`汇总数据第 ${index + 2} 行的表数量不是有效数字: ${tableCount}`);
      }
    });
    
    // 验证明细数据
    if (!detailData || detailData.length === 0) {
      warnings.push('明细数据为空');
      // 明细数据为空不影响桑基图显示，所以不设置isValid为false
    } else {
      // 验证明细数据的必填字段
      const detailRequiredFields = ['部门', '表中文名'];
      const firstDetailRow = detailData[0];
      const missingDetailFields = detailRequiredFields.filter(field => !(field in firstDetailRow));
      
      if (missingDetailFields.length > 0) {
        warnings.push(`明细数据缺少必填字段: ${missingDetailFields.join(', ')}`);
      }
      
      // 验证汇总数据和明细数据的部门名称匹配（使用标准化后的名称）
      const summaryDepartments = new Set(
        summaryData
          .map(row => this.normalizeDepartmentName(row['部门名称']))
          .filter(name => name)
      );
      const detailDepartments = new Set(
        detailData
          .map(row => this.normalizeDepartmentName(row['部门']))
          .filter(name => name)
      );
      
      // 检查明细数据中是否有汇总数据中不存在的部门
      const unmatchedDepartments = [...detailDepartments].filter(
        dept => !summaryDepartments.has(dept)
      );
      
      if (unmatchedDepartments.length > 0) {
        warnings.push(`明细数据中存在汇总数据中没有的部门: ${unmatchedDepartments.slice(0, 5).join(', ')}${unmatchedDepartments.length > 5 ? '...' : ''}`);
      }
    }
    
    // 在控制台输出验证警告信息
    if (warnings.length > 0) {
      console.warn('数据验证警告:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    } else {
      console.log('数据验证通过');
    }
    
    return { isValid, warnings };
  }
  
  /**
   * 处理空值字段
   * @param {any} value - 字段值（可能是字符串、数字、null等）
   * @param {string} defaultValue - 默认值
   * @returns {string} 处理后的值
   */
  handleEmptyValue(value, defaultValue = '-') {
    // 处理 null 和 undefined
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    // 转换为字符串
    const strValue = String(value);
    
    // 检查是否为空字符串或只包含空白字符
    if (strValue === '' || strValue.trim() === '') {
      return defaultValue;
    }
    
    return strValue;
  }
  
  /**
   * 清洗明细数据
   * @param {Array} detailData - 明细数据
   * @returns {Array} 清洗后的明细数据
   */
  cleanDetailData(detailData) {
    return detailData.map(row => {
      const cleanedRow = {};
      
      // 处理所有字段的空值
      for (const [key, value] of Object.entries(row)) {
        cleanedRow[key] = this.handleEmptyValue(value);
      }
      
      return cleanedRow;
    });
  }
}
