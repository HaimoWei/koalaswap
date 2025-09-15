#!/usr/bin/env node
// One-off script: upload default avatar to File Service (S3 via presigned URL)
// Usage examples:
//   ACCESS_TOKEN=... node scripts/upload-default-avatar.js
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret node scripts/upload-default-avatar.js
// Optional envs:
//   FILE_BASE=http://localhost:12647
//   USER_BASE=http://localhost:12649
//   CATEGORY=assets
//   VERSION=v1
//   SRC=frontend-web/public/assets/avatars/default-avatar.svg

import fs from 'node:fs';
import path from 'node:path';

const FILE_BASE = process.env.FILE_BASE || 'http://localhost:12647';
const USER_BASE = process.env.USER_BASE || 'http://localhost:12649';
const CATEGORY = process.env.CATEGORY || 'assets';
const VERSION = process.env.VERSION || 'v1';
const SRC = process.env.SRC || 'frontend-web/public/assets/avatars/default-avatar.svg';

const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source file not found:', SRC);
    process.exit(1);
  }
  const fileBuf = fs.readFileSync(SRC);
  const stat = fs.statSync(SRC);
  const ext = path.extname(SRC).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml'
    : ext === '.png' ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp'
    : 'application/octet-stream';

  if (!ACCESS_TOKEN) {
    if (!EMAIL || !PASSWORD) {
      console.error('Provide ACCESS_TOKEN or ADMIN_EMAIL + ADMIN_PASSWORD');
      process.exit(2);
    }
    const loginRes = await fetch(`${USER_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    const loginJson = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok || !loginJson?.ok || !loginJson?.data?.accessToken) {
      console.error('Login failed:', loginJson?.message || loginRes.statusText);
      process.exit(3);
    }
    ACCESS_TOKEN = loginJson.data.accessToken;
  }

  const fileName = `default-avatar.${VERSION}${ext}`;
  const reqBody = {
    fileName,
    fileSize: stat.size,
    mimeType: mime,
    category: CATEGORY
  };

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
    console.error('Get upload URL failed:', urlJson?.message || urlRes.statusText);
    process.exit(4);
  }

  const { uploadUrl, cdnUrl, objectKey } = urlJson.data;
  console.log('[presign] objectKey=', objectKey);

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mime },
    body: fileBuf
  });
  if (!putRes.ok) {
    console.error('Upload failed:', putRes.status, putRes.statusText);
    process.exit(5);
  }

  console.log('OK uploaded. CDN URL:');
  console.log(cdnUrl);
  console.log('\nNext steps:');
  console.log('- Set APP_USER_DEFAULT_AVATAR_URL to this CDN URL in production');
  console.log('- Or write it into application-prod.yml as app.user.default-avatar-url');
}

main().catch((e) => {
  console.error(e);
  process.exit(10);
});

