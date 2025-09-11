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
        // 这里简单返回首页；你也可以在 App 里打开 AuthDialog
        return <Navigate to="/" state={{ from: loc }} replace />;
    }
    return <>{children}</>;
}
