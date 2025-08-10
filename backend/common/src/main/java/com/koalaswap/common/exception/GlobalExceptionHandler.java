// backend/common/src/main/java/com/koalaswap/common/exception/GlobalExceptionHandler.java
package com.koalaswap.common.exception;

import com.koalaswap.common.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;


/**
 * 捕获控制器里抛出的常见异常，统一返回 ApiResponse，避免到处写 try/catch。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Bean 校验失败（@Valid）时
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleArgValid(MethodArgumentNotValidException ex){
        var first = ex.getBindingResult().getFieldErrors().stream()
                .findFirst().map(err -> err.getField()+": "+err.getDefaultMessage())
                .orElse("参数不合法");
        return ApiResponse.error(first);
    }

    // 单字段校验失败（例如手动调用 Validator）
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleConstraint(ConstraintViolationException ex){
        return ApiResponse.error(ex.getMessage());
    }

    // 唯一约束等数据库层冲突（如邮箱已存在）
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleUniqueConflict(DataIntegrityViolationException ex) {
        // 这里可根据 ex.getMostSpecificCause() 进一步判断是哪个唯一键冲突
        return ApiResponse.error("邮箱已存在或数据唯一性冲突");
    }

    // 兜底
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleOther(Exception ex){
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return ApiResponse.error(ex.getMessage()); // 前端可识别 EMAIL_NOT_VERIFIED
    }
}
