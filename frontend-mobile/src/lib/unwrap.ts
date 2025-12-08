// src/lib/unwrap.ts
// 功能：把 ApiResponse<T> 解包，失败时直接抛错，调用处更干净。

import type { ApiResponse } from "./types";

export function unwrap<T>(resp: ApiResponse<T>): T {
    if (!resp.ok) {
        throw new Error(resp.message || "Unknown error");
    }
    return resp.data as T;
}
