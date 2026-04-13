"""
Flask API 服务
从 PostgreSQL 读取汇总和明细数据，提供 RESTful API 接口
"""

from flask import Flask, jsonify, send_from_directory, send_file, request, session, redirect, url_for
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import secrets
import time
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建 Flask 应用，配置静态文件目录
app = Flask(__name__, static_folder='../static', static_url_path='/static')
CORS(app)  # 允许跨域请求

# 会话配置
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_COOKIE_SECURE'] = False  # 开发环境设为False，生产环境应为True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# 固定的登录凭据
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'Scdsj2026'

# 速率限制配置
login_attempts = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 15 * 60  # 15分钟

# PostgreSQL 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', ''),
    'port': int(os.getenv('DB_PORT', '')),
    'user': os.getenv('DB_USER', ''),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', '')
}


def get_db_connection():
    """获取数据库连接"""
    import psycopg2
    return psycopg2.connect(**DB_CONFIG)


def rate_limit_login(f):
    """登录速率限制装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        current_time = time.time()
        
        # 清理过期的尝试记录
        login_attempts[client_ip] = [
            attempt_time for attempt_time in login_attempts[client_ip]
            if current_time - attempt_time < LOCKOUT_DURATION
        ]
        
        # 检查是否超过最大尝试次数
        if len(login_attempts[client_ip]) >= MAX_LOGIN_ATTEMPTS:
            return jsonify({
                'success': False,
                'message': f'登录尝试次数过多，请在{LOCKOUT_DURATION // 60}分钟后重试'
            }), 429
        
        # 记录本次尝试
        login_attempts[client_ip].append(current_time)
        
        return f(*args, **kwargs)
    return decorated_function


def clear_login_attempts(client_ip):
    """清除登录尝试记录"""
    if client_ip in login_attempts:
        del login_attempts[client_ip]


def login_required(f):
    """认证装饰器 - 要求用户登录"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated'):
            return jsonify({
                'success': False,
                'error': 'Authentication required',
                'redirect': '/login.html'
            }), 401
        
        # 检查会话是否过期
        if 'last_activity' in session:
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.now() - last_activity > app.config['PERMANENT_SESSION_LIFETIME']:
                session.clear()
                return jsonify({
                    'success': False,
                    'error': 'Session expired',
                    'redirect': '/login.html'
                }), 401
        
        # 更新最后活动时间
        session['last_activity'] = datetime.now().isoformat()
        session.permanent = True
        
        return f(*args, **kwargs)
    return decorated_function


def is_authenticated():
    """检查用户是否已认证"""
    if not session.get('authenticated'):
        return False
    
    # 检查会话是否过期
    if 'last_activity' in session:
        last_activity = datetime.fromisoformat(session['last_activity'])
        if datetime.now() - last_activity > app.config['PERMANENT_SESSION_LIFETIME']:
            session.clear()
            return False
    
    return True


@app.route('/', methods=['GET'])
def index():
    """提供前端页面"""
    # 检查是否已认证
    if not is_authenticated():
        return redirect('/login.html')
    
    try:
        return send_file('../index.html')
    except:
        return jsonify({
            'success': True,
            'message': '大数据中心数据汇聚情况周报系统 - API 服务',
            'version': '1.0.0',
            'endpoints': {
                'summary': '/api/summary',
                'detail': '/api/detail',
                'health': '/api/health'
            }
        })


@app.route('/login.html')
def login_page():
    """提供登录页面"""
    try:
        return send_file('../login.html')
    except:
        return '''
        <!DOCTYPE html>
        <html>
        <head><title>登录</title></head>
        <body>
        <h1>登录页面</h1>
        <p>login.html 文件未找到</p>
        </body>
        </html>
        '''


