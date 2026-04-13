#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
从 CSV 文件导入数据到 PostgreSQL 数据库
"""

import psycopg2
import psycopg2.extras
import csv
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv('api/.env')

# PostgreSQL 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'data_center')
}

def import_summary_data(conn, csv_file='data/汇总.csv'):
    """导入汇总数据"""
    print(f"\n正在导入汇总数据: {csv_file}")
    
    cursor = conn.cursor()
    
    # 清空表
    cursor.execute("TRUNCATE TABLE hz RESTART IDENTITY CASCADE")
    print("✓ 已清空汇总表")
    
    # 读取 CSV 文件
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        count = 0
        
        for row in reader:
            cursor.execute("""
                INSERT INTO hz (bmmc, bmbsl, qzjmc, qzjbsl, qzcmc, qzcbsl, tycmc, tycbsl)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                row.get('部门名称', ''),
                int(row.get('部门表数量', 0) or 0),
                row.get('前置机名称', ''),
                int(row.get('前置机表数量', 0) or 0),
                row.get('前置仓名称', ''),
                int(row.get('前置仓表数量', 0) or 0),
                row.get('贴源层名称', ''),
                int(row.get('贴源层表数量', 0) or 0)
            ))
            count += 1
    
    conn.commit()
    print(f"✓ 成功导入 {count} 条汇总数据")
    cursor.close()


def import_detail_data(conn, csv_file='data/明细.csv'):
    """导入明细数据"""
    print(f"\n正在导入明细数据: {csv_file}")
    
    cursor = conn.cursor()
    
    # 清空表
    cursor.execute("TRUNCATE TABLE mx RESTART IDENTITY CASCADE")
    print("✓ 已清空明细表")
    
    # 读取 CSV 文件
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        count = 0
        
        for row in reader:
            cursor.execute("""
                INSERT INTO mx (bm, bzwm, bywm, bmdqzjzt, ycyysm, qzjdqzczt, ycyysm1, qzcdtyczt, ycyysm2)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                row.get('部门', ''),
                row.get('表中文名', ''),
                row.get('表英文名', ''),
                row.get('部门到前置机状态', '正常'),
                row.get('异常原因说明', None) or None,
                row.get('前置机到前置仓状态', '正常'),
                row.get('异常原因说明1', None) or None,
                row.get('前置仓到贴源层状态', '正常'),
                row.get('异常原因说明2', None) or None
            ))
            count += 1
    
    conn.commit()
    print(f"✓ 成功导入 {count} 条明细数据")
    cursor.close()


def main():
    """主函数"""
    print("=" * 60)
    print("CSV 数据导入工具 - PostgreSQL 版本")
    print("=" * 60)
    
    # 连接数据库
    try:
        print(f"\n正在连接数据库...")
        print(f"  主机: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print(f"  数据库: {DB_CONFIG['database']}")
        print(f"  用户: {DB_CONFIG['user']}")
        
        conn = psycopg2.connect(**DB_CONFIG)
        print("✓ 数据库连接成功")
        
        # 导入汇总数据
        if os.path.exists('data/汇总.csv'):
            import_summary_data(conn, 'data/汇总.csv')
        else:
            print("⚠ 警告: 未找到 data/汇总.csv 文件")
        
        # 导入明细数据
        if os.path.exists('data/明细.csv'):
            import_detail_data(conn, 'data/明细.csv')
        else:
            print("⚠ 警告: 未找到 data/明细.csv 文件")
        
        # 显示统计信息
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM hz")
        hz_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM mx")
        mx_count = cursor.fetchone()[0]
        cursor.close()
        
        print("\n" + "=" * 60)
        print("导入完成！")
        print("=" * 60)
        print(f"汇总表记录数: {hz_count}")
        print(f"明细表记录数: {mx_count}")
        print("=" * 60)
        
        conn.close()
        
    except psycopg2.Error as e:
        print(f"\n✗ 数据库错误: {e}")
        print("\n请检查:")
        print("1. PostgreSQL 服务是否已启动")
        print("2. 数据库配置是否正确 (api/.env)")
        print("3. 数据库是否已创建")
        print("4. 用户是否有足够的权限")
        return 1
    except FileNotFoundError as e:
        print(f"\n✗ 文件错误: {e}")
        print("\n请确保 CSV 文件存在于 data/ 目录下")
        return 1
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
