package com.koalaswap.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/** 统一 401/403 的 JSON 输出，便于各服务复用 */
@Component
@RequiredArgsConstructor
public class SecurityJsonHandlers {
    private final ObjectMapper objectMapper;

    public AuthenticationEntryPoint json401() {
        return (req, res, ex) -> write(res, HttpServletResponse.SC_UNAUTHORIZED, ApiResponse.error("未登录或凭证无效"));
    }

    public AccessDeniedHandler json403() {
        return (req, res, ex) -> write(res, HttpServletResponse.SC_FORBIDDEN, ApiResponse.error("无权限执行该操作"));
    }

    private void write(HttpServletResponse res, int status, Object body) throws java.io.IOException {
        res.setStatus(status);
        res.setCharacterEncoding(StandardCharsets.UTF_8.name());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
