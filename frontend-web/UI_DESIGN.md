KoalaSwap Web 前端（frontend-web）UI 设计施工文档（方案 D：生活方式温暖风）

文档目的
- 本文作为“可施工”的 UI 规范，覆盖 frontend-web 现有所有页面与组件，细化到颜色、间距、半径、状态、交互与实现步骤。
- 目标是让另一位工程师（或 GPT）无需额外背景即可按本文独立完成 UI 落地改造。

一、代码范围与结构映射
- App 外壳：`src/App.tsx`、`src/main.tsx`、`src/index.css`、`src/App.css`
- 全局导航/壳：
  - 顶栏：`src/components/TopNav.tsx`
  - 聊天顶栏：`src/components/ChatTopNav.tsx`（仅 `/chat`）
  - 受保护路由：`src/components/Protected.tsx`
  - 悬浮操作：`src/components/FabDock.tsx`
- 通用组件：
  - 商品卡：`src/components/ProductCard.tsx`
  - 分页：`src/components/Paginator.tsx`
  - 订单状态标签：`src/components/OrderStatusTag.tsx`
  - 订单时间线：`src/components/OrderTimeline.tsx`
- 页面与功能：
  - 认证：`src/pages/LoginPage.tsx`、`src/pages/RegisterPage.tsx`、`src/features/auth/*`（验证/重发/忘记/重置）
  - 商品：`src/pages/HomePage.tsx`、`src/pages/SearchPage.tsx`、`src/pages/ProductDetailPage.tsx`、`src/pages/ProductPublishPage.tsx`、`src/pages/MyProductsPage.tsx`、`src/features/products/*`
  - 收藏：`src/pages/MyFavoritesPage.tsx`
  - 订单：`src/pages/OrdersListPage.tsx`、`src/pages/OrderDetailPage.tsx`、`src/pages/OrderCreatePage.tsx`、`src/pages/OrderPayPage.tsx`、`src/pages/PayResultPage.tsx`
  - 评价：`src/pages/ReviewsPendingPage.tsx`、`src/pages/ReviewEditorPage.tsx`、`src/features/reviews/*`
  - 聊天：`src/pages/ChatPage.tsx`、`src/features/chat/*`
  - 用户：`src/pages/MeHomePage.tsx`、`src/pages/SellerProfilePage.tsx`
  - API：`src/api/*`（非视觉层）
  - 状态：`src/store/*`（非视觉层）

二、设计理念（方案 D：生活方式温暖风）
- 关键词：温暖、友好、可信、社区氛围。
- 形态：大圆角、柔阴影、暖中性色、卡片化布局、轻微动效。
- 导航：顶栏简洁；登录/注册等认证页隐藏全站顶栏，仅保留页面内抬头（已实现）。
- 可访问性：可见焦点、高对比阅读、键盘可达；动效轻量且可尊重“减少动效”。

三、主题与设计令牌（D1 推荐配色）
1) 调色板（D1 Terracotta + Sage）
- 主色（CTA）：`#D97757`（Terracotta）
- 辅色：`#84A98C`（Sage）
- 点缀：`#F59E0B`（Honey）；背景奶油：`#FFF7ED`
- 中性色（暖灰）：文字强 `#292524`、正文 `#44403C`、边框 `#E7E5E4`、底色 `#FAFAF9`、卡片 `#FFFFFF`、过渡 `#F5F5F4`
- 状态：成功 `#22C55E`/`#ECFDF5`，警告 `#D97706`/`#FFFBEB`，错误 `#DC2626`/`#FEF2F2`，信息 `#2563EB`/`#EFF6FF`

2) 令牌（CSS 变量，添加到 `src/index.css :root`）
- 颜色变量：`--color-primary`、`--color-secondary`、`--color-bg`、`--color-surface`、`--color-muted`、`--color-border`、`--color-text`、`--color-text-strong`、各状态色、`--ring`
- 圆角：`--radius-md: 10px`、`--radius-lg: 12px`（按钮/输入）、`--radius-xl: 16px`（卡片/画廊）
- 阴影：`--shadow-1: 0 1px 2px rgba(0,0,0,.04), 0 4px 8px rgba(0,0,0,.06)`；`--shadow-2: 0 2px 8px rgba(0,0,0,.06), 0 8px 20px rgba(0,0,0,.08)`
- 间距：4、8、12、16、20、24、32（倍数使用）
- 字体与层级：H1 28/32，H2 20/24，正文 14–16，小字 12；标题建议 Nunito/Rubik/Poppins，正文 Inter/System UI。

