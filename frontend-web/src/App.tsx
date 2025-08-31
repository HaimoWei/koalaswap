import { Route, Routes, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import { useUiStore } from "./store/ui";
import { AuthDialog } from "./features/auth/AuthDialog";
import { VerifyEmailPage } from "./features/auth/VerifyEmailPage";
import { Protected } from "./components/Protected";
import { HomePage } from "./pages/HomePage";
import { TopNav } from "./components/TopNav";
import { SearchPage } from "./pages/SearchPage";
import { MyProductsPage } from "./pages/MyProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage"; // 新增
import { OrderDetailPage } from "./pages/OrderDetailPage";     // 新增（占位）
import { ChatDetailPage } from "./pages/ChatDetailPage";       // 新增（占位）
import { OrdersListPage } from "./pages/OrdersListPage";     // 新增
import { ChatListPage } from "./pages/ChatListPage";
import { MeHomePage } from "./pages/MeHomePage";
import { MyFavoritesPage } from "./pages/MyFavoritesPage";
import { ReviewsPendingPage } from "./pages/ReviewsPendingPage";
import { MyReviewsPage } from "./pages/MyReviewsPage";
import { ReviewEditorPage } from "./pages/ReviewEditorPage";


export default function App() {
    const token = useAuthStore((s) => s.token);
    const authOpen = useUiStore((s) => s.authOpen);
    const closeAuth = useUiStore((s) => s.closeAuth);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <TopNav />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/auth/verify" element={<VerifyEmailPage />} />


                <Route path="/product/:id" element={<ProductDetailPage />} />
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
                <Route path="/chat/:id" element={<ChatDetailPage />} />

                <Route
                    path="/me/listings"
                    element={
                        <Protected isAuthed={!!token}>
                            <MyProductsPage />
                        </Protected>
                    }
                />
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
