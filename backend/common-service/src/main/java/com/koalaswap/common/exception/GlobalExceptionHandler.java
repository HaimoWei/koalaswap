package com.koalaswap.common.exception;

import com.koalaswap.common.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 400: Bean 校验（多字段，返回首条 + 可选字段列表）
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleArgValid(MethodArgumentNotValidException ex){
        var first = ex.getBindingResult().getFieldErrors().stream()
                .findFirst().map(err -> err.getField()+": "+err.getDefaultMessage())
                .orElse("Invalid request parameters.");
        return ApiResponse.error(first);
    }

    // 400: 单字段校验
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleConstraint(ConstraintViolationException ex){
        return ApiResponse.error(ex.getMessage());
    }

    // 400: 业务入参/状态不满足（比如账号或密码错误、用户不存在等）
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArg(IllegalArgumentException ex) {
        return ApiResponse.error(ex.getMessage());
    }

    // 400: JSON 解析失败/类型不匹配
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleNotReadable(HttpMessageNotReadableException ex){
        return ApiResponse.error("Request body format is invalid.");
    }

    // 401: 未认证（统一把“未登录/身份无效”映射为 401）
    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleIllegalState(IllegalStateException ex){
        return ApiResponse.error("Not authenticated or token is invalid.");
    }

    // 403: 已认证但权限不足（Controller/Service 主动抛 AccessDeniedException）
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleDenied(AccessDeniedException ex){
        return ApiResponse.error("You do not have permission to perform this action.");
    }

    // 409: 唯一约束/外键冲突
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleUniqueConflict(DataIntegrityViolationException ex) {
        return ApiResponse.error("Data uniqueness or constraint conflict.");
    }

    // 500: 兜底（避免把内部异常信息直接暴露给前端）
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleOther(Exception ex){
        log.error("Unhandled exception", ex);
        return ApiResponse.error("The server encountered an error. Please try again later.");
    }
}
