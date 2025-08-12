// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/ProductServiceApplication.java
// 服务入口｜扫描本服务与 common（异常处理 / ApiResponse / Jwt 过滤器等）
// ===============================
package com.koalaswap.product;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.koalaswap")
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
