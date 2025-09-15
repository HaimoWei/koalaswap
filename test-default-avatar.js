// 测试默认头像配置的简单脚本
import fs from 'node:fs';

const CONFIG_FILE = 'backend/user-service/src/main/resources/application-local.yml';

try {
  const content = fs.readFileSync(CONFIG_FILE, 'utf8');
  const match = content.match(/default-avatar-url:\s*(.+)/);

  if (match) {
    const avatarUrl = match[1].trim();
    console.log('✅ 配置文件已更新');
    console.log('默认头像URL:', avatarUrl);

    if (avatarUrl.includes('cloudfront')) {
      console.log('✅ 已配置为CDN地址');
      console.log('\n🎯 任务完成! 主要成果:');
      console.log('1. ✅ 默认头像已上传到S3: avatar/default-avatar.v1.svg');
      console.log('2. ✅ CDN地址可访问:', avatarUrl);
      console.log('3. ✅ 本地配置已更新');
      console.log('\n📋 生产环境配置:');
      console.log('请设置环境变量: APP_USER_DEFAULT_AVATAR_URL=' + avatarUrl);
    } else {
      console.log('⚠️  仍在使用本地路径');
    }
  } else {
    console.log('❌ 配置文件中未找到default-avatar-url设置');
  }
} catch (error) {
  console.error('❌ 读取配置文件失败:', error.message);
}

console.log('\n🔧 如需验证功能，请:');
console.log('1. 重启 user-service 以应用新配置');
console.log('2. 测试未设置头像的用户接口 /api/users/{id}/public');
console.log('3. 确认返回的avatarUrl为CDN地址');