3) Tailwind 映射（v4）
- 使用任意值语法：`bg-[var(--color-surface)]`、`text-[var(--color-text)]`、`shadow-[var(--shadow-1)]`、`rounded-[var(--radius-lg)]`。
- 也可在 Tailwind 配置扩展 token（可选，见根目录 `DESIGN.md` 示例）。

四、响应式与布局
- 断点：mobile < 640px、tablet 640–1024、desktop ≥ 1024。
- 栅格：商品网格移动 2 列，平板 3 列，桌面 4 列；容器 `max-w-6xl px-4`。
- 吸顶：顶栏 sticky；商品详情右侧 CTA 在桌面吸顶；过滤条可 sticky。

五、全局外壳规范
1) TopNav（`src/components/TopNav.tsx`）
- 认证页（`/login`、`/register`、`/auth/*`、`/verified`）隐藏 TopNav（已实现）。
- 结构：左（Logo）- 中（胶囊搜索）- 右（未登录：登录/注册；已登录：头像+菜单）。
- 样式：高度 64–72；背景白；底部分隔线；文字暖灰；搜索为 `rounded-[var(--radius-lg)] border border-[var(--color-border)] focus:ring-[var(--ring)]`。
- 登录按钮：主色按钮；注册按钮：深色填充或次要风格，均圆角 lg、轻阴影。

2) ChatTopNav（`src/components/ChatTopNav.tsx`）
- 仅 `/chat` 渲染；背景白；右侧用户菜单下拉 hover 高亮；未登录显示“去登录”按钮跳 `/login?next=/chat`。

3) FabDock（`src/components/FabDock.tsx`）
- 认证页与聊天页隐藏；白底圆形 48px，边框+阴影；按钮文案“发/信/客”。

六、通用组件规范
1) 按钮（所有页面通用）
- 变体：primary、secondary、ghost、danger；尺寸 sm(28)、md(36)、lg(44)；圆角 lg。
- 交互：hover 亮 5–8%，active 暗 5–8%，disabled 降不透明；loading 显示旋转图标或“…”。
- 语义：danger 用错误色；重要操作使用 primary；次级操作使用 secondary/ghost。

2) 输入（text/number/textarea/select）
- 结构：label（小字灰）+ 控件 + 错误/帮助文本（12px）。
- 样式：`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 focus:ring-2 focus:ring-[var(--ring)] shadow-[var(--shadow-1)]`。
- 错误：边框和帮助文案用错误色；必填显示红色星号（可选）。

3) 卡片（Cards）
- 白底、边框、圆角 xl、软阴影；hover 提升阴影并图像轻微缩放 1.02。

4) 标签/Chips
- 胶囊；浅底（如 `bg-[var(--color-secondary-50)]`）+ 深字（`text-[var(--color-secondary-700)]`）；用于条件/状态等。

5) 分页（`src/components/Paginator.tsx`）
- 圆角按钮，当前页高亮；hover 背景浅色；移动端留足点击面积。

6) 订单状态标签（`src/components/OrderStatusTag.tsx`）
- 状态→颜色映射：
  - 成功类（完成）：success；进行中：info/warning；失败/取消：error。
- 形式：浅底+深字的胶囊。

7) 订单时间线（`src/components/OrderTimeline.tsx`）
- 垂直时间线，节点为圆点（完成态为实心），线段暖灰；附状态文字和时间。

8) 商品卡（`src/components/ProductCard.tsx`）
- 图片占 65–70%，1:1；下方显示标题（2 行截断）、价格（突出）、成色 chip、收藏按钮。

9) Toast/Inline 提示（建议新增轻量 util）
- 成功/错误/信息提示条：`bg-[var(--success-bg)] text-[var(--color-text)] border-l-4 border-[var(--success)] rounded-lg p-3`（按状态替换颜色）。

七、页面级规范与落地点位
1) 登录页（`src/pages/LoginPage.tsx`）
- 无 TopNav；自带页头（左 Logo，右“继续浏览”）。
- 两栏：左（欢迎文案+要点/插图），右（表单卡）。
- 表单：邮箱/密码（显示/隐藏）、记住我、忘记密码/重发验证链接、next 提示（解析产品标题）。
- 样式：表单卡 `rounded-xl border shadow-[var(--shadow-1)] bg-[var(--color-surface)] p-6`。

2) 注册页（`src/pages/RegisterPage.tsx`）
- 结构同登录；字段：昵称/邮箱/密码；成功提示就地展示；底部“已有账号？去登录”。

3) 首页（`src/pages/HomePage.tsx`）
- 顶部可选英雄区（暖色背景条或摄影+价值主张+搜索胶囊按钮）。
- 产品网格：2/3/4 列；卡片 hover 提升；加载时 skeleton。

