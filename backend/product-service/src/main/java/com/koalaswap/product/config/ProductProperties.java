// backend/product-service/src/main/java/com/koalaswap/product/config/ProductProperties.java
// 配置绑定｜app.product.*
package com.koalaswap.product.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.product")
@Getter @Setter
public class ProductProperties {
    /** 每个商品最多图片数（默认 10，可通过 yml 配置） */
    private int maxImages = 10;
}
