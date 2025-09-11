// 统一后端返回结构（与你后端 ApiResponse<T> 对齐）
export type ApiResponse<T> = {
    ok: boolean;
    data: T | null;
    message?: string | null;
};

// Spring Data Page<T> 结构（常见字段）
export type Page<T> = {
    content: T[];
    number: number;           // 当前页（0-based）
    size: number;             // 页尺寸
    totalElements: number;
    totalPages: number;
};

// 鉴权/用户简要类型（与你后端 DTO 对齐，必要时可微调字段名）
export type MyProfileRes = {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    email?: string | null;
};

export type LoginRes = {
    accessToken: string;
    profile: MyProfileRes;
};

export type ProductRes = {
    id: string;
    sellerId: string;
    title: string;
    description?: string | null;
    price: number;
    currency?: string | null;       // e.g. "CNY" / "AUD"
    categoryId?: string | null;
    condition?: string | null;      // NEW|LIKE_NEW|GOOD|...
    status?: string | null;         // ACTIVE|RESERVED|SOLD|HIDDEN
    createdAt: string;
    updatedAt: string;
    images: string[];               // 封面取 images[0]
};