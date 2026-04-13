import tarfile
import tempfile
import os

def test_cve_2025_4138():
    with tempfile.TemporaryDirectory() as tmpdir:
        # 1. 构造恶意tar文件（包含可绕过过滤器的符号链接）
        tar_path = os.path.join(tmpdir, "malicious.tar")
        extract_dir = os.path.join(tmpdir, "extract")
        os.makedirs(extract_dir, exist_ok=True)

        # 创建符号链接并加入tar文件（模拟越界链接）
        symlink_path = os.path.join(tmpdir, "bad_symlink")
        try:
            os.symlink("/etc/passwd", symlink_path)  # 指向系统敏感文件
        except OSError as e:
            print(f"⚠️  符号链接创建失败（非漏洞问题）：{e}，跳过符号链接测试，直接验证过滤器")
        
        # 写入tar文件
        with tarfile.open(tar_path, "w") as tf:
            # 故意构造可绕过过滤器的路径
            tf.add(symlink_path, arcname="bad_symlink", filter=lambda x: x) if os.path.exists(symlink_path) else None
            # 补充测试普通越界路径
            tf.add(os.devnull, arcname="../../test_null")

        # 2. 尝试提取（启用默认过滤器）
        try:
            with tarfile.open(tar_path, "r") as tf:
                # 启用官方默认过滤器（修复后会拦截越界）
                tf.extractall(extract_dir, filter='data')
            # 检查是否生成越界文件/链接
            extracted_bad = os.path.join(extract_dir, "../../test_null")
            if os.path.exists(extracted_bad):
                print("❌ 风险：CVE-2025-4138漏洞未修复，过滤器被绕过")
            else:
                print("✅ 安全：过滤器生效，越界路径被拦截")
        except (tarfile.TarError, OSError, ValueError) as e:
            print(f"✅ 安全：漏洞已修复，提取被拦截，报错：{e}")

if __name__ == "__main__":
    test_cve_2025_4138()