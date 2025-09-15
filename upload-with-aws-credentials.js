// 临时脚本：设置所有必要的环境变量并运行上传脚本
process.env.ADMIN_EMAIL = 'weihaimoau@gmail.com';
process.env.ADMIN_PASSWORD = 'weihaimo';

// 设置AWS凭据
process.env.AWS_ACCESS_KEY_ID = 'AKIASCWGGPSQ5EEMG4EC';
process.env.AWS_SECRET_ACCESS_KEY = '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';
process.env.AWS_REGION = 'ap-southeast-2';

// 动态引入并执行原脚本
require('./scripts/upload-default-avatar.js');