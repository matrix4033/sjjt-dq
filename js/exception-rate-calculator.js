/**
 * 异常率计算模块
 * 负责从明细数据计算各部门各环节的异常率，并将异常率映射为颜色值
 */
class ExceptionRateCalculator {
  constructor() {
    // 缓存异常率计算结果
    this.exceptionRatesCache = null;
    
    // 颜色映射配置
    this.colorConfig = {
      green: { r: 82, g: 196, b: 26 },   // #52C41A - 0%异常
      red: { r: 255, g: 77, b: 79 }      // #FF4D4F - 100%异常
    };
  }

  /**
   * 计算所有部门的异常率
   * @param {Array} detailData - 明细CSV数据
   * @returns {Map} 部门异常率映射表
   */
  calculateExceptionRates(detailData) {
    // 如果已有缓存，直接返回
    if (this.exceptionRatesCache) {
      return this.exceptionRatesCache;
    }

    const exceptionRates = new Map();
    
    // 按部门分组明细数据
    const detailByDept = this._groupByDepartment(detailData);
    
    // 遍历每个部门计算异常率
    detailByDept.forEach((records, department) => {
      const totalCount = records.length;
      
      if (totalCount === 0) {
        return;
      }
      
      // 计算各环节异常数量
      const toServerExceptions = records.filter(r => 
        this._isException(r['部门到前置机对账状态'])
      ).length;
      
      const toWarehouseExceptions = records.filter(r => 
        this._isException(r['前置机到前置仓对账状态'])
      ).length;
      
      const toSourceExceptions = records.filter(r => 
        this._isException(r['前置仓到贴源层调度状态'])
      ).length;
      
      // 计算异常率
      exceptionRates.set(department, {
        toServer: totalCount > 0 ? toServerExceptions / totalCount : 0,
        toWarehouse: totalCount > 0 ? toWarehouseExceptions / totalCount : 0,
        toSource: totalCount > 0 ? toSourceExceptions / totalCount : 0,
        totalCount: totalCount,
        exceptions: {
          toServer: toServerExceptions,
          toWarehouse: toWarehouseExceptions,
          toSource: toSourceExceptions
        }
      });
    });
    
    // 缓存结果
    this.exceptionRatesCache = exceptionRates;
    
    // 输出统计信息到控制台以便调试
    this._logExceptionRates(exceptionRates);
    
    return exceptionRates;
  }

