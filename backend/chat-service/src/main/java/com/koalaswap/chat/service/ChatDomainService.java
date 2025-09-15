package com.koalaswap.chat.service;

import com.koalaswap.chat.entity.*;
import com.koalaswap.chat.model.*;
import com.koalaswap.chat.repository.*;
import com.koalaswap.chat.events.OrderStatusEvent;
import com.koalaswap.chat.events.ReviewEvent;           // ✅ 新增
import com.koalaswap.chat.dto.MessageResponse;           // ✅ 新增
import com.koalaswap.chat.dto.ConversationDetailResponse; // ✅ 新增
import com.koalaswap.chat.client.ProductClient;         // ✅ 新增
import com.koalaswap.chat.client.OrderClient;           // ✅ 新增
import com.koalaswap.chat.client.UserClient;            // ✅ 新增
import com.koalaswap.chat.ws.WsPublisher;               // ✅ 新增
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;                                    // ✅ 新增
import java.util.UUID;

@Service
public class ChatDomainService {

    /** 系统用户ID - 用于发送系统消息（订单状态变更等） */
    private static final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final ConversationRepository convRepo;
    private final ConversationParticipantRepository partRepo;
    private final MessageRepository msgRepo;
    private final WsPublisher ws;                        // ✅ 新增
    private final ProductClient productClient;          // ✅ 新增
    private final OrderClient orderClient;              // ✅ 新增
    private final UserClient userClient;                // ✅ 新增

    public ChatDomainService(ConversationRepository c,
                             ConversationParticipantRepository p,
                             MessageRepository m,
                             WsPublisher wsPublisher,    // ✅ 新增
                             ProductClient productClient, // ✅ 新增
                             OrderClient orderClient,    // ✅ 新增
                             UserClient userClient) {    // ✅ 新增
        this.convRepo = c;
        this.partRepo = p;
        this.msgRepo = m;
        this.ws = wsPublisher;                           // ✅ 新增
        this.productClient = productClient;              // ✅ 新增
        this.orderClient = orderClient;                  // ✅ 新增
        this.userClient = userClient;                    // ✅ 新增
    }

