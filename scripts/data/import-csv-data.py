#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CSV 数据导入脚本 - PostgreSQL 版本
导入汇总.csv 和明细.csv 到数据库
"""

import csv
import os
import sys
from datetime import datetime
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# 加载环境变量
load_dotenv('api/.env')

# 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', ''),
    'port': int(os.getenv('DB_PORT', '')),
    'database': os.getenv('DB_NAME', 'sjjt_taskmonitor'),
    'user': os.getenv('DB_USER', ''),
    'password': os.getenv('DB_PASSWORD', '')
}

def get_db_connection():
    """获取数据库连接"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"✗ 数据库连接失败: {e}")
        sys.exit(1)

def import_huizong(conn, csv_file='data/汇总.csv'):
    """导入汇总表数据"""
    print(f"\n开始导入汇总表数据: {csv_file}")
    
    if not os.path.exists(csv_file):
        print(f"✗ 文件不存在: {csv_file}")
        return False
    
    cursor = conn.cursor()
    
    try:
        # 清空现有数据（兼容 PGXC）
        cursor.execute("DELETE FROM sjjt_taskmonitor.hz")
        print("✓ 已清空汇总表")
        
        # 读取 CSV 文件
        with open(csv_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            insert_sql = """
                INSERT INTO sjjt_taskmonitor.hz 
                (id, bmmc, bmbsl, qzjmc, qzjbsl, qzcmc, qzcbsl, tycmc, tycbsl, cjsj, gxsj)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            row_count = 0
            now = datetime.now()
            
            for idx, row in enumerate(reader, start=1):
                try:
                    # 提取数据
                    bmmc = row.get('部门名称', '').strip()
                    bmbsl = int(row.get('部门表数量', 0))
                    qzjmc = row.get('前置机名称', '').strip()
                    qzjbsl = int(row.get('前置机表数量', 0))
                    qzcmc = row.get('前置仓名称', '').strip()
                    qzcbsl = int(row.get('前置仓表数量', 0))
                    tycmc = row.get('贴源层名称', '').strip()
                    tycbsl = int(row.get('贴源层表数量', 0))
                    
                    # 插入数据
                    cursor.execute(insert_sql, (
                        idx, bmmc, bmbsl, qzjmc, qzjbsl, 
                        qzcmc, qzcbsl, tycmc, tycbsl, now, now
                    ))
                    row_count += 1
                    
                except Exception as e:
                    print(f"⚠ 第 {idx} 行数据导入失败: {e}")
                    print(f"   数据: {row}")
                    continue
            
            conn.commit()
            print(f"✓ 汇总表导入完成，共 {row_count} 条记录")
            return True
            
    except Exception as e:
        conn.rollback()
        print(f"✗ 汇总表导入失败: {e}")
        return False
    finally:
        cursor.close()

def import_mingxi(conn, csv_file='data/明细.csv'):
    """导入明细表数据"""
    print(f"\n开始导入明细表数据: {csv_file}")
    
    if not os.path.exists(csv_file):
        print(f"✗ 文件不存在: {csv_file}")
        return False
    
    cursor = conn.cursor()
    
    try:
        # 清空现有数据（兼容 PGXC）
        cursor.execute("DELETE FROM sjjt_taskmonitor.mx")
        print("✓ 已清空明细表")
        
        # 读取 CSV 文件
        with open(csv_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            insert_sql = """
                INSERT INTO sjjt_taskmonitor.mx 
                (id, bm, bzwm, bywm, bmdqzjzt, ycyysm, qzjdqzczt, ycyysm1, qzcdtyczt, ycyysm2, cjsj, gxsj)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            row_count = 0
            now = datetime.now()
            
            for idx, row in enumerate(reader, start=1):
                try:
                    # 提取数据（根据实际 CSV 列名调整）
                    # CSV 列顺序：部门,表中文名,表英文名,部门到前置机状态,异常原因说明,前置机到前置仓状态,异常原因说明,前置仓到贴源层状态,异常原因说明,
                    cols = list(row.values())
                    bm = cols[0].strip() if len(cols) > 0 else ''
                    bzwm = cols[1].strip() if len(cols) > 1 else ''
                    bywm = cols[2].strip() if len(cols) > 2 else ''
                    bmdqzjzt = cols[3].strip() if len(cols) > 3 else ''
                    ycyysm = cols[4].strip() if len(cols) > 4 else ''
                    qzjdqzczt = cols[5].strip() if len(cols) > 5 else ''
                    ycyysm1 = cols[6].strip() if len(cols) > 6 else ''
                    qzcdtyczt = cols[7].strip() if len(cols) > 7 else ''
                    ycyysm2 = cols[8].strip() if len(cols) > 8 else ''
                    
                    # 插入数据
                    cursor.execute(insert_sql, (
                        idx, bm, bzwm, bywm, bmdqzjzt, ycyysm,
                        qzjdqzczt, ycyysm1, qzcdtyczt, ycyysm2, now, now
                    ))
                    row_count += 1
                    
                except Exception as e:
                    print(f"⚠ 第 {idx} 行数据导入失败: {e}")
                    print(f"   数据: {row}")
                    continue
            
            conn.commit()
            print(f"✓ 明细表导入完成，共 {row_count} 条记录")
            return True
            
    except Exception as e:
        conn.rollback()
        print(f"✗ 明细表导入失败: {e}")
        return False
    finally:
        cursor.close()

def main():
    """主函数"""
    print("=" * 60)
    print("CSV 数据导入工具 - PostgreSQL")
    print("=" * 60)
    
    # 连接数据库
    print("\n连接数据库...")
    conn = get_db_connection()
    print(f"✓ 已连接到数据库: {DB_CONFIG['database']}")
    
    try:
        # 导入汇总表
        success_hz = import_huizong(conn)
        
        # 导入明细表
        success_mx = import_mingxi(conn)
        
        # 显示结果
        print("\n" + "=" * 60)
        if success_hz and success_mx:
            print("✓ 所有数据导入成功！")
        elif success_hz or success_mx:
            print("⚠ 部分数据导入成功")
        else:
            print("✗ 数据导入失败")
        print("=" * 60)
        
    finally:
        conn.close()
        print("\n数据库连接已关闭")

if __name__ == '__main__':
    main()
