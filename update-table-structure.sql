-- ============================================
-- 修改明细表字段长度
-- ============================================

USE data_center;

-- 修改表中文名和表英文名字段长度
ALTER TABLE mx MODIFY COLUMN bzwm VARCHAR(500) COMMENT '表中文名';
ALTER TABLE mx MODIFY COLUMN bywm VARCHAR(500) COMMENT '表英文名';

-- 显示修改结果
SELECT '表结构修改完成！' AS status;
DESCRIBE mx;
