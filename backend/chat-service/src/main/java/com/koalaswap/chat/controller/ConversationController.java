package com.koalaswap.chat.controller;

import com.koalaswap.chat.client.ProductClient;          // [B3 CHANGE]
import com.koalaswap.chat.entity.Conversation;
import com.koalaswap.chat.model.MessageType;
import com.koalaswap.chat.security.CurrentUser;           // [B3 CHANGE]
import com.koalaswap.chat.service.ChatDomainService;
import com.koalaswap.chat.service.RateLimitService;       // [B3 CHANGE]
import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.chat.dto.*;
import com.koalaswap.chat.ws.WsPublisher;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ConversationController {

    private final ChatDomainService chat;
    private final ProductClient productClient;              // [B3 CHANGE]
    private final RateLimitService rateLimit;               // [B3 CHANGE]
    private final WsPublisher wsPublisher;

    // 没有配置时，使用这个默认占位图（可改成你自己的）
    @Value("${app.images.placeholder-product:https://static.example.com/img/placeholder-product.png}")
    private String placeholderProduct;                   // << 新增


    public ConversationController(ChatDomainService chat, ProductClient productClient, RateLimitService rl, WsPublisher wsPublisher) {
        this.chat = chat;
        this.productClient = productClient;
        this.rateLimit = rl;
        this.wsPublisher = wsPublisher;
    }

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> createOrGet(@Valid @RequestBody CreateConversationRequest req) {
        UUID current = CurrentUser.idRequired();

        UUID sellerId = req.sellerId();

        // 不能和自己建会话
        if (current.equals(sellerId)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("不能与自己建立会话"));
        }

        var briefOpt = productClient.getBrief(req.productId());
        if (briefOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("商品不存在或已下架"));
        }
        var brief = briefOpt.get();
        UUID realSeller = brief.sellerId();
        if (sellerId == null) sellerId = realSeller;
        else if (!sellerId.equals(realSeller))
            return ResponseEntity.badRequest().body(ApiResponse.error("卖家与商品不匹配"));

        // << 关键：首图兜底（为空/空白则用占位图）
        String cover = Optional.ofNullable(brief.firstImageUrl())
                .filter(s -> !s.isBlank())
                .orElse(placeholderProduct);

        Conversation c = chat.getOrCreateConversation(
                req.productId(), req.orderId(), current, sellerId, current, cover // << 新签名
        );

        ConversationResponse resp = new ConversationResponse(
                c.getId(), c.getProductId(), c.getOrderId(), c.getBuyerId(), c.getSellerId(),
                c.getOrderStatusCache(), c.getProductFirstImage(), c.getLastMessageAt(), c.getLastMessagePreview()
        );
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }



    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> pageMessages(@PathVariable("id") UUID conversationId,
                                                                           @RequestParam(defaultValue = "0") int page,
                                                                           @RequestParam(defaultValue = "20") int size) {
        CurrentUser.idRequired(); // 只为确保登录，具体参与者拦截器已校验
        var data = chat.pageMessages(conversationId, PageRequest.of(page, size));
        var resp = data.map(m -> new MessageResponse(
                m.getId(), m.getType(), m.getSenderId(), m.getBody(), m.getImageUrl(), m.getSystemEvent(), m.getMeta(), m.getCreatedAt()
        ));
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    /** [B3 CHANGE] 发送限流：同会话同用户 2 秒一条，否则 429 */
    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> send(@PathVariable("id") UUID conversationId,
                                                             @Valid @RequestBody SendMessageRequest req) {
        UUID current = CurrentUser.idRequired();
        String key = conversationId + ":" + current;
        if (!rateLimit.allowSend(key)) {
            return ResponseEntity.status(429).body(ApiResponse.error("发送过于频繁，请稍后再试"));
        }

        if (req.type() == MessageType.TEXT && (req.body() == null || req.body().isBlank())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("文本消息内容不能为空"));
        }
        if (req.type() == MessageType.IMAGE && (req.imageUrl() == null || req.imageUrl().isBlank())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("图片消息地址不能为空"));
        }

        var m = chat.sendMessage(conversationId, current, req.type(), req.body(), req.imageUrl());

        // [C ADD] 推送到订阅方
        var body = new MessageResponse(
                m.getId(), m.getType(), m.getSenderId(), m.getBody(), m.getImageUrl(), m.getSystemEvent(), m.getMeta(), m.getCreatedAt()
        );
        wsPublisher.publishNewMessage(conversationId, body);

        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    @PostMapping("/conversations/{id}/read")
    public ResponseEntity<ApiResponse<Boolean>> markRead(@PathVariable("id") UUID conversationId,
                                                         @RequestParam(required = false) UUID lastMessageId) {
        UUID current = CurrentUser.idRequired();
        chat.markRead(conversationId, current, lastMessageId);
        return ResponseEntity.ok(ApiResponse.ok(Boolean.TRUE));
    }
}

