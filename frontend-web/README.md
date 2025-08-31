# 前端 Web（Vite + React + Tailwind v4）

本项目是「闲鱼风格」二手平台的 Web 前端，基于 **Vite + React 19 + React Router v7 + React Query v5 + Zustand**。样式用 **Tailwind v4（Vite 插件式接入）**。

> ✅ 开发模式自带 **HMR 热更新**：保存文件后浏览器会瞬时刷新组件，无需手动刷新或重启。

---

## 1. 环境要求

- Node.js ≥ **18.x**
- npm ≥ **9.x**
- 推荐使用 **PowerShell / CMD** 运行命令（Windows 的 Git Bash 对 npx 有兼容问题，但本项目用不到 npx）。

检查版本：
```bash
node -v
npm -v
```

---

## 2. 安装依赖

```bash
# 在 frontend-web/ 目录下执行
npm install
```

如果以前安装失败或有奇怪报错，可用“重装三连”：
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 3. 环境变量（.env.local）

在项目根目录 **frontend-web/** 下新建 `.env.local`，根据你的后端部署填写：

### 方式 A：你有 API 网关（推荐）
```ini
# 网关（HTTP）
VITE_API_BASE_URL=http://localhost:8080

# 网关（WebSocket，用于 STOMP/SockJS）
VITE_CHAT_WS_BASE_URL=http://localhost:8080
```

前端会把所有业务接口都打到 `VITE_API_BASE_URL`（如果你的 `src/api/http.ts` 已按这一策略写）。  
WebSocket 会连接到 `${VITE_CHAT_WS_BASE_URL}/ws/chat`。

### 方式 B：你是多微服务直连（没有网关）
如果 `src/api/http.ts` 里为不同域建了不同的 axios 实例（如 `productApi/reviewApi/orderApi/chatApi`），请把每个服务都写上：

```ini
# 示例端口仅供参考，请换成你实际后端端口
VITE_AUTH_API_BASE_URL=http://localhost:12650
VITE_USER_API_BASE_URL=http://localhost:12651
VITE_PRODUCT_API_BASE_URL=http://localhost:12652
VITE_ORDER_API_BASE_URL=http://localhost:12653
VITE_REVIEW_API_BASE_URL=http://localhost:12654
VITE_CHAT_API_BASE_URL=http://localhost:12655

# WebSocket（STOMP）
VITE_CHAT_WS_BASE_URL=http://localhost:12655
```

> ⚠️ 如果你的 `http.ts` 里只用到了 `VITE_API_BASE_URL` 一项，那就按照**方式 A**来；  
> 如果用了多项 `*_API_BASE_URL`，就按**方式 B**逐项配置。  
> 不确定时，打开 `src/api/http.ts` 看一下环境变量名字，对应填上即可。

---

## 4. 启动（开发：热更新）

```bash
npm run dev
```

默认端口 **5173**，浏览器访问：<http://localhost:5173/>

如需修改端口：
```bash
npm run dev -- --port 5174
```
或在 `package.json` 的 `dev` 脚本里追加 `--port 5174`。

---

## 5. 构建与本地预览（生产）

```bash
# 生成生产包（dist/）
npm run build

# 本地预览 dist（仅用于检查构建结果）
npm run preview
```

> 部署到 Nginx 等静态服务器时，请把 `dist/` 上传。  
> 后端若与前端同域部署，请确保后端正确放行静态资源与前端路由（单页应用需开启 history 路由回退）。

---

## 6. 聊天（WebSocket）说明

- WebSocket 通过 **SockJS + STOMP** 连接：`${VITE_CHAT_WS_BASE_URL}/ws/chat`
- 连接时会在 `beforeConnect` 中把最新的 `Authorization: Bearer <token>` 注入到 `connectHeaders`（见 `src/ws/stomp.ts`）
- 页面订阅示例：  
  - `/topic/chat/conversations/{conversationId}`：新消息  
  - `/topic/chat/conversations/{conversationId}/read`：读回执

> 你需要在后端开启对应的 STOMP 端点与目的地，并配置 CORS。

---

## 7. 样式系统（Tailwind v4）

本项目使用 **Tailwind v4 + @tailwindcss/vite** 插件，无需 `tailwind.config.js`。

- `vite.config.ts` 中已启用插件：
  ```ts
  import tailwindcss from '@tailwindcss/vite';
  export default defineConfig({ plugins: [react(), tailwindcss()] })
  ```
- `src/index.css` 中引入：
  ```css
  @import "tailwindcss";
  ```

---

## 8. 常见问题（FAQ）

### 8.1 浏览器控制台 CORS 报错
- 确认 `.env.local` 的 `VITE_*_BASE_URL` 填写了**正确的协议/主机/端口**
- 后端允许对应来源（`Access-Control-Allow-Origin`）  
- 若开发期想用 Vite 代理（可选），可以在 `vite.config.ts` 中添加：
  ```ts
  server: {
    proxy: {
      '/api': 'http://localhost:8080', // 把以 /api 开头的请求代理到后端
    }
  }
  ```
  （注意与你的实际后端路径匹配；若使用 axios 的全量地址，这条可不需要）

### 8.2 Windows / Git Bash 下 `npx tailwindcss init -p` 报错
- 本项目采用 **Tailwind v4 插件**方式，不需要 `init`。  
- 如果你看到类似 “could not determine executable to run” 的报错，可以忽略；我们并不使用该命令。

### 8.3 React Query v5 注意事项
- `useQuery` 不再支持 `keepPreviousData`；请使用：  
  ```ts
  placeholderData: (prev) => prev
  ```
- `useMutation` 的加载态使用 `isPending`（不是 `isLoading`）

### 8.4 WebSocket 连不上
- 检查 `.env.local` 的 `VITE_CHAT_WS_BASE_URL` 是否正确；  
- 后端是否启动了 STOMP 端点 `/ws/chat`；  
- 鉴权（token）是否正确且未过期；  
- 浏览器控制台有报错的话，截图发我即可。

---

## 9. 开发约定小抄

- 全局状态：`src/store/*`（Zustand）
- 接口封装：`src/api/*`（Axios 实例在 `src/api/http.ts`）
- 页面：`src/pages/*`
- 组件：`src/components/*`；功能域内组件：`src/features/*`
- 聊天：`src/ws/stomp.ts`
- 环境变量：仅以 `VITE_` 开头的变量会被注入前端（`.env*`）

---

## 10. 启动顺序建议

1. **后端**：先启动网关或各微服务；确认 HTTP/WS 端口无冲突；DB/Redis（Docker）已启动；  
2. **前端**：配置好 `.env.local` → `npm run dev`；  
3. 访问 <http://localhost:5173/>，尝试登录、浏览商品、收藏、下单、聊天等流程。

---
