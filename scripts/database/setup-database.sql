-- ============================================
-- 大数据中心数据汇聚情况周报系统 - 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS data_center DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE data_center;

-- 创建汇总表 (hz - 汇总)
CREATE TABLE IF NOT EXISTS hz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bmmc VARCHAR(100) COMMENT '部门名称',
    bmbsl INT COMMENT '部门表数量',
    qzjmc VARCHAR(100) COMMENT '前置机名称',
    qzjbsl INT COMMENT '前置机表数量',
    qzcmc VARCHAR(100) COMMENT '前置仓名称',
    qzcbsl INT COMMENT '前置仓表数量',
    tycmc VARCHAR(100) COMMENT '贴源层名称',
    tycbsl INT COMMENT '贴源层表数量',
    cjsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gxsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='汇总表';

-- 创建明细表 (mx - 明细)
CREATE TABLE IF NOT EXISTS mx (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bm VARCHAR(100) COMMENT '部门',
    bzwm VARCHAR(500) COMMENT '表中文名',
    bywm VARCHAR(500) COMMENT '表英文名',
    bmdqzjzt VARCHAR(50) COMMENT '部门到前置机状态',
    ycyysm VARCHAR(500) COMMENT '异常原因说明',
    qzjdqzczt VARCHAR(50) COMMENT '前置机到前置仓状态',
    ycyysm1 VARCHAR(500) COMMENT '异常原因说明1',
    qzcdtyczt VARCHAR(50) COMMENT '前置仓到贴源层状态',
    ycyysm2 VARCHAR(500) COMMENT '异常原因说明2',
    cjsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gxsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_bm (bm),
    INDEX idx_bzwm (bzwm(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='明细表';

-- 显示创建结果
SELECT '数据库和表创建完成！' AS status;
SHOW TABLES;
