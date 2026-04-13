-- ========================================
-- PostgreSQL 数据库初始化脚本
-- 数据汇聚情况周报系统
-- Schema: sjjt_taskmonitor
-- ========================================

-- 创建 schema（如果不存在）
CREATE SCHEMA IF NOT EXISTS sjjt_taskmonitor;

-- ========================================
-- 1. 汇总表 (hz)
-- ========================================

DROP TABLE IF EXISTS sjjt_taskmonitor.hz CASCADE;

CREATE TABLE sjjt_taskmonitor.hz (
    id SERIAL PRIMARY KEY,
    bmmc VARCHAR(100) NOT NULL COMMENT '部门名称',
    bmbsl INTEGER DEFAULT 0 COMMENT '部门表数量',
    qzjmc VARCHAR(100) COMMENT '前置机名称',
    qzjbsl INTEGER DEFAULT 0 COMMENT '前置机表数量',
    qzcmc VARCHAR(100) COMMENT '前置仓名称',
    qzcbsl INTEGER DEFAULT 0 COMMENT '前置仓表数量',
    tycmc VARCHAR(100) COMMENT '贴源层名称',
    tycbsl INTEGER DEFAULT 0 COMMENT '贴源层表数量',
    cjsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gxsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

CREATE INDEX idx_hz_bmmc ON sjjt_taskmonitor.hz(bmmc);
CREATE INDEX idx_hz_cjsj ON sjjt_taskmonitor.hz(cjsj);

-- ========================================
-- 2. 流程明细表 (sjdz_lc)
-- ========================================

DROP TABLE IF EXISTS sjjt_taskmonitor.sjdz_lc CASCADE;

CREATE TABLE sjjt_taskmonitor.sjdz_lc (
    id SERIAL PRIMARY KEY,
    bm VARCHAR(100) NOT NULL COMMENT '部门',
    bzwm VARCHAR(200) NOT NULL COMMENT '表中文名',
    bywm VARCHAR(200) NOT NULL COMMENT '表英文名',
    bmdqzjzt VARCHAR(50) DEFAULT '正常' COMMENT '部门到前置机状态',
    ycyysm TEXT COMMENT '异常原因说明',
    qzjdqzczt VARCHAR(50) DEFAULT '正常' COMMENT '前置机到前置仓状态',
    ycyysm1 TEXT COMMENT '异常原因说明1',
    cjsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gxsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

CREATE INDEX idx_sjdz_lc_bm ON sjjt_taskmonitor.sjdz_lc(bm);
CREATE INDEX idx_sjdz_lc_bywm ON sjjt_taskmonitor.sjdz_lc(bywm);

-- ========================================
-- 3. 流程明细表2 (sjdz_lt)
-- ========================================

DROP TABLE IF EXISTS sjjt_taskmonitor.sjdz_lt CASCADE;

CREATE TABLE sjjt_taskmonitor.sjdz_lt (
    id SERIAL PRIMARY KEY,
    bm VARCHAR(100) NOT NULL COMMENT '部门',
    bzwm VARCHAR(200) NOT NULL COMMENT '表中文名',
    bywm VARCHAR(200) NOT NULL COMMENT '表英文名',
    qzcdtyczt VARCHAR(50) DEFAULT '正常' COMMENT '前置仓到贴源层状态',
    ycyysm2 TEXT COMMENT '异常原因说明2',
    cjsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gxsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

CREATE INDEX idx_sjdz_lt_bm ON sjjt_taskmonitor.sjdz_lt(bm);
CREATE INDEX idx_sjdz_lt_bywm ON sjjt_taskmonitor.sjdz_lt(bywm);

-- ========================================
-- 4. 流程明细表3 (sjdz_yh)
-- ========================================

DROP TABLE IF EXISTS sjjt_taskmonitor.sjdz_yh CASCADE;

CREATE TABLE sjjt_taskmonitor.sjdz_yh (
    id SERIAL PRIMARY KEY,
    bm VARCHAR(100) NOT NULL COMMENT '部门',
    bzwm VARCHAR(200) NOT NULL COMMENT '表中文名',
    bywm VARCHAR(200) NOT NULL COMMENT '表英文名',
    qzcdtyczt VARCHAR(50) DEFAULT '正常' COMMENT '前置仓到贴源层状态',
    ycyysm2 TEXT COMMENT '异常原因说明2',
    cjsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gxsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

CREATE INDEX idx_sjdz_yh_bm ON sjjt_taskmonitor.sjdz_yh(bm);
CREATE INDEX idx_sjdz_yh_bywm ON sjjt_taskmonitor.sjdz_yh(bywm);

-- ========================================
-- 5. 更新时间触发器
-- ========================================

CREATE OR REPLACE FUNCTION sjjt_taskmonitor.update_gxsj_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.gxsj = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hz_gxsj
    BEFORE UPDATE ON sjjt_taskmonitor.hz
    FOR EACH ROW
    EXECUTE FUNCTION sjjt_taskmonitor.update_gxsj_column();

CREATE TRIGGER update_sjdz_lc_gxsj
    BEFORE UPDATE ON sjjt_taskmonitor.sjdz_lc
    FOR EACH ROW
    EXECUTE FUNCTION sjjt_taskmonitor.update_gxsj_column();

CREATE TRIGGER update_sjdz_lt_gxsj
    BEFORE UPDATE ON sjjt_taskmonitor.sjdz_lt
    FOR EACH ROW
    EXECUTE FUNCTION sjjt_taskmonitor.update_gxsj_column();

CREATE TRIGGER update_sjdz_yh_gxsj
    BEFORE UPDATE ON sjjt_taskmonitor.sjdz_yh
    FOR EACH ROW
    EXECUTE FUNCTION sjjt_taskmonitor.update_gxsj_column();

-- ========================================
-- 6. 插入测试数据
-- ========================================

INSERT INTO sjjt_taskmonitor.hz (bmmc, bmbsl, qzjmc, qzjbsl, qzcmc, qzcbsl, tycmc, tycbsl) VALUES
('测试部门1', 10, '前置机1', 8, '前置仓1', 7, '贴源层1', 6),
('测试部门2', 15, '前置机2', 12, '前置仓2', 10, '贴源层2', 9);

INSERT INTO sjjt_taskmonitor.sjdz_lc (bm, bzwm, bywm, bmdqzjzt, ycyysm, qzjdqzczt, ycyysm1) VALUES
('测试部门1', '用户表', 'user_table', '正常', NULL, '正常', NULL),
('测试部门1', '订单表', 'order_table', '异常', '网络超时', '正常', NULL);

INSERT INTO sjjt_taskmonitor.sjdz_lt (bm, bzwm, bywm, qzcdtyczt, ycyysm2) VALUES
('测试部门1', '用户表', 'user_table', '正常', NULL),
('测试部门1', '订单表', 'order_table', '正常', NULL);

INSERT INTO sjjt_taskmonitor.sjdz_yh (bm, bzwm, bywm, qzcdtyczt, ycyysm2) VALUES
('测试部门1', '用户表', 'user_table', '正常', NULL),
('测试部门1', '订单表', 'order_table', '正常', NULL);

-- ========================================
-- 完成
-- ========================================

SELECT 'sjjt_taskmonitor schema 初始化完成！' AS message;
