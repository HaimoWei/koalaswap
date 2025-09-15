// 临时脚本：设置环境变量并运行上传脚本
process.env.ADMIN_EMAIL = 'weihaimoau@gmail.com';
process.env.ADMIN_PASSWORD = 'weihaimo';

// 动态引入并执行原脚本
require('./scripts/upload-default-avatar.js');