// src/main/java/com/koalaswap/chat/service/ConversationQueryService.java
package com.koalaswap.chat.service;

import com.koalaswap.chat.client.OrderClient;
import com.koalaswap.chat.client.ProductClient;
import com.koalaswap.chat.client.UserClient;
import com.koalaswap.chat.entity.Conversation;
import com.koalaswap.chat.repository.ConversationReadRepository;
import com.koalaswap.chat.repository.ConversationRepository;
import com.koalaswap.chat.dto.ConversationListItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConversationQueryService {

    private final ConversationReadRepository readRepo;
    private final ConversationRepository convRepo;
    private final UserClient userClient;
    private final ProductClient productClient;
    private final OrderClient orderClient;

    public ConversationQueryService(ConversationReadRepository r, ConversationRepository c,
                                    UserClient u, ProductClient p, OrderClient o) {
        this.readRepo = r; this.convRepo = c;
        this.userClient = u; this.productClient = p; this.orderClient = o;
    }

    public Page<ConversationListItem> page(UUID userId, boolean onlyArchived, boolean onlyPinned, Pageable pageable) {
        return readRepo.pageForUser(userId, onlyArchived, onlyPinned, pageable);
    }

    /** [B3 CHANGE] 带聚合：补 peer 昵称头像、商品首图/卖家、订单状态；并回写缓存（幂等） */
    @Transactional
    public Page<ConversationListItem> pageAggregated(UUID userId, boolean onlyArchived, boolean onlyPinned, Pageable pageable) {
        Page<ConversationListItem> page = readRepo.pageForUser(userId, onlyArchived, onlyPinned, pageable);
        if (page.isEmpty()) return page;

        // 收集 ID
        Set<UUID> peerIds = page.stream().map(ConversationListItem::peerUserId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> productIds = page.stream().map(ConversationListItem::productId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> orderIds = page.stream().map(ConversationListItem::orderId).filter(Objects::nonNull).collect(Collectors.toSet());

        var users = userClient.batchBrief(peerIds);
        var products = productClient.batchBrief(productIds);
        var orders = orderClient.batchBrief(orderIds);

        // 回写缓存：若首图/状态为空则使用聚合结果回填
        Map<UUID, Conversation> toUpdate = new LinkedHashMap<>();
        for (ConversationListItem it : page) {
            Conversation conv = null;
            var p = products.get(it.productId());
            if (p != null && (it.productFirstImage() == null || it.productFirstImage().isBlank())) {
                if (conv == null) conv = convRepo.findById(it.id()).orElse(null);
                if (conv != null) { conv.setProductFirstImage(p.firstImageUrl()); toUpdate.put(conv.getId(), conv); }
            }
            var o = orders.get(it.orderId());
            if (o != null && it.orderStatus() == null) {
                if (conv == null) conv = convRepo.findById(it.id()).orElse(null);
                if (conv != null) { conv.setOrderStatusCache(o.status()); toUpdate.put(conv.getId(), conv); }
            }
        }
        if (!toUpdate.isEmpty()) convRepo.saveAll(toUpdate.values());

        // 生成带 peer 昵称/头像和商品信息的视图对象
        return page.map(it -> new ConversationListItem(
                it.id(), it.productId(), it.orderId(), it.buyerId(), it.sellerId(), it.peerUserId(),
                it.unread(), it.archived(), it.pinnedAt(),
                it.orderStatus(), // 若已回写，下次查询就有；本次仍用原值
                it.productFirstImage(),
                it.lastMessageAt(), it.lastMessagePreview(),
                Optional.ofNullable(users.get(it.peerUserId())).map(UserClient.UserBrief::displayName).orElse(null),
                Optional.ofNullable(users.get(it.peerUserId())).map(UserClient.UserBrief::avatarUrl).orElse(null),
                // 新增商品信息
                Optional.ofNullable(products.get(it.productId())).map(ProductClient.ProductBrief::title).orElse(null),
                Optional.ofNullable(products.get(it.productId())).map(ProductClient.ProductBrief::price).orElse(null),
                // 新增订单价格快照
                Optional.ofNullable(orders.get(it.orderId())).map(OrderClient.OrderBrief::priceSnapshot).orElse(null)
        ));
    }
}
