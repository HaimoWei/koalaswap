import { Route, Routes, Navigate, useLocation, useParams } from "react-router-dom";
import { useAuthStore } from "./store/auth";

import { TopNav } from "./components/TopNav";
import { ChatTopNav } from "./components/ChatTopNav";
import { Protected } from "./components/Protected";
import FabDock from "./components/FabDock"; // ★ 悬浮窗

import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { OrdersListPage } from "./pages/OrdersListPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { OrderCreatePage } from "./pages/OrderCreatePage";
import { ChatPage } from "./pages/ChatPage";
import { MyProductsPage } from "./pages/MyProductsPage";
import { MeHomePage } from "./pages/MeHomePage";
import MeCenterLayout from "./pages/MeCenterLayout";
import ProfilePage from "./pages/ProfilePage";
import SecurityPage from "./pages/SecurityPage";
import MyProfileCenterPage from "./pages/MyProfileCenterPage";
import AddressPage from "./pages/AddressPage";
import { MyFavoritesPage } from "./pages/MyFavoritesPage";
import { ReviewsPendingPage } from "./pages/ReviewsPendingPage";
import { ReviewEditorPage } from "./pages/ReviewEditorPage";
import { ReviewSuccessPage } from "./pages/ReviewSuccessPage";
import { OrderPayPage } from "./pages/OrderPayPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import PayResultPage from "./pages/PayResultPage";
import InfoPage from "./pages/InfoPage";

import { VerifyEmailPage } from "./features/auth/VerifyEmailPage";
import { ResendVerifyPage } from "./features/auth/ResendVerifyPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";
import ProductPublishPage from "./pages/ProductPublishPage.tsx";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { ToastContainer } from "./components/ui/ToastContainer";
import { ConfirmModal } from "./components/ui/ConfirmModal";
import { Footer } from "./components/Footer";

// 需要隐藏悬浮窗的前缀
const DEDICATED_AUTH_PREFIXES = [
    "/auth/verify",
    "/verified",
    "/auth/resend",
    "/auth/forgot",
    "/auth/reset",
    "/login",
    "/register",
];

