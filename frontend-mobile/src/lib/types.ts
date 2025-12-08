// src/lib/types.ts
// 功能：放统一响应模型与分页类型，和你后端保持一致。

export type ApiResponse<T> = {
    ok: boolean;
    data: T | null;
    message: string | null;
};

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // 当前页（从0开始）
    size: number;   // 页大小
};

// 商品成色枚举（和后端/DB 枚举一致）
export type Condition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
