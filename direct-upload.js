#!/usr/bin/env node
// 直接上传默认头像到S3的简化脚本

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';

const S3_BUCKET = 'koalaswap';
const CDN_BASE = 'https://d3367sa0s3hyt3.cloudfront.net';
const SRC = 'frontend-web/public/assets/avatars/default-avatar.svg';

async function main() {
  console.log('开始直接上传默认头像到S3...');

  // 检查文件是否存在
  if (!fs.existsSync(SRC)) {
    console.error('源文件不存在:', SRC);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(SRC);

  // 使用有权限的路径: avatar/*
  const objectKey = 'avatar/default-avatar.v1.svg';

  // 配置S3客户端
  const s3Client = new S3Client({
    region: 'ap-southeast-2',
    credentials: {
      accessKeyId: 'AKIASCWGGPSQ5EEMG4EC',
      secretAccessKey: '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'
    }
  });

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: 'image/svg+xml',
      CacheControl: 'public, max-age=31536000', // 1年缓存
    });

    await s3Client.send(command);

    const cdnUrl = `${CDN_BASE}/${objectKey}`;
    console.log('✅ 上传成功！CDN URL:');
    console.log(cdnUrl);
    console.log('\n接下来的步骤:');
    console.log('- 生产环境设置: APP_USER_DEFAULT_AVATAR_URL=' + cdnUrl);
    console.log('- 本地环境可选: 更新 application-local.yml 中的 default-avatar-url');

    return cdnUrl;

  } catch (error) {
    console.error('❌ 上传失败:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);