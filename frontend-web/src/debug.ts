// src/debug.ts
export const DEBUG = String(import.meta.env.VITE_DEBUG) === "1";

export function dlog(label: string, ...args: any[]) {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.groupCollapsed(`%c[${label}]`, "color:#2563eb;font-weight:bold");
    // eslint-disable-next-line no-console
    console.log(...args);
    // eslint-disable-next-line no-console
    console.groupEnd();
}

export function printEnvOnce() {
    if (!DEBUG) return;
    console.table({
        VITE_USER_API_BASE_URL: import.meta.env.VITE_USER_API_BASE_URL,
        VITE_PRODUCT_API_BASE_URL: import.meta.env.VITE_PRODUCT_API_BASE_URL,
        VITE_ORDER_API_BASE_URL: import.meta.env.VITE_ORDER_API_BASE_URL,
        VITE_REVIEW_API_BASE_URL: import.meta.env.VITE_REVIEW_API_BASE_URL,
        VITE_CHAT_API_BASE_URL: import.meta.env.VITE_CHAT_API_BASE_URL,
        VITE_CHAT_WS_BASE_URL: import.meta.env.VITE_CHAT_WS_BASE_URL,
    });
}

export function attachGlobalErrorLogs() {
    if (!DEBUG) return;
    window.addEventListener("error", (e) => {
        console.error("[GlobalError]", e.error || e.message, e);
    });
    window.addEventListener("unhandledrejection", (e) => {
        console.error("[UnhandledRejection]", e.reason);
    });
}
