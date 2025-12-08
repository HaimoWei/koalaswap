package com.koalaswap.product.client;

import com.koalaswap.product.dto.SimpleImageUploadRequest;
import com.koalaswap.product.dto.SimpleImageUploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * File Service 客户端
 * 调用 file-service 的图片上传接口
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FileServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.file-service.base-url:http://localhost:12647}")
    private String fileServiceBaseUrl;

    /**
     * 获取单个图片上传URL
     */
    public SimpleImageUploadResponse getImageUploadUrl(SimpleImageUploadRequest request, String jwtToken) {
        try {
            String url = fileServiceBaseUrl + "/api/files/upload-url";

            // 构造请求体（适配file-service的格式）
            Map<String, Object> requestBody = Map.of(
                "fileName", request.getFileName(),
                "fileSize", request.getFileSize(),
                "mimeType", request.getMimeType(),
                "category", "product"
            );

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (jwtToken != null) {
                headers.setBearerAuth(jwtToken.replace("Bearer ", ""));
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送请求
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Map<String, Object> data = (Map<String, Object>) responseBody.get("data");

                return new SimpleImageUploadResponse(
                    (String) data.get("uploadUrl"),
                    (String) data.get("objectKey"),
                    (String) data.get("cdnUrl"),
                    ((Number) data.get("expiresAt")).longValue()
                );
            } else {
                throw new RuntimeException("file-service responded with a non-success status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to call file-service to get upload URL: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get image upload URL: " + e.getMessage());
        }
    }

    /**
     * 批量获取图片上传URL
     */
    public List<SimpleImageUploadResponse> getBatchImageUploadUrls(
        List<SimpleImageUploadRequest> requests,
        String jwtToken
    ) {
        try {
            String url = fileServiceBaseUrl + "/api/files/batch-upload-urls";

            // 构造请求体
            List<Map<String, Object>> requestBody = requests.stream()
                .map(req -> Map.<String, Object>of(
                    "fileName", req.getFileName(),
                    "fileSize", req.getFileSize(),
                    "mimeType", req.getMimeType(),
                    "category", "product"
                ))
                .toList();

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (jwtToken != null) {
                headers.setBearerAuth(jwtToken.replace("Bearer ", ""));
            }

            HttpEntity<List<Map<String, Object>>> entity = new HttpEntity<>(requestBody, headers);

            // 发送请求
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> dataList = (List<Map<String, Object>>) responseBody.get("data");

                return dataList.stream()
                    .map(data -> new SimpleImageUploadResponse(
                        (String) data.get("uploadUrl"),
                        (String) data.get("objectKey"),
                        (String) data.get("cdnUrl"),
                        ((Number) data.get("expiresAt")).longValue()
                    ))
                    .toList();
            } else {
                throw new RuntimeException("file-service responded with a non-success status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to call file-service to get batch upload URLs: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get batch image upload URLs: " + e.getMessage());
        }
    }
}
