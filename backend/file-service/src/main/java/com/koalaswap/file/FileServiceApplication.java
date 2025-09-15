package com.koalaswap.file;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * KoalaSwap 统一文件服务
 *
 * 功能：
 * - 统一文件上传（图片、文档、音视频）
 * - AWS S3 集成
 * - CDN 分发
 * - 多业务场景支持（头像、商品图、聊天图等）
 */
@SpringBootApplication(scanBasePackages = {
    "com.koalaswap.file",
    "com.koalaswap.common"  // 扫描 common 模块的组件
})
public class FileServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FileServiceApplication.class, args);
    }
}