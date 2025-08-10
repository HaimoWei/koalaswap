package com.koalaswap.user.mail;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 邮件发送服务
 * 用于封装发送邮件的逻辑（比如发送邮箱验证、密码重置等）
 */
@Service // 让 Spring 把这个类注册为一个 Service Bean
@RequiredArgsConstructor // 自动生成包含 final 字段的构造函数（用于构造注入）
public class MailService {

    // Spring 会自动注入 JavaMailSender（由 spring-boot-starter-mail 提供）
    private final JavaMailSender sender;

    /**
     * 发件人邮箱地址
     * - 从 application.yml 或 .env 中读取 APP_MAIL_USERNAME
     * - 如果 app.mail.from 有值，就用它；否则用 APP_MAIL_USERNAME
     */
    @Value("${app.mail.from:${spring.mail.username}}")
    private String from;

    /**
     * 发送一封简单的纯文本邮件
     * @param to 收件人邮箱
     * @param subject 邮件主题
     * @param body 邮件正文
     */
    public void sendPlainText(String to, String subject, String body){
        var msg = new SimpleMailMessage(); // 创建一个简单邮件对象
        msg.setFrom(from);     // 设置发件人
        msg.setTo(to);         // 设置收件人
        msg.setSubject(subject); // 设置主题
        msg.setText(body);       // 设置正文
        sender.send(msg);        // 通过 JavaMailSender 发送邮件
    }
}
