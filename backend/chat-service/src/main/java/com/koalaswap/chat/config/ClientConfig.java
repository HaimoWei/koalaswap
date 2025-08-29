// src/main/java/com/koalaswap/chat/config/ClientConfig.java
package com.koalaswap.chat.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@EnableConfigurationProperties(ExternalServicesProperties.class)
@Configuration
public class ClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        var f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(3000);
        f.setReadTimeout(3000);
        return new RestTemplate(f);
    }
}
