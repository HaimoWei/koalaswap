// src/main/java/com/koalaswap/chat/ChatServiceApplication.java
package com.koalaswap.chat;

import com.koalaswap.chat.config.ExternalServicesProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(scanBasePackages = { "com.koalaswap" })
@EnableConfigurationProperties(ExternalServicesProperties.class)
public class ChatServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ChatServiceApplication.class, args);
    }
}