4) 搜索页（`src/pages/SearchPage.tsx`）
- 顶部 FiltersBar（`src/features/products/FiltersBar.tsx`）：价格/分类/排序 chips，当前激活高亮；重置为 ghost 按钮。
- 空态：插画+引导文案+返回首页 CTA。

5) 商品详情（`src/pages/ProductDetailPage.tsx`）
- 左：大图画廊（圆角 xl，缩略图 5 列，选中有 ring）；右：标题、价格（大）、成色/状态 chips、CTA 操作区。
- CTA：买家态 [聊一聊(primary)] [立即购买(secondary)] [收藏]；卖家态 [下架/重新上架] [删除(danger)]。
- 卖家卡：头像、昵称、评分（可后续）、点击进卖家主页。
- 描述卡与推荐（可选）。

6) 发布页（`src/pages/ProductPublishPage.tsx`）
- 卡片化分段：基础信息 / 图片（URL） / 价格与属性；各段落标题+辅助说明。
- 图片列表：每行一个输入；“添加一张”/“删除”按钮用 ghost；校验就地提示。
- 提交按钮：primary 宽按钮，busy/disabled 状态；错误信息下方提示。

7) 我的发布（`src/pages/MyProductsPage.tsx`）
- 顶部 segmented tabs（在售/隐藏）；列表为卡片或行卡（含标题、价格、状态、编辑操作）。

8) 收藏（`src/pages/MyFavoritesPage.tsx`）
- 同首页网格；空态插画与引导。

9) 订单（`src/pages/OrdersListPage.tsx`、`src/pages/OrderDetailPage.tsx`、`src/pages/OrderCreatePage.tsx`、`src/pages/OrderPayPage.tsx`、`src/pages/PayResultPage.tsx`）
- 列表：顶部过滤（买家/卖家+状态 chips），每行展示概要与状态标签。
- 详情：标题区（订单号+状态 tag），时间线完整，按状态展示操作按钮（去支付/取消/确认收货/评价）。
- 支付页/结果页：强调状态（成功/失败）与下一步操作。
- 创建页：地址占位卡 + 订单概要卡 + 确认按钮。

10) 评价（`src/pages/ReviewsPendingPage.tsx`、`src/pages/ReviewEditorPage.tsx`）
- 待评价：tabs（买家/卖家/已评），列表卡片附 CTA。
- 评价编辑：评分星（`features/reviews/RatingStars`）、文本域、提交成功 toast。

11) 聊天（`src/pages/ChatPage.tsx`、`src/features/chat/*`）
- 桌面：两列；左侧会话列表（头像、昵称、最后消息、未读徽标、订单状态 chip），右侧详情（顶部可固定商品卡），消息气泡圆角 16；输入区为胶囊输入。
- 移动：单列切换；顶部返回；切换会话时刷新未读（已有）。

12) 用户页（`src/pages/MeHomePage.tsx`、`src/pages/SellerProfilePage.tsx`）
- 我的：顶部头像卡（可放昵称/基本信息），下方分区入口卡（发布/收藏/订单/评价）。
- 卖家主页：顶部 banner/渐变背景（无素材则纯色），卖家简介，活跃商品网格，评价概览。

八、通用状态规范
- 加载：使用 skeleton（灰色占位块，圆角一致）；列表/卡片/详情均配置。
- 空态：温暖插画 + 简短说明 + CTA（返回首页/去发布）。
- 错误：就地错误条（status 色 + 图标）；避免弹窗，危险操作除外。
- 确认：危险操作使用浏览器 confirm（现状保留），后续可替换为自定义暖风格弹窗。

九、动效规范
- 过渡：200–250ms，缓动 `cubic-bezier(0.2, 0.8, 0.2, 1)`；hover/focus/press 均适用。
- 降低动效：尊重 `prefers-reduced-motion`。

十、可访问性规范
- 焦点：所有可交互元素可见 focus ring（使用 `--ring`）。
- 对比：文本/背景对比 ≥ 4.5:1；禁用浅灰文字配浅灰背景。
- 键盘：Tab 顺序正确；Enter 提交表单；Esc 关闭弹层（如未来增加）。

十一、图标与插画
- 图标：推荐 Heroicons（描边/实心混用）；大小 16/20/24 统一；与文字距离 6–8px。
- 插画/摄影：偏生活化、暖色调；保持风格一致（光线、颜色分级）。

十二、实现步骤（强建议按序执行）
1) 主题令牌
   - 在 `src/index.css :root` 定义全部 CSS 变量（颜色/圆角/阴影/焦点 ring）。
   - 将 `body` 背景改为 `var(--color-bg)`，正文文字为 `var(--color-text)`。
