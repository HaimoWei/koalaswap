import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/auth";
import { useUiStore } from "./store/ui";

import { TopNav } from "./components/TopNav";
import { Protected } from "./components/Protected";

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
import { MyReviewsPage } from "./pages/MyReviewsPage";
import { ReviewEditorPage } from "./pages/ReviewEditorPage";
import { OrderPayPage } from "./pages/OrderPayPage";
import SellerProfilePage from "./pages/SellerProfilePage";

import { AuthDialog } from "./features/auth/AuthDialog";
import { VerifyEmailPage } from "./features/auth/VerifyEmailPage";
import { ResendVerifyPage } from "./features/auth/ResendVerifyPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";

export default function App() {
    const token = useAuthStore((s) => s.token);
    const authOpen = useUiStore((s) => s.authOpen);
    const closeAuth = useUiStore((s) => s.closeAuth);
    const loc = useLocation();

    // 进入独立认证页面时，强制关闭登录弹窗（解决“弹窗遮挡”体验问题）
    useEffect(() => {
        const dedicatedAuthRoutes = [
            "/auth/verify",
            "/verified",
            "/auth/resend",
            "/auth/forgot",
            "/auth/reset",
        ];
        if (dedicatedAuthRoutes.some((p) => loc.pathname.startsWith(p))) {
            closeAuth();
        }
    }, [loc.pathname, closeAuth]);

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

                <Route path="/product/:id" element={<ProductDetailPage />} />
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
                {/* 聊天 */}
                <Route path="/chat" element={
                    <Protected isAuthed={!!token}>
                        <ChatListPage />
                    </Protected>
                }/>
                <Route path="/chat/:id" element={
                    <Protected isAuthed={!!token}>
                        <ChatDetailPage />
                    </Protected>
                }/>

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
                    element={
                        <Protected isAuthed={!!token}>
                            <MyReviewsPage />
                        </Protected>
                    }
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

            <AuthDialog open={authOpen} onClose={closeAuth} />
        </div>
    );
}
