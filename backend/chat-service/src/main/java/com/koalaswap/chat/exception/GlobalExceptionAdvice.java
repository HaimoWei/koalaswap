// src/main/java/com/koalaswap/chat/exception/GlobalExceptionAdvice.java
package com.koalaswap.chat.exception;

import com.koalaswap.common.dto.ApiResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionAdvice {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> notFound(EntityNotFoundException e) {
        return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> illegalArg(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Object>> illegalState(IllegalStateException e) {
        String msg = e.getMessage() == null ? "" : e.getMessage();
        if (msg.startsWith("UNAUTHORIZED")) {
            return ResponseEntity.status(401).body(ApiResponse.error("login required"));
        }
        if (msg.startsWith("FORBIDDEN")) {
            return ResponseEntity.status(403).body(ApiResponse.error("no permission"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(msg));
    }

    // @Valid body 校验失败 -> 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> invalidBody(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(ApiResponse.error(msg));
    }

    // 单参数/路径参数等校验失败 -> 400
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> invalidParam(ConstraintViolationException e) {
        String msg = e.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(ApiResponse.error(msg));
    }

    // 唯一键/外键等数据约束冲突 -> 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> conflict(DataIntegrityViolationException e) {
        return ResponseEntity.status(409).body(ApiResponse.error("data integrity violation"));
    }

    // 明确抛出的状态异常 -> 保持原状态码
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Object>> rse(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode().value())
                .body(ApiResponse.error(e.getReason()));
    }

    // 兜底 500（日志记录但不把堆栈暴露给前端）
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> others(Exception e) {
        log.error("Unhandled exception", e);
        return ResponseEntity.status(500).body(ApiResponse.error("The server encountered an error. Please try again later."));
    }
}