2) 基础样式工具
   - 在文档中约定好常用类组合（按钮/输入/卡片/芯片）；可抽象为组件或直接在各处使用 Tailwind 工具类。
3) 外壳改造
   - `TopNav`：搜索胶囊、按钮风格、粘性顶部、分类条（如有）统一风格。
   - `ChatTopNav`：下拉菜单项 hover 与边框/阴影统一。
   - `FabDock`：圆形白底按钮+轻阴影+悬停提升。
4) 页面逐步替换
   - 认证页 → 首页/搜索 → 商品详情 → 发布 → 订单 → 聊天 → 我的/卖家。
   - 同步加上空态/骨架/错误样式。
5) QA 回归
   - 响应式（2/3/4 列）、键盘可达、对比检查、长文案截断、极端数据（无图/多图/长标题）。

十三、类名建议（Tailwind + 变量）
- Primary 按钮：
  - `bg-[var(--color-primary)] text-white rounded-[var(--radius-lg)] shadow-[var(--shadow-1)] hover:brightness-105 active:brightness-95 disabled:opacity-60`
- Secondary 按钮：
  - `bg-[var(--color-secondary-50)] border border-[var(--color-secondary-300)] text-[var(--color-secondary-700)] rounded-[var(--radius-lg)] hover:bg-[var(--color-secondary-100)]`
- Ghost 按钮：
  - `text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] rounded-[var(--radius-lg)]`
- 输入：
  - `rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] shadow-[var(--shadow-1)]`
- 卡片：
  - `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-1)]`
- 芯片：
  - `px-2 py-1 rounded-full text-xs bg-[var(--color-secondary-50)] text-[var(--color-secondary-700)]`

十四、与现有代码的对齐点（务必遵守）
- 认证页隐藏 TopNav；`/chat` 使用 `ChatTopNav`（当前 `App.tsx` 已实现 isAuthPage 逻辑）。
- 未登录访问受保护页统一重定向 `/login?next=...`；登录成功优先回跳（`LoginPage.tsx` 已支持）。
- 悬浮窗在认证页与聊天页隐藏（`App.tsx` 里的 `DEDICATED_AUTH_PREFIXES` 包含 `/login`、`/register` 等）。
- 收藏/下单/聊一聊等未登录操作统一跳登录页（已改造：`FavoriteButton`、`OrderCreatePage`、`ProductDetailPage`）。

十五、文件-需求映射速查
- `src/index.css`：加入 CSS 变量与 body 基础色；（不改 JS）
- `src/components/TopNav.tsx`：搜索胶囊、按钮风格、下拉（如需）
- `src/components/ChatTopNav.tsx`：右侧用户菜单样式
- `src/components/FabDock.tsx`：圆形按钮+阴影
- `src/components/ProductCard.tsx`：卡片、图片圆角与 hover、chips、价格样式
- `src/features/products/FiltersBar.tsx`：chips 风格、排序/价格输入的一致性
- `src/components/Paginator.tsx`：按钮圆角、hover、当前页高亮
- `src/components/OrderStatusTag.tsx`：状态色映射
- `src/components/OrderTimeline.tsx`：时间线节点/线条/文案
- `src/pages/LoginPage.tsx` / `RegisterPage.tsx`：两栏布局与表单卡片
- `src/pages/HomePage.tsx` / `SearchPage.tsx`：网格/空态/骨架
- `src/pages/ProductDetailPage.tsx`：画廊/CTA/卖家卡/描述卡
- `src/pages/ProductPublishPage.tsx`：分段卡片/输入/按钮
- `src/pages/MyProductsPage.tsx` / `MyFavoritesPage.tsx`：列表/网格/空态
- `src/pages/Orders*`：列表/详情/支付/结果页的标签与时间线/按钮
- `src/pages/Reviews*`：评分星/表单/提示
- `src/pages/ChatPage.tsx` + `src/features/chat/*`：两列布局/会话项/气泡/输入
- `src/pages/MeHomePage.tsx` / `SellerProfilePage.tsx`：头像卡/分区卡/网格

十六、后续可选项
- 深色模式：在 `.dark :root` 里覆盖颜色变量，组件跟随。
- 自定义弹窗与 Toast：替换原生 confirm 与 alert，统一暖风样式。
- 图标系统：引入统一图标集与封装组件（尺寸/颜色标准化）。

备注
- 推荐优先采用 D1 调色（Terracotta + Sage）。如需切换至 D2/D3，仅需替换 CSS 变量即可。
- 本文与根目录 `DESIGN.md` 保持一致方向；本文件粒度更细，用于具体施工。
