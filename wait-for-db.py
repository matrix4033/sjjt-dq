#!/usr/bin/env python3
"""
等待数据库启动的脚本
"""
import time
import psycopg2
import os
import sys

def wait_for_db():
    """等待数据库连接可用"""
    db_config = {
        'host': os.getenv('DB_HOST', 'postgres'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgres123'),
        'database': os.getenv('DB_NAME', 'data_center')
    }
    
    max_retries = 30
    retry_count = 0
    
    print("等待数据库启动...")
    
    while retry_count < max_retries:
        try:
            conn = psycopg2.connect(**db_config)
            conn.close()
            print("数据库连接成功！")
            return True
        except psycopg2.OperationalError:
            retry_count += 1
            print(f"数据库未就绪，重试 {retry_count}/{max_retries}...")
            time.sleep(2)
    
    print("数据库连接超时！")
    return False

if __name__ == "__main__":
    if wait_for_db():
        sys.exit(0)
    else:
        sys.exit(1)