@app.route('/<path:filename>')
def static_files(filename):
    """提供静态文件"""
    # 安全检查：阻止访问敏感文件
    BLOCKED_PATTERNS = [
        '.env',           # 环境变量文件（包括 .env, .env.example, .env.local 等）
        '.git',           # Git 仓库
        '.kiro',          # Kiro 配置
        '__pycache__',    # Python 缓存
        '.py',            # Python 源码
        '.pyc',           # Python 编译文件
        '.pyo',           # Python 优化文件
        '.sh',            # Shell 脚本
        '.bat',           # 批处理脚本
        '.cmd',           # Windows 命令脚本
        '.sql',           # SQL 文件
        '.md',            # Markdown 文档
        '.txt',           # 文本文件（包括 requirements.txt 等）
        '.log',           # 日志文件
        '.csv',           # CSV 数据文件
        '.example',       # 示例配置文件
        '.sample',        # 示例文件
        '.bak',           # 备份文件
        '.backup',        # 备份文件
        '.old',           # 旧文件
        '.swp',           # Vim 交换文件
        '.tmp',           # 临时文件
        'dockerfile',     # Docker 配置（不区分大小写）
        'docker-compose', # Docker Compose
        '.vscode',        # VSCode 配置
        '.idea',          # IntelliJ IDEA 配置
        'venv',           # 虚拟环境
        'node_modules',   # Node.js 依赖
        'api/',           # API 目录
        'data/',          # 数据目录
        'docs/',          # 文档目录
        'systemd/',       # Systemd 配置
        'nginx/',         # Nginx 配置
        'offline-deployment/', # 离线部署文件
    ]
    
    # 检查文件名是否包含敏感模式
    filename_lower = filename.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern in filename_lower:
            return jsonify({'error': 'Access denied'}), 403
    
    # 白名单：允许访问的文件类型
    ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot']
    
    # 检查文件扩展名
    import os
    _, ext = os.path.splitext(filename)
    if ext and ext.lower() not in ALLOWED_EXTENSIONS:
        return jsonify({'error': 'File type not allowed'}), 403
    
    # 允许访问登录页面相关的静态文件
    if filename in ['login.html', 'css/main.css', 'js/auth.js']:
        try:
            return send_from_directory('..', filename)
        except:
            return jsonify({'error': 'File not found'}), 404
    
    # 其他文件需要认证
    if not is_authenticated():
        return redirect('/login.html')
    
    try:
        # 尝试从根目录提供文件
        return send_from_directory('..', filename)
    except:
        # 如果文件不存在，返回 404
        return jsonify({'error': 'File not found'}), 404


@app.route('/api/', methods=['GET'])
def api_index():
    """API 根路径"""
    return jsonify({
        'success': True,
        'message': '大数据中心数据汇聚情况周报系统 - API 服务',
        'version': '1.0.0',
        'endpoints': {
            'summary': '/api/summary',
            'detail': '/api/detail',
            'health': '/api/health',
            'auth': {
                'login': '/api/auth/login',
                'logout': '/api/auth/logout',
                'status': '/api/auth/status'
            }
        }
    })


@app.route('/api/auth/login', methods=['POST'])
@rate_limit_login
def login():
    """用户登录"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '请提供登录信息'
            }), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        # 验证输入
        if not username or not password:
            return jsonify({
                'success': False,
                'message': '用户名和密码不能为空'
            }), 400
        
        # 验证凭据
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            # 登录成功，清除失败尝试记录
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
            clear_login_attempts(client_ip)
            
            # 创建会话
            session.clear()
            session['authenticated'] = True
            session['username'] = username
            session['login_time'] = datetime.now().isoformat()
            session['last_activity'] = datetime.now().isoformat()
            session.permanent = True
            
            return jsonify({
                'success': True,
                'message': '登录成功',
                'redirect_url': '/'
            })
        else:
            return jsonify({
                'success': False,
                'message': '用户名或密码错误'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': '登录过程中发生错误'
        }), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """用户登出"""
    session.clear()
    return jsonify({
        'success': True,
        'message': '已成功登出',
        'redirect_url': '/login.html'
    })


@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    """检查认证状态"""
    authenticated = is_authenticated()
    
    if authenticated:
        return jsonify({
            'success': True,
            'authenticated': True,
            'username': session.get('username'),
            'login_time': session.get('login_time')
        })
    else:
        return jsonify({
            'success': True,
            'authenticated': False
        })


@app.route('/api/summary', methods=['GET'])
@login_required
def get_summary():
    """获取汇总数据"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 查询汇总表 (hz)
        cursor.execute("""
            SELECT 
                id,
                bmmc AS "部门名称",
                bmbsl AS "部门表数量",
                qzjmc AS "前置机名称",
                qzjbsl AS "前置机表数量",
                qzcmc AS "前置仓名称",
                qzcbsl AS "前置仓表数量",
                tycmc AS "贴源层名称",
                tycbsl AS "贴源层表数量",
                cjsj AS "创建时间",
                gxsj AS "更新时间"
            FROM sjjt_taskmonitor.hz
        """)
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': data,
            'count': len(data)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/detail', methods=['GET'])
