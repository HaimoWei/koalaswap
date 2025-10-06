#!/usr/bin/env node
// Upload poster/banner images to S3 via File Service
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/upload-posters.js

import fs from 'node:fs';
import path from 'node:path';

const FILE_BASE = process.env.FILE_BASE || 'http://localhost:12647';
const USER_BASE = process.env.USER_BASE || 'http://localhost:12649';
const CATEGORY = 'assets';  // 使用assets目录存放网站公共资源

const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const POSTER_DIR = 'dataset/poster';
const POSTER_FILES = [
  '20251007073201_149_509.jpg',
  '20251007073208_154_509.jpg',
  '20251007073210_155_509.jpg'
];

async function uploadFile(filePath, targetName) {
  const fileBuf = fs.readFileSync(filePath);
  const stat = fs.statSync(filePath);
  const mime = 'image/jpeg';

  const reqBody = {
    fileName: targetName,
    fileSize: stat.size,
    mimeType: mime,
    category: CATEGORY
  };

  console.log(`📤 Uploading ${path.basename(filePath)} as ${targetName}...`);

  const urlRes = await fetch(`${FILE_BASE}/api/files/${CATEGORY}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify(reqBody)
  });

  const urlJson = await urlRes.json().catch(() => ({}));
  if (!urlRes.ok || !urlJson?.ok || !urlJson?.data?.uploadUrl) {
    throw new Error(`Get upload URL failed: ${urlJson?.message || urlRes.statusText}`);
  }

  const { uploadUrl, cdnUrl, objectKey } = urlJson.data;
  console.log(`   S3 Key: ${objectKey}`);

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mime },
    body: fileBuf
  });

  if (!putRes.ok) {
    throw new Error(`Upload failed: ${putRes.status} ${putRes.statusText}`);
  }

  console.log(`   ✅ CDN URL: ${cdnUrl}\n`);
  return cdnUrl;
}

async function main() {
  console.log('🚀 Starting poster upload to S3...\n');

  // Login if needed
  if (!ACCESS_TOKEN) {
    if (!EMAIL || !PASSWORD) {
      console.error('❌ Error: Provide ACCESS_TOKEN or ADMIN_EMAIL + ADMIN_PASSWORD');
      process.exit(2);
    }
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${USER_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    const loginJson = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok || !loginJson?.ok || !loginJson?.data?.accessToken) {
      console.error('❌ Login failed:', loginJson?.message || loginRes.statusText);
      process.exit(3);
    }
    ACCESS_TOKEN = loginJson.data.accessToken;
    console.log('✅ Logged in successfully\n');
  }

  // Upload all posters
  const cdnUrls = [];
  for (let i = 0; i < POSTER_FILES.length; i++) {
    const fileName = POSTER_FILES[i];
    const filePath = path.join(POSTER_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      continue;
    }

    const targetName = `banners/banner-${i + 1}.jpg`;
    try {
      const cdnUrl = await uploadFile(filePath, targetName);
      cdnUrls.push(cdnUrl);
    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Upload Complete!');
  console.log('='.repeat(60));
  console.log('\n📋 CDN URLs (copy these to PromoBanner.tsx):');
  console.log('\nconst SLIDES = [');
  cdnUrls.forEach((url) => {
    console.log(`  "${url}",`);
  });
  console.log('];\n');
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(10);
});