  /**
   * 将异常率转换为颜色值
   * @param {number} exceptionRate - 异常率（0-1）
   * @returns {string} RGB颜色字符串
   */
  exceptionRateToColor(exceptionRate) {
    // 确保异常率在0-1范围内
    const rate = Math.max(0, Math.min(1, exceptionRate));
    
    const { green, red } = this.colorConfig;
    
    // 使用线性插值计算颜色，确保平滑过渡
    // R = 82 + (255-82) × 异常率
    // G = 196 + (77-196) × 异常率
    // B = 26 + (79-26) × 异常率
    const r = Math.round(green.r + (red.r - green.r) * rate);
    const g = Math.round(green.g + (red.g - green.g) * rate);
    const b = Math.round(green.b + (red.b - green.b) * rate);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * 获取连接线颜色
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节（'toServer', 'toWarehouse', 'toSource'）
   * @returns {string} 颜色值
   */
  getLinkColor(department, stage) {
    try {
      if (!this.exceptionRatesCache) {
        console.warn('异常率尚未计算，请先调用 calculateExceptionRates 方法');
        return '#999999'; // 返回中性灰色
      }
      
      // 处理部门名称的空格和特殊字符
      const normalizedDept = this._normalizeDepartmentName(department);
      
      if (!normalizedDept) {
        console.warn('部门名称为空');
        return '#999999';
      }
      
      const deptData = this.exceptionRatesCache.get(normalizedDept);
      
      if (!deptData) {
        console.warn(`未找到部门 "${department}" 的异常率数据`);
        return '#999999'; // 返回中性灰色
      }
      
      const exceptionRate = deptData[stage];
      
      if (exceptionRate === undefined) {
        console.warn(`未找到部门 "${department}" 在环节 "${stage}" 的异常率数据`);
        return '#999999';
      }
      
      return this.exceptionRateToColor(exceptionRate);
    } catch (error) {
      console.error('获取连接线颜色时发生错误:', error);
      return '#999999';
    }
  }

  /**
   * 获取连接线的异常率数值
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节
   * @returns {number|null} 异常率（0-1）或null
   */
  getExceptionRate(department, stage) {
    try {
      if (!this.exceptionRatesCache) {
        return null;
      }
      
      const normalizedDept = this._normalizeDepartmentName(department);
      
      if (!normalizedDept) {
        return null;
      }
      
      const deptData = this.exceptionRatesCache.get(normalizedDept);
      
      if (!deptData) {
        return null;
      }
      
      return deptData[stage] !== undefined ? deptData[stage] : null;
    } catch (error) {
      console.error('获取异常率时发生错误:', error);
      return null;
    }
  }

  /**
   * 获取连接线的异常统计信息
   * @param {string} department - 部门名称
   * @param {string} stage - 流转环节
   * @returns {Object|null} 异常统计信息
   */
  getExceptionStats(department, stage) {
    try {
      if (!this.exceptionRatesCache) {
        return null;
      }
      
      const normalizedDept = this._normalizeDepartmentName(department);
      
      if (!normalizedDept) {
        return null;
      }
      
      const deptData = this.exceptionRatesCache.get(normalizedDept);
      
      if (!deptData) {
        return null;
      }
      
      return {
        exceptionCount: deptData.exceptions[stage],
        totalCount: deptData.totalCount,
        exceptionRate: deptData[stage]
      };
    } catch (error) {
      console.error('获取异常统计信息时发生错误:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.exceptionRatesCache = null;
  }

  /**
   * 按部门分组数据
   * @private
   */
  _groupByDepartment(detailData) {
    const grouped = new Map();
    
    detailData.forEach(record => {
      const dept = this._normalizeDepartmentName(record['部门']);
      
      if (!grouped.has(dept)) {
        grouped.set(dept, []);
      }
      
      grouped.get(dept).push(record);
    });
    
    return grouped;
  }

  /**
   * 判断是否为异常状态
   * @private
   */
  _isException(status) {
    if (!status) {
      return false;
    }
    
    // 去除空格和换行符后判断
    const normalizedStatus = status.trim();
    return normalizedStatus === '异常';
  }

  /**
   * 标准化部门名称（去除空格和特殊字符）
   * @private
   */
  _normalizeDepartmentName(name) {
    if (!name) {
      return '';
    }
    
    // 去除首尾空格，并将多个连续空格替换为单个空格
    // 同时去除常见的特殊字符（如全角空格、零宽字符等）
    return name.trim()
      .replace(/\s+/g, ' ')           // 多个空格替换为单个空格
      .replace(/[\u200B-\u200D\uFEFF]/g, '');  // 去除零宽字符
  }

  /**
   * 输出异常率统计信息到控制台
   * @private
   */
  _logExceptionRates(exceptionRates) {
    console.log('=== 异常率统计信息 ===');
    
    exceptionRates.forEach((data, department) => {
      console.log(`\n部门: ${department}`);
      console.log(`  总表数量: ${data.totalCount}`);
      console.log(`  部门→前置机: ${data.exceptions.toServer}张异常 (${(data.toServer * 100).toFixed(2)}%)`);
      console.log(`  前置机→前置仓: ${data.exceptions.toWarehouse}张异常 (${(data.toWarehouse * 100).toFixed(2)}%)`);
      console.log(`  前置仓→贴源层: ${data.exceptions.toSource}张异常 (${(data.toSource * 100).toFixed(2)}%)`);
    });
    
    console.log('\n======================');
  }
}
