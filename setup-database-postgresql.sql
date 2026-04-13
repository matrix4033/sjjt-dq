-- ========================================
-- PostgreSQL 数据库初始化脚本
-- 数据汇聚情况周报系统
-- ========================================

-- 创建数据库（如果不存在）
-- 注意：PostgreSQL 不支持 CREATE DATABASE IF NOT EXISTS
-- 需要先手动创建数据库或使用以下命令：
-- createdb -U postgres data_center

-- 连接到数据库后执行以下语句
-- psql -U postgres -d data_center -f setup-database-postgresql.sql

-- ========================================
-- 1. 删除已存在的表（如果需要重新创建）
-- ========================================

DROP TABLE IF EXISTS mx CASCADE;
DROP TABLE IF EXISTS hz CASCADE;

-- ========================================
-- 2. 创建汇总表 (hz)
-- ========================================

CREATE TABLE hz (
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

-- 添加表注释
COMMENT ON TABLE hz IS '汇总数据表';
COMMENT ON COLUMN hz.id IS '主键ID';
COMMENT ON COLUMN hz.bmmc IS '部门名称';
COMMENT ON COLUMN hz.bmbsl IS '部门表数量';
COMMENT ON COLUMN hz.qzjmc IS '前置机名称';
COMMENT ON COLUMN hz.qzjbsl IS '前置机表数量';
COMMENT ON COLUMN hz.qzcmc IS '前置仓名称';
COMMENT ON COLUMN hz.qzcbsl IS '前置仓表数量';
COMMENT ON COLUMN hz.tycmc IS '贴源层名称';
COMMENT ON COLUMN hz.tycbsl IS '贴源层表数量';
COMMENT ON COLUMN hz.cjsj IS '创建时间';
COMMENT ON COLUMN hz.gxsj IS '更新时间';

-- 创建索引
CREATE INDEX idx_hz_bmmc ON hz(bmmc);
CREATE INDEX idx_hz_cjsj ON hz(cjsj);

-- ========================================
-- 3. 创建明细表 (mx)
-- ========================================

CREATE TABLE mx (
    id SERIAL PRIMARY KEY,
    bm VARCHAR(100) NOT NULL COMMENT '部门',
    bzwm VARCHAR(200) NOT NULL COMMENT '表中文名',
    bywm VARCHAR(200) NOT NULL COMMENT '表英文名',
    bmdqzjzt VARCHAR(50) DEFAULT '正常' COMMENT '部门到前置机状态',
    ycyysm TEXT COMMENT '异常原因说明',
    qzjdqzczt VARCHAR(50) DEFAULT '正常' COMMENT '前置机到前置仓状态',
    ycyysm1 TEXT COMMENT '异常原因说明1',
    qzcdtyczt VARCHAR(50) DEFAULT '正常' COMMENT '前置仓到贴源层状态',
    ycyysm2 TEXT COMMENT '异常原因说明2',
    cjsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gxsj TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 添加表注释
COMMENT ON TABLE mx IS '明细数据表';
COMMENT ON COLUMN mx.id IS '主键ID';
COMMENT ON COLUMN mx.bm IS '部门';
COMMENT ON COLUMN mx.bzwm IS '表中文名';
COMMENT ON COLUMN mx.bywm IS '表英文名';
COMMENT ON COLUMN mx.bmdqzjzt IS '部门到前置机状态';
COMMENT ON COLUMN mx.ycyysm IS '异常原因说明';
COMMENT ON COLUMN mx.qzjdqzczt IS '前置机到前置仓状态';
COMMENT ON COLUMN mx.ycyysm1 IS '异常原因说明1';
COMMENT ON COLUMN mx.qzcdtyczt IS '前置仓到贴源层状态';
COMMENT ON COLUMN mx.ycyysm2 IS '异常原因说明2';
COMMENT ON COLUMN mx.cjsj IS '创建时间';
COMMENT ON COLUMN mx.gxsj IS '更新时间';

-- 创建索引
CREATE INDEX idx_mx_bm ON mx(bm);
CREATE INDEX idx_mx_bywm ON mx(bywm);
CREATE INDEX idx_mx_cjsj ON mx(cjsj);

-- ========================================
-- 4. 创建更新时间触发器
-- ========================================

-- 创建更新时间函数
CREATE OR REPLACE FUNCTION update_gxsj_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.gxsj = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为汇总表创建触发器
CREATE TRIGGER update_hz_gxsj
    BEFORE UPDATE ON hz
    FOR EACH ROW
    EXECUTE FUNCTION update_gxsj_column();

-- 为明细表创建触发器
CREATE TRIGGER update_mx_gxsj
    BEFORE UPDATE ON mx
    FOR EACH ROW
    EXECUTE FUNCTION update_gxsj_column();

-- ========================================
-- 5. 插入测试数据（可选）
-- ========================================

-- 插入汇总表测试数据
INSERT INTO hz (bmmc, bmbsl, qzjmc, qzjbsl, qzcmc, qzcbsl, tycmc, tycbsl) VALUES
('测试部门1', 10, '前置机1', 8, '前置仓1', 7, '贴源层1', 6),
('测试部门2', 15, '前置机2', 12, '前置仓2', 10, '贴源层2', 9);

-- 插入明细表测试数据
INSERT INTO mx (bm, bzwm, bywm, bmdqzjzt, ycyysm, qzjdqzczt, ycyysm1, qzcdtyczt, ycyysm2) VALUES
('测试部门1', '用户表', 'user_table', '正常', NULL, '正常', NULL, '正常', NULL),
('测试部门1', '订单表', 'order_table', '异常', '网络超时', '正常', NULL, '正常', NULL);

-- ========================================
-- 完成
-- ========================================

SELECT 'PostgreSQL 数据库初始化完成！' AS message;
SELECT '汇总表记录数: ' || COUNT(*) FROM hz;
SELECT '明细表记录数: ' || COUNT(*) FROM mx;
