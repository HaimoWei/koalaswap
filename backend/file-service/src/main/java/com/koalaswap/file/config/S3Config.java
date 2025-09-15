package com.koalaswap.file.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * AWS S3 客户端配置
 * 提供 S3 客户端和预签名器
 */
@Configuration
public class S3Config {

    private final FileProperties fileProperties;

    public S3Config(FileProperties fileProperties) {
        this.fileProperties = fileProperties;
    }

    /**
     * S3 客户端 Bean
     * 使用默认凭证提供者链：
     * 1. 环境变量 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
     * 2. 系统属性
     * 3. ~/.aws/credentials 文件
     * 4. IAM 角色（EC2/ECS/Lambda 环境）
     */
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(fileProperties.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    /**
     * S3 预签名器 Bean
     * 用于生成预签名URL
     */
    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(fileProperties.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}