@login_required
def get_detail():
    """获取明细数据"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 查询明细表 (mx)
        cursor.execute("""
select 
lc.bm as "部门",
lc.bzwm AS "表中文名",
lc.bywm AS "表英文名",
lc.bmdqzjzt AS "部门到前置机状态",
lc.ycyysm AS "异常原因说明",
lc.qzjdqzczt AS "前置机到前置仓状态",
lc.ycyysm1 AS "异常原因说明1",
lt.qzcdtyczt AS "前置仓到贴源层状态",
lt.ycyysm2 AS "异常原因说明2",
lc.cjsj AS "创建时间",
lc.gxsj AS "更新时间"
from  sjjt_taskmonitor.sjdz_lc lc 
left join sjjt_taskmonitor.sjdz_lt lt 
on lc.bm=lt.bm
and lc.bzwm=lt.bzwm
and lc.bywm=lt.bywm
union all 
select 
lc.bm as "部门",
lc.bzwm AS "表中文名",
lc.bywm AS "表英文名",
lc.bmdqzjzt AS "部门到前置机状态",
lc.ycyysm AS "异常原因说明",
lc.qzjdqzczt AS "前置机到前置仓状态",
lc.ycyysm1 AS "异常原因说明1",
yh.qzcdtyczt AS "前置仓到贴源层状态",
yh.ycyysm2 AS "异常原因说明2",
lc.cjsj AS "创建时间",
lc.gxsj AS "更新时间"
from  sjjt_taskmonitor.sjdz_lc lc 
left join sjjt_taskmonitor.sjdz_yh yh
on lc.bm=yh.bm
and lc.bzwm=yh.bzwm
and lc.bywm=yh.bywm
        """)
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': data,
            'count': len(data)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    try:
        conn = get_db_connection()
        conn.close()
        return jsonify({
            'success': True,
            'message': 'API 服务运行正常，数据库连接成功'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': '数据库连接失败',
            'error': str(e)
        }), 500


if __name__ == '__main__':
    # 添加安全头部
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        return response
    
    port = int(os.getenv('PORT', '5000'))
    print('=' * 50)
    print('大数据中心数据汇聚情况周报系统')
    print('=' * 50)
    print(f'数据库: {DB_CONFIG["host"]}:{DB_CONFIG["port"]}/{DB_CONFIG["database"]}')
    print(f'服务端口: {port}')
    print('服务功能:')
    print('  - 前端页面: /')
    print('  - 登录页面: /login.html')
    print('  - API 端点:')
    print('    - GET /api/summary  (获取汇总数据)')
    print('    - GET /api/detail   (获取明细数据)')
    print('    - GET /api/health   (健康检查)')
    print('    - POST /api/auth/login   (用户登录)')
    print('    - POST /api/auth/logout  (用户登出)')
    print('    - GET /api/auth/status   (认证状态)')
    print('=' * 50)
    
    app.run(host='0.0.0.0', port=port, debug=False)
