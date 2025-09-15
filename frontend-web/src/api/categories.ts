// src/api/categories.ts
import { productApi } from "./http";
import type { ApiResponse } from "./types";
import { DEBUG, dlog } from "../debug";

/** 分类响应对象 */
export interface CategoryRes {
    id: number;
    name: string;
    parentId: number | null;
    children: CategoryRes[];
}

type MaybeWrapped<T> = ApiResponse<T> | T;

function unwrap<T>(payload: MaybeWrapped<T>): T {
    if (payload && typeof payload === "object" && "ok" in (payload as any)) {
        const p = payload as ApiResponse<T>;
        if (!p.ok) {
            if (DEBUG) dlog("API unwrap failed", p);
            throw new Error(p.message || "Request failed");
        }
        return p.data as T;
    }
    return payload as T;
}

/**
 * 获取所有分类（平铺列表）
 * 用于下拉选择框等
 */
export async function fetchAllCategories(): Promise<CategoryRes[]> {
    const { data } = await productApi.get<MaybeWrapped<CategoryRes[]>>("/api/categories");
    return unwrap<CategoryRes[]>(data);
}

/**
 * 获取分类树结构
 * 用于导航菜单等
 */
export async function fetchCategoryTree(): Promise<CategoryRes[]> {
    const { data } = await productApi.get<MaybeWrapped<CategoryRes[]>>("/api/categories?format=tree");
    return unwrap<CategoryRes[]>(data);
}

/**
 * 获取顶级分类
 * 用于首页分类导航
 */
export async function fetchTopCategories(): Promise<CategoryRes[]> {
    const { data } = await productApi.get<MaybeWrapped<CategoryRes[]>>("/api/categories/top");
    return unwrap<CategoryRes[]>(data);
}

/**
 * 获取指定分类的子分类
 * 用于级联选择器
 */
export async function fetchChildCategories(parentId: number): Promise<CategoryRes[]> {
    const { data } = await productApi.get<MaybeWrapped<CategoryRes[]>>(`/api/categories/${parentId}/children`);
    return unwrap<CategoryRes[]>(data);
}

/**
 * 获取分类详情
 */
export async function fetchCategory(id: number): Promise<CategoryRes> {
    const { data } = await productApi.get<MaybeWrapped<CategoryRes>>(`/api/categories/${id}`);
    return unwrap<CategoryRes>(data);
}