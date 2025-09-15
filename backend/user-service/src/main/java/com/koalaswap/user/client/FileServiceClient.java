package com.koalaswap.user.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * File Service 客户端
 * 用于调用 file-service 的头像上传功能
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FileServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.file-service.base-url:http://localhost:12647}")
    private String fileServiceBaseUrl;

    /**
     * 获取头像上传URL
     *
     * @param fileName    文件名
     * @param fileSize    文件大小
     * @param mimeType    MIME类型
     * @param jwtToken    JWT令牌
     * @return 上传响应
     */
    public Map<String, Object> getAvatarUploadUrl(String fileName, long fileSize, String mimeType, String jwtToken) {
        try {
            String url = fileServiceBaseUrl + "/api/files/upload-url";

            // 构建请求体
            Map<String, Object> requestBody = Map.of(
                "fileName", fileName,
                "fileSize", fileSize,
                "mimeType", mimeType,
                "category", "avatar"
            );

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", "Bearer " + jwtToken);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // 发送请求
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, request, Map.class);

            log.info("成功获取头像上传URL: {}", fileName);
            return response.getBody();

        } catch (Exception e) {
            log.error("获取头像上传URL失败: {}", e.getMessage(), e);
            throw new RuntimeException("获取上传URL失败: " + e.getMessage());
        }
    }
}