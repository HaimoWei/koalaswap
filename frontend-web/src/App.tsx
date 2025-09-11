import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/auth";
import { useUiStore } from "./store/ui";

import { TopNav } from "./components/TopNav";
import { Protected } from "./components/Protected";
import FabDock from "./components/FabDock"; // ★ 悬浮窗

import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { OrdersListPage } from "./pages/OrdersListPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { OrderCreatePage } from "./pages/OrderCreatePage";
import { ChatListPage } from "./pages/ChatListPage";
import { ChatDetailPage } from "./pages/ChatDetailPage";
import { MyProductsPage } from "./pages/MyProductsPage";
import { MeHomePage } from "./pages/MeHomePage";
import { MyFavoritesPage } from "./pages/MyFavoritesPage";
import { ReviewsPendingPage } from "./pages/ReviewsPendingPage";
import { ReviewEditorPage } from "./pages/ReviewEditorPage";
import { OrderPayPage } from "./pages/OrderPayPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import PayResultPage from "./pages/PayResultPage";

import { AuthDialog } from "./features/auth/AuthDialog";
import { VerifyEmailPage } from "./features/auth/VerifyEmailPage";
import { ResendVerifyPage } from "./features/auth/ResendVerifyPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";
import ProductPublishPage from "./pages/ProductPublishPage.tsx";

// 需要隐藏悬浮窗的前缀
const DEDICATED_AUTH_PREFIXES = [
    "/auth/verify",
    "/verified",
    "/auth/resend",
    "/auth/forgot",
    "/auth/reset",
];

export default function App() {
    const token = useAuthStore((s) => s.token);
    const authOpen = useUiStore((s) => s.authOpen);
    const closeAuth = useUiStore((s) => s.closeAuth);
    const loc = useLocation();

    // 进入独立认证页面时，强制关闭登录弹窗（解决“弹窗遮挡”体验问题）
    useEffect(() => {
        if (DEDICATED_AUTH_PREFIXES.some((p) => loc.pathname.startsWith(p))) {
            closeAuth();
        }
    }, [loc.pathname, closeAuth]);

    // 这些页面或状态下隐藏悬浮窗
    const hideFab =
        authOpen || DEDICATED_AUTH_PREFIXES.some((p) => loc.pathname.startsWith(p));

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <TopNav />

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />

                {/* 邮箱验证 */}
                <Route path="/auth/verify" element={<VerifyEmailPage />} />
                <Route path="/verified" element={<VerifyEmailPage />} />

                {/* 邮件重发/忘记/重置密码 */}
                <Route path="/auth/resend" element={<ResendVerifyPage />} />
                <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
                <Route path="/auth/reset" element={<ResetPasswordPage />} />
                {/* 兼容老链接 /reset?token=...（可选） */}
                <Route path="/reset" element={<ResetPasswordPage />} />

                {/* 发布页（主入口 /publish），并兼容 REST 风格别名 */}
                <Route path="/publish" element={<ProductPublishPage />} />
                <Route path="/products/new" element={<Navigate to="/publish" replace />} />
                <Route path="/product/new" element={<Navigate to="/publish" replace />} />

                {/* 商品详情：保留你现有的 /product/:id，并兼容 /products/:id */}
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                <Route path="/users/:id" element={<SellerProfilePage />} />

                <Route
                    path="/checkout/:id"
                    element={
                        <Protected isAuthed={!!token}>
                            <OrderCreatePage />
                        </Protected>
                    }
                />

                <Route
                    path="/orders"
                    element={
                        <Protected isAuthed={!!token}>
                            <OrdersListPage />
                        </Protected>
                    }
                />
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

                {/* 聊天 */}
                <Route
                    path="/chat"
                    element={
                        <Protected isAuthed={!!token}>
                            <ChatListPage />
                        </Protected>
                    }
                />
                <Route
                    path="/chat/:id"
                    element={
                        <Protected isAuthed={!!token}>
                            <ChatDetailPage />
                        </Protected>
                    }
                />

                {/* 我的 */}
                <Route
                    path="/me/listings"
                    element={
                        <Protected isAuthed={!!token}>
                            <MyProductsPage />
                        </Protected>
                    }
                />
                <Route
                    path="/me"
                    element={
                        <Protected isAuthed={!!token}>
                            <MeHomePage />
                        </Protected>
                    }
                />
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

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* ★ 全站悬浮窗（按需隐藏） */}
            {!hideFab && <FabDock />}

            <AuthDialog open={authOpen} onClose={closeAuth} />
        </div>
    );
}
