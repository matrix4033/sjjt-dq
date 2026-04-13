"""
CSV数据导入MySQL脚本
将data目录下的汇总.csv和明细.csv导入到MySQL数据库
"""

import pymysql
import csv
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量 - 使用绝对路径
env_path = Path(__file__).parent / 'api' / '.env'
load_dotenv(dotenv_path=env_path)

# MySQL 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'data_center'),
    'charset': 'utf8mb4'
}

# 调试：打印配置（隐藏密码）
print(f'配置检查:')
print(f'  DB_HOST: {DB_CONFIG["host"]}')
print(f'  DB_PORT: {DB_CONFIG["port"]}')
print(f'  DB_USER: {DB_CONFIG["user"]}')
print(f'  DB_PASSWORD: {"*" * len(DB_CONFIG["password"]) if DB_CONFIG["password"] else "(空)"}')
print(f'  DB_NAME: {DB_CONFIG["database"]}')
print()

def import_summary_data():
    """导入汇总数据"""
    print('开始导入汇总数据...')
    
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # 清空现有数据（可选）
    cursor.execute("TRUNCATE TABLE hz")
    
    # 读取CSV文件
    with open('data/汇总.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader)  # 读取表头
        
        # 打印表头用于调试
        print(f'CSV列名: {headers}')
        
        count = 0
        for row in reader:
            # 跳过空行
            if not row or len(row) < 8:
                continue
                
            sql = """
                INSERT INTO hz 
                (bmmc, bmbsl, qzjmc, qzjbsl, qzcmc, qzcbsl, tycmc, tycbsl)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                row[0].strip(),  # 部门名称 -> bmmc
                int(row[1]) if row[1].strip() else 0,  # 部门表数量 -> bmbsl
                row[2].strip(),  # 前置机名称 -> qzjmc
                int(row[3]) if row[3].strip() else 0,  # 前置机表数量 -> qzjbsl
                row[4].strip(),  # 前置仓名称 -> qzcmc
                int(row[5]) if row[5].strip() else 0,  # 前置仓表数量 -> qzcbsl
                row[6].strip(),  # 贴源层名称 -> tycmc
                int(row[7]) if row[7].strip() else 0   # 贴源层表数量 -> tycbsl
            )
            cursor.execute(sql, values)
            count += 1
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f'汇总数据导入完成！共导入 {count} 条记录')

def import_detail_data():
    """导入明细数据"""
    print('开始导入明细数据...')
    
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # 清空现有数据（可选）
    cursor.execute("TRUNCATE TABLE mx")
    
    # 读取CSV文件
    with open('data/明细.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader)  # 读取表头
        
        # 打印表头用于调试
        print(f'CSV列名: {headers[:5]}...')  # 只打印前5列
        
        count = 0
        for row in reader:
            # 跳过空行
            if not row or len(row) < 9:
                continue
            
            sql = """
                INSERT INTO mx 
                (bm, bzwm, bywm, bmdqzjzt, ycyysm, 
                 qzjdqzczt, ycyysm1, qzcdtyczt, ycyysm2)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                row[0].strip(),  # 部门 -> bm
                row[1].strip(),  # 表中文名 -> bzwm
                row[2].strip(),  # 表英文名 -> bywm
                row[3].strip(),  # 部门到前置机状态 -> bmdqzjzt
                row[4].strip(),  # 异常原因说明 -> ycyysm
                row[5].strip(),  # 前置机到前置仓状态 -> qzjdqzczt
                row[6].strip(),  # 异常原因说明1 -> ycyysm1
                row[7].strip(),  # 前置仓到贴源层状态 -> qzcdtyczt
                row[8].strip()   # 异常原因说明2 -> ycyysm2
            )
            cursor.execute(sql, values)
            count += 1
            
            # 每1000条提交一次
            if count % 1000 == 0:
                conn.commit()
                print(f'已导入 {count} 条记录...')
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f'明细数据导入完成！共导入 {count} 条记录')

def main():
    """主函数"""
    print('=' * 60)
    print('CSV数据导入MySQL工具')
    print('=' * 60)
    print(f'数据库: {DB_CONFIG["host"]}:{DB_CONFIG["port"]}/{DB_CONFIG["database"]}')
    print('=' * 60)
    
    try:
        # 测试数据库连接
        conn = pymysql.connect(**DB_CONFIG)
        conn.close()
        print('✓ 数据库连接成功')
        print()
        
        # 导入汇总数据
        import_summary_data()
        print()
        
        # 导入明细数据
        import_detail_data()
        print()
        
        print('=' * 60)
        print('✓ 所有数据导入完成！')
        print('=' * 60)
        
    except Exception as e:
        print(f'✗ 错误: {str(e)}')
        print()
        print('请检查：')
        print('1. MySQL服务是否正在运行')
        print('2. api/.env 配置是否正确')
        print('3. 数据库和表是否已创建（运行 setup-database.sql）')

if __name__ == '__main__':
    main()
