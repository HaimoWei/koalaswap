// src/main/java/com/koalaswap/chat/config/ExternalServicesProperties.java
package com.koalaswap.chat.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "koalaswap.services")
public class ExternalServicesProperties {
    private String userBaseUrl;
    private String productBaseUrl;
    private String orderBaseUrl;

    public String getUserBaseUrl() { return userBaseUrl; }
    public void setUserBaseUrl(String userBaseUrl) { this.userBaseUrl = userBaseUrl; }
    public String getProductBaseUrl() { return productBaseUrl; }
    public void setProductBaseUrl(String productBaseUrl) { this.productBaseUrl = productBaseUrl; }
    public String getOrderBaseUrl() { return orderBaseUrl; }
    public void setOrderBaseUrl(String orderBaseUrl) { this.orderBaseUrl = orderBaseUrl; }
}