    @Transactional
    public Conversation getOrCreateConversation(
            UUID productId,
            UUID orderId,
            UUID buyerId,
            UUID sellerId,
            UUID startedBy,
            String productFirstImage
    ) {
        if (buyerId != null && buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("buyerId and sellerId must be different");
        }

        return convRepo.findByProductIdAndBuyerIdAndSellerId(productId, buyerId, sellerId)
                .map(existed -> {
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
                        conv.setProductFirstImage(productFirstImage);
                    }
                    Conversation saved = convRepo.save(conv);
                    partRepo.save(new ConversationParticipant(saved.getId(), buyerId, ParticipantRole.BUYER));
                    partRepo.save(new ConversationParticipant(saved.getId(), sellerId, ParticipantRole.SELLER));
                    return saved;
                });
    }

    /** 发送文本/图片消息；维护快照/未读，并推送会话消息 + 收件箱变化提示 */
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

        // 未读
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
            buyer.setUnreadCount(buyer.getUnreadCount() + 1);
            seller.setUnreadCount(seller.getUnreadCount() + 1);
            partRepo.save(buyer); partRepo.save(seller);
        }

        // ✅ 推送会话新消息
        var dto = new MessageResponse(
                saved.getId(), saved.getType(), saved.getSenderId(), saved.getBody(),
                saved.getImageUrl(), saved.getSystemEvent(), saved.getMeta(), saved.getCreatedAt()
        );
        ws.publishNewMessage(conversationId, dto);

        // ✅ 推送“收件箱变化”到双方个人队列（列表据此刷新）
        Map<String, Object> hint = Map.of("kind", "CONV_UPDATED", "conversationId", conversationId.toString());
        ws.publishMyInboxChanged(conv.getBuyerId(), hint);
        ws.publishMyInboxChanged(conv.getSellerId(), hint);

        return saved;
    }

    @Transactional(readOnly = true)
    public Page<Message> pageMessages(UUID conversationId, Pageable pageable) {
        return msgRepo.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);
    }

    /** 标记已读：清零未读并更新 last_read_message_id；保持返回 UUID */
    @Transactional
    public UUID markRead(UUID conversationId, UUID userId, UUID lastMessageId) {
        Conversation conv = convRepo.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));
        ConversationParticipant me = partRepo.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));
        UUID lm = (lastMessageId != null) ? lastMessageId : conv.getLastMessageId();
        me.setLastReadMessageId(lm);
        me.setUnreadCount(0);
        partRepo.save(me);
        return lm;
    }

    /** 订单事件 -> SYSTEM 消息；并推送会话消息 + 收件箱变化提示 */
    @Transactional
    public Message appendSystemMessageForOrderEvent(OrderStatusEvent evt) {
        System.out.println("[ChatDomainService] 处理订单事件: orderId=" + evt.orderId +
                         ", productId=" + evt.productId +
                         ", buyerId=" + evt.buyerId +
                         ", sellerId=" + evt.sellerId +
                         ", status=" + evt.newStatus);

        Conversation conv = convRepo.findByProductIdAndBuyerIdAndSellerId(evt.productId, evt.buyerId, evt.sellerId)
                .orElseGet(() -> {
                    System.out.println("[ChatDomainService] 会话不存在，创建新会话");
                    Conversation c = new Conversation(evt.productId, evt.orderId, evt.buyerId, evt.sellerId, evt.sellerId);
                    c.setOrderStatusCache(evt.newStatus);
                    return convRepo.save(c);
                });

        System.out.println("[ChatDomainService] 找到会话: id=" + conv.getId() +
                         ", orderId=" + conv.getOrderId() +
                         ", orderStatusCache=" + conv.getOrderStatusCache());

        if (conv.getOrderId() == null && evt.orderId != null) {
            System.out.println("[ChatDomainService] 设置会话orderId: " + evt.orderId);
            conv.setOrderId(evt.orderId);
        }

        Message m = new Message();
        m.setConversationId(conv.getId());
        m.setType(MessageType.SYSTEM);
        m.setSenderId(SYSTEM_USER_ID); // 使用系统用户ID而不是null
        m.setSystemEvent(mapSystemEvent(evt.newStatus));
        m.setBody(systemBodyFor(evt.newStatus));
        m.setMeta("{\"orderId\":\"" + evt.orderId + "\",\"newStatus\":\"" + evt.newStatus + "\"}");
        m.setCreatedAt(evt.occurredAt != null ? evt.occurredAt : Instant.now());
        Message saved = msgRepo.save(m);

        // 会话快照同步订单状态
        conv.setOrderStatusCache(evt.newStatus);
        conv.setLastMessageId(saved.getId());
        conv.setLastMessageAt(saved.getCreatedAt());
        conv.setLastMessagePreview("[系统] " + saved.getSystemEvent());
        Conversation finalConv = convRepo.save(conv);
        System.out.println("[ChatDomainService] 保存会话: id=" + finalConv.getId() +
                         ", orderId=" + finalConv.getOrderId() +
                         ", orderStatusCache=" + finalConv.getOrderStatusCache());

        // 未读（无则建）
        var buyer = partRepo.findByConversationIdAndUserId(conv.getId(), conv.getBuyerId())
                .orElseGet(() -> partRepo.save(new ConversationParticipant(conv.getId(), conv.getBuyerId(), ParticipantRole.BUYER)));
        var seller = partRepo.findByConversationIdAndUserId(conv.getId(), conv.getSellerId())
                .orElseGet(() -> partRepo.save(new ConversationParticipant(conv.getId(), conv.getSellerId(), ParticipantRole.SELLER)));
        buyer.setUnreadCount(buyer.getUnreadCount() + 1);
        seller.setUnreadCount(seller.getUnreadCount() + 1);
        partRepo.save(buyer); partRepo.save(seller);

        // ✅ 推送会话新消息（SYSTEM）
        var dto = new MessageResponse(
                saved.getId(), saved.getType(), saved.getSenderId(), saved.getBody(),
                saved.getImageUrl(), saved.getSystemEvent(), saved.getMeta(), saved.getCreatedAt()
        );
        ws.publishNewMessage(conv.getId(), dto);

        // ✅ 推送“收件箱变化”到双方个人队列（驱动列表状态徽标立即刷新）
        Map<String, Object> hint = Map.of("kind", "CONV_UPDATED", "conversationId", conv.getId().toString());
        ws.publishMyInboxChanged(conv.getBuyerId(), hint);
        ws.publishMyInboxChanged(conv.getSellerId(), hint);

        return saved;
    }

    // === 详情聚合（你已有） ===
    @Transactional(readOnly = true)
    public Detail getDetailFor(UUID conversationId, UUID currentUserId) {
        Conversation conv = convRepo.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));
        ConversationParticipant me = partRepo.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found for current user"));
        UUID peerUserId = currentUserId.equals(conv.getBuyerId()) ? conv.getSellerId() : conv.getBuyerId();
        ConversationParticipant peer = partRepo.findByConversationIdAndUserId(conversationId, peerUserId)
                .orElseThrow(() -> new EntityNotFoundException("Peer participant not found"));

        return new Detail(
                conv.getId(),
                conv.getProductId(),
                conv.getBuyerId(),
                conv.getSellerId(),
                conv.getOrderStatusCache(),
                conv.getProductFirstImage(),
                me.getLastReadMessageId(),
                peer.getLastReadMessageId()
        );
    }

    public record Detail(
            UUID id,
            UUID productId,
            UUID buyerId,
            UUID sellerId,
            com.koalaswap.chat.model.OrderStatus orderStatus,
            String productFirstImage,
            UUID myReadTo,
            UUID peerReadTo
    ) {}

    /** 获取聚合详情（含商品、订单、用户信息） */
    @Transactional(readOnly = true)
    public ConversationDetailResponse getDetailAggregated(UUID conversationId, UUID currentUserId) {
        Detail detail = getDetailFor(conversationId, currentUserId);
        
        // 获取商品信息（带降级策略）
        String productTitle = null;
        java.math.BigDecimal productPrice = null;
        try {
            var productOpt = productClient.getBrief(detail.productId());
            productTitle = productOpt.map(ProductClient.ProductBrief::title).orElse("商品详情");
            productPrice = productOpt.map(ProductClient.ProductBrief::price).orElse(java.math.BigDecimal.ZERO);
        } catch (Exception e) {
            productTitle = "商品详情"; // 降级默认值
            productPrice = java.math.BigDecimal.ZERO;
        }
        
        // 获取对方用户信息（带降级策略）
        UUID peerUserId = currentUserId.equals(detail.buyerId()) ? detail.sellerId() : detail.buyerId();
        String peerNickname = null;
        String peerAvatar = null;
        try {
            var peerOpt = userClient.getBrief(peerUserId);
            peerNickname = peerOpt.map(UserClient.UserBrief::displayName).orElse("用户" + peerUserId.toString().substring(0, 8));
            peerAvatar = peerOpt.map(UserClient.UserBrief::avatarUrl).orElse(null);
        } catch (Exception e) {
            peerNickname = "用户" + peerUserId.toString().substring(0, 8); // 降级默认值
        }
        
        // 获取订单ID和订单详情
        UUID orderId = null;
        ConversationDetailResponse.OrderDetail orderDetail = null;
        if (detail.id() != null) {
            Conversation conv = convRepo.findById(detail.id()).orElse(null);
            if (conv != null && conv.getOrderId() != null) {
                orderId = conv.getOrderId(); // 直接获取订单ID
                var orderOpt = orderClient.getBrief(conv.getOrderId());
                if (orderOpt.isPresent()) {
                    var order = orderOpt.get();
                    orderDetail = new ConversationDetailResponse.OrderDetail(
                            order.id(),
                            order.priceSnapshot(),
                            order.status(),
                            order.createdAt(),
                            order.trackingNo(),
                            order.carrier()
                    );
                }
            }
        }
        
        return new ConversationDetailResponse(
                detail.id(),
                detail.productId(),
                detail.buyerId(),
                detail.sellerId(),
                detail.orderStatus(),
                detail.productFirstImage(),
                detail.myReadTo(),
                detail.peerReadTo(),
                productTitle,
                productPrice,
                peerNickname,
                peerAvatar,
                orderId,
                orderDetail
        );
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

    /** 评价事件 -> SYSTEM 消息；并推送会话消息 + 收件箱变化提示 */
    @Transactional
    public Message appendSystemMessageForReviewEvent(ReviewEvent evt) {
        System.out.println("[ChatDomainService] 处理评价事件: orderId=" + evt.orderId() +
                         ", reviewerId=" + evt.reviewerId() +
                         ", reviewerRole=" + evt.reviewerRole());

        Conversation conv = convRepo.findByProductIdAndBuyerIdAndSellerId(evt.productId(), evt.buyerId(), evt.sellerId())
                .orElse(null);

        if (conv == null) {
            System.out.println("[ChatDomainService] 找不到对应的会话，跳过评价消息");
            return null;
        }

        // 确定系统事件类型
        SystemEvent systemEvent = "BUYER".equals(evt.reviewerRole()) ? SystemEvent.BUYER_REVIEWED : SystemEvent.SELLER_REVIEWED;
        String bodyText = "BUYER".equals(evt.reviewerRole()) ? "买家已评价" : "卖家已评价";

        Message m = new Message();
        m.setConversationId(conv.getId());
        m.setType(MessageType.SYSTEM);
        m.setSenderId(SYSTEM_USER_ID); // 使用系统用户ID
        m.setSystemEvent(systemEvent);
        m.setBody(bodyText);
        m.setMeta("{\"orderId\":\"" + evt.orderId() + "\",\"reviewerId\":\"" + evt.reviewerId() + "\",\"reviewerRole\":\"" + evt.reviewerRole() + "\"}");
        m.setCreatedAt(evt.occurredAt() != null ? evt.occurredAt() : Instant.now());
        Message saved = msgRepo.save(m);

        // 更新会话快照
        conv.setLastMessageId(saved.getId());
        conv.setLastMessageAt(saved.getCreatedAt());
        conv.setLastMessagePreview("[系统] " + bodyText);
        convRepo.save(conv);

        // 未读
        var buyer = partRepo.findByConversationIdAndUserId(conv.getId(), conv.getBuyerId()).orElse(null);
        var seller = partRepo.findByConversationIdAndUserId(conv.getId(), conv.getSellerId()).orElse(null);
        if (buyer != null) {
            buyer.setUnreadCount(buyer.getUnreadCount() + 1);
            partRepo.save(buyer);
        }
        if (seller != null) {
            seller.setUnreadCount(seller.getUnreadCount() + 1);
            partRepo.save(seller);
        }

        // ✅ 推送会话新消息（SYSTEM）
        var dto = new MessageResponse(
                saved.getId(), saved.getType(), saved.getSenderId(), saved.getBody(),
                saved.getImageUrl(), saved.getSystemEvent(), saved.getMeta(), saved.getCreatedAt()
        );
        System.out.println("[ChatDomainService] 🚀 准备推送评价系统消息到WebSocket: " + dto);
        ws.publishNewMessage(conv.getId(), dto);
        System.out.println("[ChatDomainService] ✅ 评价系统消息已发送到WebSocket");

        // ✅ 推送"收件箱变化"到双方个人队列（驱动列表状态徽标立即刷新）
        Map<String, Object> hint = Map.of("kind", "CONV_UPDATED", "conversationId", conv.getId().toString());
        System.out.println("[ChatDomainService] 📬 推送收件箱变化给买家: " + conv.getBuyerId());
        ws.publishMyInboxChanged(conv.getBuyerId(), hint);
        System.out.println("[ChatDomainService] 📬 推送收件箱变化给卖家: " + conv.getSellerId());
        ws.publishMyInboxChanged(conv.getSellerId(), hint);

        return saved;
    }
}
