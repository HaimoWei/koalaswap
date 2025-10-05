// vite.config.ts
// 说明：Tailwind v4 官方推荐在 Vite 里用插件的方式启用，不需要再生成 tailwind.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),       // React + SWC
    tailwindcss(), // 启用 Tailwind v4
  ],
  server: {
    host: '127.0.0.1',  // 强制使用IPv4地址
    port: 5173,  // 改用Vite默认端口
    strictPort: false
  },
});