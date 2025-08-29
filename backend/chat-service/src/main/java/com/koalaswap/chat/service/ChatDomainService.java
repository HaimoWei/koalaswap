// src/main/java/com/koalaswap/chat/service/ChatDomainService.java
package com.koalaswap.chat.service;

import com.koalaswap.chat.entity.*;
import com.koalaswap.chat.model.*;
import com.koalaswap.chat.repository.*;
import com.koalaswap.chat.events.OrderStatusEvent;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ChatDomainService {

    private final ConversationRepository convRepo;
    private final ConversationParticipantRepository partRepo;
    private final MessageRepository msgRepo;

    public ChatDomainService(ConversationRepository c, ConversationParticipantRepository p, MessageRepository m) {
        this.convRepo = c; this.partRepo = p; this.msgRepo = m;
    }

    @Transactional
    public Conversation getOrCreateConversation(
            UUID productId,
            UUID orderId,
            UUID buyerId,
            UUID sellerId,
            UUID startedBy,
            String productFirstImage // << 新增参数
    ) {

        // ★ 领域层防呆
        if (buyerId != null && buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("buyerId and sellerId must be different");
        }

        return convRepo.findByProductIdAndBuyerIdAndSellerId(productId, buyerId, sellerId)
                .map(existed -> {
                    // 首次命中旧数据时如果缺封面，顺带补齐
                    if (existed.getProductFirstImage() == null
                            && productFirstImage != null
                            && !productFirstImage.isBlank()) {
                        existed.setProductFirstImage(productFirstImage);
                        return convRepo.save(existed);
                    }
                    return existed;
                })
                .orElseGet(() -> {
                    Conversation conv = new Conversation(productId, orderId, buyerId, sellerId, startedBy);
                    if (productFirstImage != null && !productFirstImage.isBlank()) {
                        conv.setProductFirstImage(productFirstImage); // 新建时写库
                    }
                    Conversation saved = convRepo.save(conv);
                    // 两端参与者
                    partRepo.save(new ConversationParticipant(saved.getId(), buyerId, ParticipantRole.BUYER));
                    partRepo.save(new ConversationParticipant(saved.getId(), sellerId, ParticipantRole.SELLER));
                    return saved;
                });
    }

    /**
     * 发送文本/图片消息；系统消息由 Part C 的订单事件生成。
     * 维护会话快照；给对方 +1 未读。
     */
    @Transactional
    public Message sendMessage(UUID conversationId, UUID senderId, MessageType type, String body, String imageUrl) {
        Conversation conv = convRepo.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

        Message m = new Message();
        m.setConversationId(conversationId);
        m.setType(type);
        m.setSenderId(senderId);
        m.setBody(body);
        m.setImageUrl(imageUrl);
        m.setCreatedAt(Instant.now());

        Message saved = msgRepo.save(m);

        // 更新会话快照
        conv.setLastMessageId(saved.getId());
        conv.setLastMessageAt(saved.getCreatedAt());
        String preview = switch (type) {
            case TEXT -> body == null ? "" : (body.length() > 120 ? body.substring(0, 120) : body);
            case IMAGE -> "[图片]";
            case SYSTEM -> "[系统]";
        };
        conv.setLastMessagePreview(preview);
        convRepo.save(conv);

        // 给除发送者外的参与者 +1 未读
        // buyer
        var buyer = partRepo.findByConversationIdAndUserId(conversationId, conv.getBuyerId()).orElseThrow();
        var seller = partRepo.findByConversationIdAndUserId(conversationId, conv.getSellerId()).orElseThrow();
        if (senderId != null) {
            if (senderId.equals(conv.getBuyerId())) {
                seller.setUnreadCount(seller.getUnreadCount() + 1);
                partRepo.save(seller);
            } else if (senderId.equals(conv.getSellerId())) {
                buyer.setUnreadCount(buyer.getUnreadCount() + 1);
                partRepo.save(buyer);
            }
        } else {
            // SYSTEM 消息：两端都 +1，读取时再各自清零（Part C 里会用到）
            buyer.setUnreadCount(buyer.getUnreadCount() + 1);
            seller.setUnreadCount(seller.getUnreadCount() + 1);
            partRepo.save(buyer); partRepo.save(seller);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<Message> pageMessages(UUID conversationId, Pageable pageable) {
        // 默认升序返回，方便前端直接渲染
        return msgRepo.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);
    }

    /**
     * 标记已读：把当前用户在该会话的未读清零，并更新 last_read_message_id。
     * lastMessageId 可为空 -> 自动使用会话 last_message_id。
     */
    @Transactional
    public void markRead(UUID conversationId, UUID userId, UUID lastMessageId) {
        Conversation conv = convRepo.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));
        ConversationParticipant me = partRepo.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));
        UUID lm = (lastMessageId != null) ? lastMessageId : conv.getLastMessageId();
        me.setLastReadMessageId(lm);
        me.setUnreadCount(0);
        partRepo.save(me);
    }

    /** [C ADD] 将订单事件落为 SYSTEM 消息；幂等不去重，按时间顺序追加 */
    @Transactional
    public Message appendSystemMessageForOrderEvent(OrderStatusEvent evt) {
        // 1) 找到或创建会话（可能用户未先发起对话）
        Conversation conv = convRepo.findByProductIdAndBuyerIdAndSellerId(evt.productId, evt.buyerId, evt.sellerId)
                .orElseGet(() -> {
                    Conversation c = new Conversation(evt.productId, evt.orderId, evt.buyerId, evt.sellerId, evt.sellerId);
                    c.setOrderStatusCache(evt.newStatus);
                    return convRepo.save(c);
                });

        // 若会话上 orderId 为空则补齐
        if (conv.getOrderId() == null && evt.orderId != null) conv.setOrderId(evt.orderId);

        // 2) 生成 SYSTEM 消息
        Message m = new Message();
        m.setConversationId(conv.getId());
        m.setType(MessageType.SYSTEM);
        m.setSenderId(null); // SYSTEM
        m.setSystemEvent(mapSystemEvent(evt.newStatus));
        m.setBody(systemBodyFor(evt.newStatus));
        m.setMeta("{\"orderId\":\"" + evt.orderId + "\",\"newStatus\":\"" + evt.newStatus + "\"}");
        m.setCreatedAt(evt.occurredAt != null ? evt.occurredAt : Instant.now());
        Message saved = msgRepo.save(m);

        // 3) 更新会话快照
        conv.setOrderStatusCache(evt.newStatus);
        conv.setLastMessageId(saved.getId());
        conv.setLastMessageAt(saved.getCreatedAt());
        conv.setLastMessagePreview("[系统] " + saved.getSystemEvent());
        convRepo.save(conv);

        // 4) 两端 +1 未读
        var buyer = partRepo.findByConversationIdAndUserId(conv.getId(), conv.getBuyerId())
                .orElseGet(() -> partRepo.save(new ConversationParticipant(conv.getId(), conv.getBuyerId(), ParticipantRole.BUYER)));
        var seller = partRepo.findByConversationIdAndUserId(conv.getId(), conv.getSellerId())
                .orElseGet(() -> partRepo.save(new ConversationParticipant(conv.getId(), conv.getSellerId(), ParticipantRole.SELLER)));

        buyer.setUnreadCount(buyer.getUnreadCount() + 1);
        seller.setUnreadCount(seller.getUnreadCount() + 1);
        partRepo.save(buyer); partRepo.save(seller);

        return saved;
    }

    private static SystemEvent mapSystemEvent(OrderStatus s) {
        return switch (s) {
            case PENDING    -> SystemEvent.ORDER_PLACED;
            case PAID       -> SystemEvent.PAID;
            case SHIPPED    -> SystemEvent.SHIPPED;
            case COMPLETED  -> SystemEvent.COMPLETED;
            case CANCELLED  -> SystemEvent.CANCELLED;
        };
    }

    private static String systemBodyFor(OrderStatus s) {
        return switch (s) {
            case PENDING    -> "已下单";
            case PAID       -> "已支付";
            case SHIPPED    -> "已发货";
            case COMPLETED  -> "交易完成";
            case CANCELLED  -> "订单已取消";
        };
    }
}
