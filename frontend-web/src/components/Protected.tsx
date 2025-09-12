import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

// 受保护路由：未登录重定向回首页并提示
export function Protected({
                              isAuthed,
                              children,
                          }: {
    isAuthed: boolean;
    children: ReactNode;
}) {
    const loc = useLocation();
    if (!isAuthed) {
        // 未登录统一跳转到登录页，并携带 next 做回跳
        const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
        return <Navigate to={`/login?next=${next}`} replace />;
    }
    return <>{children}</>;
}
