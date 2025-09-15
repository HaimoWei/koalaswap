// backend/common/src/main/java/com/koalaswap/common/dto/ApiResponse.java
package com.koalaswap.common.dto;

/**
 * 统一的 API 返回格式：
 * - ok:     本次调用是否成功
 * - data:   业务数据（成功时返回）
 * - message:错误提示（失败时返回）
 *
 * 使用方法：
 * return ApiResponse.ok(userDto);
 * return ApiResponse.error("邮箱已存在");
 */
public record ApiResponse<T>(boolean ok, T data, String message) {
    public static <T> ApiResponse<T> ok(T data){ return new ApiResponse<>(true, data, null); }
    public static <T> ApiResponse<T> error(String msg){ return new ApiResponse<>(false, null, msg); }
}
