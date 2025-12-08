// backend/common/src/main/java/com/koalaswap/common/dto/ApiResponse.java
package com.koalaswap.common.dto;

/**
 * Unified API response format:
 * - ok:     whether the call succeeded
 * - data:   business data (returned on success)
 * - message:error message (returned on failure)
 *
 * Usage examples:
 * return ApiResponse.ok(userDto);
 * return ApiResponse.error("Email already exists");
 */
public record ApiResponse<T>(boolean ok, T data, String message) {
    public static <T> ApiResponse<T> ok(T data){ return new ApiResponse<>(true, data, null); }
    public static <T> ApiResponse<T> error(String msg){ return new ApiResponse<>(false, null, msg); }
}