// 聊天重定向组件
function ChatRedirect() {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/chat?conversation=${id}`} replace />;
}

export default function App() {
    const token = useAuthStore((s) => s.token);
    const loc = useLocation();

    // 进入独立认证页面时，无需处理弹窗（已改为专用登录页）

    // 页面层级分类 - 按照大厂标准统一
    const isAuthPage = DEDICATED_AUTH_PREFIXES.some((p) => loc.pathname.startsWith(p));

    // 一级页面：完整导航（搜索+发布+消息）
    const isHomePage = loc.pathname === '/' || loc.pathname === '/search';

    // 二级页面：功能导航（标题+返回+消息）
    const isFunctionPage = loc.pathname.startsWith('/me/center') ||
                          loc.pathname.startsWith('/publish') ||
                          loc.pathname.startsWith('/chat');

    // 三级页面：极简导航（标题+返回）
    const isDetailPage = loc.pathname.match(/^\/(product|products|orders|users)\/[^\/]+$/) ||
                         loc.pathname.startsWith('/pay/') ||
                         loc.pathname.startsWith('/checkout/') ||
                         loc.pathname.startsWith('/reviews/');
    
    // 这些页面或状态下隐藏悬浮窗
    const hideFab = isAuthPage || isFunctionPage || isDetailPage;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {!isAuthPage && (
                <TopNav
                    showSearch={isHomePage}
                    showPublish={false}
                    showMessages={false}
                />
            )}

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                {/* 信息页（关于/帮助/政策等，前端静态占位） */}
                <Route path="/info/:slug" element={<InfoPage />} />

                {/* 邮箱验证 */}
                <Route path="/auth/verify" element={<VerifyEmailPage />} />
                <Route path="/verified" element={<VerifyEmailPage />} />

                {/* 邮件重发/忘记/重置密码 */}
                <Route path="/auth/resend" element={<ResendVerifyPage />} />
                <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
                <Route path="/auth/reset" element={<ResetPasswordPage />} />
                {/* 兼容老链接 /reset?token=...（可选） */}
                <Route path="/reset" element={<ResetPasswordPage />} />

                {/* 登录页（专用页，便于统一重定向） */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* 发布页（主入口 /publish），并兼容 REST 风格别名；未登录跳转登录 */}
                <Route
                    path="/publish"
                    element={
                        <Protected isAuthed={!!token}>
                            <ProductPublishPage />
                        </Protected>
                    }
                />
                <Route path="/products/new" element={<Navigate to="/publish" replace />} />
                <Route path="/product/new" element={<Navigate to="/publish" replace />} />

                {/* 商品详情：保留你现有的 /product/:id，并兼容 /products/:id */}
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                {/* 商品编辑页 */}
                <Route
                    path="/products/:id/edit"
                    element={
                        <Protected isAuthed={!!token}>
                            <ProductPublishPage />
                        </Protected>
                    }
                />

                <Route path="/users/:id" element={<SellerProfilePage />} />

                <Route
                    path="/checkout/:id"
                    element={
                        <Protected isAuthed={!!token}>
                            <OrderCreatePage />
                        </Protected>
                    }
                />

                {/* 订单列表重定向至个人中心 */}
                <Route path="/orders" element={<Navigate to="/me/center/orders" replace />} />
                <Route
                    path="/orders/:id"
                    element={
                        <Protected isAuthed={!!token}>
                            <OrderDetailPage />
                        </Protected>
                    }
                />

                <Route
                    path="/pay/:id"
                    element={
                        <Protected isAuthed={!!token}>
                            <OrderPayPage />
                        </Protected>
                    }
                />
                <Route path="/pay/result" element={<PayResultPage />} />

                {/* 聊天 - 统一页面 */}
                <Route
                    path="/chat"
                    element={
                        <Protected isAuthed={!!token}>
                            <ChatPage />
                        </Protected>
                    }
                />
                {/* 兼容旧的聊天详情路由，重定向到统一页面；未登录仍会被 /chat 的保护拦截 */}
                <Route path="/chat/:id" element={<ChatRedirect />} />

                {/* 我的 */}
                <Route
                    path="/me/listings"
                    element={
                        <Protected isAuthed={!!token}>
                            <MyProductsPage />
                        </Protected>
                    }
                />
                {/* 个人中心：左侧导航 + 右侧内容 */}
                <Route
                    path="/me"
                    element={<Navigate to="/me/center" replace />}
                />
                <Route
                    path="/me/center"
                    element={
                        <Protected isAuthed={!!token}>
                            <MeCenterLayout />
                        </Protected>
                    }
                >
                    <Route index element={<MyProfileCenterPage />} />
                    <Route path="listings" element={<MyProductsPage />} />
                    <Route path="favorites" element={<MyFavoritesPage />} />
                    <Route path="orders" element={<OrdersListPage />} />
                    <Route path="reviews" element={<ReviewsPendingPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="security" element={<SecurityPage />} />
                    <Route path="addresses" element={<AddressPage />} />
                </Route>
                <Route
                    path="/me/favorites"
                    element={
                        <Protected isAuthed={!!token}>
                            <MyFavoritesPage />
                        </Protected>
                    }
                />
                <Route
                    path="/me/reviews/pending"
                    element={
                        <Protected isAuthed={!!token}>
                            <ReviewsPendingPage />
                        </Protected>
                    }
                />
                <Route
                    path="/me/reviews"
                    element={<Navigate to="/me/reviews/pending?tab=commented" replace />}
                />
                <Route
                    path="/reviews/new/:orderId"
                    element={
                        <Protected isAuthed={!!token}>
                            <ReviewEditorPage />
                        </Protected>
                    }
                />
                <Route
                    path="/reviews/success"
                    element={
                        <Protected isAuthed={!!token}>
                            <ReviewSuccessPage />
                        </Protected>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* ★ 全站悬浮窗（按需隐藏） */}
            {!hideFab && <FabDock />}

            {/* 全局反馈与确认 */}
            <ToastContainer />
            <ConfirmModal />

            {/* 已改为专用登录页，不再渲染全局登录弹窗 */}
            {/* Footer：公共页面展示，功能页面和详情页面不展示 */}
            {isHomePage && <Footer />}
        </div>
    );
}
