package com.koalaswap.review.service;

import com.koalaswap.review.client.ProductClient;
import com.koalaswap.review.client.UserClient;
import com.koalaswap.review.dto.*;
import com.koalaswap.review.entity.*;
import com.koalaswap.review.events.ReviewEventPublisher;
import org.springframework.context.ApplicationEventPublisher;
import com.koalaswap.review.model.ReviewSlotStatus;
import com.koalaswap.review.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final OrderReviewRepository reviews;
    private final ReviewAppendRepository appends;
    private final ReviewSlotRepository slots;
    private final ProductClient products;
    private final UserClient users;
    private final ApplicationEventPublisher eventPublisher;

    // ====================== 工具方法 ======================

    /** 批量把 productId -> ProductBrief 映射成 Map */
    private Map<UUID, ProductClient.ProductBrief> loadProductBriefMap(Collection<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) return Map.of();
        var list = products.batchBrief(productIds);
        return list.stream().collect(Collectors.toMap(ProductClient.ProductBrief::id, Function.identity()));
    }

    /** 根据 slot 批量建立 (orderId, reviewerId) -> productId 的映射 */
    private Map<String, UUID> mapOrderReviewerToProduct(List<ReviewSlot> slotsList) {
        Map<String, UUID> m = new HashMap<>();
        for (var s : slotsList) {
            String key = s.getOrderId() + "_" + s.getReviewerId();
            m.put(key, s.getProductId());
        }
        return m;
    }

    private String keyOf(UUID orderId, UUID reviewerId) {
        return orderId + "_" + reviewerId;
    }

    private ReviewSlot slotExample(UUID orderId, UUID me){
        var s = new ReviewSlot();
        s.setOrderId(orderId);
        s.setReviewerId(me);
        return s;
    }

    // ====================== 业务方法 ======================

    // 创建首评
    @Transactional
    public ReviewRes create(UUID me, ReviewCreateReq req) {
        // 用 slot 判断我是否是该订单的买家/卖家，以及对方是谁
        var example = slotExample(req.orderId(), me);
        var slotOpt = slots.findAll(Example.of(example)).stream().findFirst();
        if (slotOpt.isEmpty()) throw new IllegalArgumentException("Order does not exist or you do not have permission to review it.");
        var slot = slotOpt.get();
        if (slot.getStatus() == ReviewSlotStatus.REVIEWED) throw new IllegalArgumentException("This order has already been reviewed.");

        reviews.findByOrderIdAndReviewerId(req.orderId(), me).ifPresent(r -> {
            throw new IllegalArgumentException("This order has already been reviewed.");
        });

        var r = new OrderReview();
        r.setOrderId(req.orderId());
        r.setReviewerId(me);
        r.setRevieweeId(slot.getRevieweeId());
        r.setReviewerRole(slot.getReviewerRole());
        r.setRating(req.rating());
        r.setComment(req.comment());
        r.setAnonymous(req.isAnonymous());
        r.setUpdatedAt(Instant.now());
        r = reviews.save(r);

        // 将槽位置为 REVIEWED
        slots.updateStatus(req.orderId(), me, ReviewSlotStatus.REVIEWED);

        // 发布评价事件到聊天服务
        try {
            // 根据 reviewer role 推导 buyerId 和 sellerId
            UUID buyerId, sellerId;
            if ("BUYER".equals(slot.getReviewerRole())) {
                buyerId = me; // 评价者是买家
                sellerId = slot.getRevieweeId(); // 被评价者是卖家
            } else {
                buyerId = slot.getRevieweeId(); // 被评价者是买家
                sellerId = me; // 评价者是卖家
            }

            ReviewEventPublisher.ReviewEvent event = new ReviewEventPublisher.ReviewEvent(
                    req.orderId(),
                    slot.getProductId(),
                    buyerId,
                    sellerId,
                    me,
                    slot.getReviewerRole(),
                    Instant.now()
            );

            eventPublisher.publishEvent(event);
            System.out.println("[ReviewService] Spring event published successfully");
        } catch (Exception e) {
            System.err.println("[ReviewService] Failed to publish review event, but review creation is still successful: " + e.getMessage());
        }

        // 只此一条，直接取一次 brief（含标题与首图）
        ProductClient.ProductBrief pb = null;
        try { pb = products.oneBrief(slot.getProductId()); } catch (Exception ignore) {}
        String title = pb == null ? null : pb.title();
        String img   = pb == null ? null : pb.firstImageUrl();

        return toRes(r, slot.getProductId(), title, img);
    }

    // 追评
    @Transactional
    public void append(UUID me, UUID reviewId, ReviewAppendReq req) {
        var r = reviews.findById(reviewId).orElseThrow(() -> new IllegalArgumentException("Review does not exist."));
        if (!r.getReviewerId().equals(me)) throw new AccessDeniedException("You can only add an additional comment to your own review.");
        var a = new ReviewAppend();
        a.setReview(r);
        a.setComment(req.comment());
        appends.save(a);
        r.setUpdatedAt(Instant.now());
        reviews.save(r);
    }

    // 用户主页评价列表（公开）——批量补齐 product brief
    public Page<ReviewRes> listForUser(UUID userId, int page, int size, String role) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<OrderReview> origin = reviews.findByRevieweeId(userId, pageable);

        List<OrderReview> filtered = origin.getContent();
        if (role != null && !role.isBlank() && !"all".equalsIgnoreCase(role)) {
            filtered = filtered.stream()
                    .filter(r -> role.equalsIgnoreCase(r.getReviewerRole()))
                    .toList();
        }

        // 批量取评论者 Brief（匿名在 toRes 里再遮罩）
        var reviewerIds = filtered.stream().map(OrderReview::getReviewerId).distinct().toList();
        var reviewerBriefMap = users.briefBatch(reviewerIds).stream()
                .collect(Collectors.toMap(UserClient.UserBrief::id, b -> b));

        // 1) 批量查所有 order 的 slot（两条/单），构造 (orderId, reviewerId)->productId
        var orderIds = filtered.stream().map(OrderReview::getOrderId).distinct().toList();
        var slotList = slots.findByOrderIdIn(orderIds);
        var kmap = mapOrderReviewerToProduct(slotList);

        // 2) 批量查 product brief
        var productIds = slotList.stream().map(ReviewSlot::getProductId).filter(Objects::nonNull).distinct().toList();
        var pmap = loadProductBriefMap(productIds);

        List<ReviewRes> mapped = filtered.stream().map(r -> {
            UUID pid = kmap.get(keyOf(r.getOrderId(), r.getReviewerId()));
            var pb = pid == null ? null : pmap.get(pid);
            String title = pb == null ? null : pb.title();
            String img   = pb == null ? null : pb.firstImageUrl();
            return toResWithCachedReviewer(r, pid, reviewerBriefMap, title, img);
        }).toList();

        long total = ("all".equalsIgnoreCase(String.valueOf(role)) || role == null) ? origin.getTotalElements() : mapped.size();
        return new PageImpl<>(mapped, pageable, total);
    }

    // 带 withAppends 开关：仅当 withAppends=true 时把追评挂到主评上
    public Page<ReviewRes> listForUser(UUID userId, int page, int size, String role, boolean withAppends) {
        Page<ReviewRes> roots = listForUser(userId, page, size, role);
        if (!withAppends || roots.isEmpty()) {
            return roots; // 与原行为完全一致
        }
        return roots.map(root -> {
            var safeReviewer = root.reviewer();
            boolean isAnon = root.anonymous();
            var children = appends.findByReview_IdOrderByCreatedAtAsc(root.id());
            if (children == null || children.isEmpty()) {
                return root;
            }
            var list = new ArrayList<ReviewRes.AppendBrief>(children.size());
            children.sort((a, b) -> {
                long ta = a.getCreatedAt() == null ? 0L : a.getCreatedAt().toEpochMilli();
                long tb = b.getCreatedAt() == null ? 0L : b.getCreatedAt().toEpochMilli();
                return Long.compare(ta, tb);
            });
            for (var c : children) {
                list.add(new ReviewRes.AppendBrief(
                        c.getId(),
                        c.getComment(),
                        c.getCreatedAt(),
                        safeReviewer,
                        isAnon
                ));
            }
            return new ReviewRes(
                    root.id(), root.orderId(),
                    root.rating(), root.comment(),
                    root.reviewerRole(), root.anonymous(),
                    root.createdAt(),
                    root.reviewer(), root.reviewee(),
                    root.product(),
                    Collections.unmodifiableList(list)
            );
        });
    }

    // 我写过的首评（进入追评用）——批量补齐 product brief
    public Page<ReviewRes> mineGiven(UUID me, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        var p = reviews.findByReviewerId(me, pageable);

        // 1) 当页所有 orderId
        var orderIds = p.getContent().stream().map(OrderReview::getOrderId).distinct().toList();
        // 2) 批量查 slot（以我为 reviewer），得到 orderId -> productId
        var mySlots = slots.findByReviewerIdAndOrderIdIn(me, orderIds);
        var orderToProduct = mySlots.stream()
                .collect(Collectors.toMap(ReviewSlot::getOrderId, ReviewSlot::getProductId, (a,b)->a));
        // 3) 批量查 product brief
        var productMap = loadProductBriefMap(orderToProduct.values());

        return p.map(r -> {
            UUID pid = orderToProduct.get(r.getOrderId());
            ProductClient.ProductBrief pb = pid == null ? null : productMap.get(pid);
            String title = pb == null ? null : pb.title();
            String img   = pb == null ? null : pb.firstImageUrl();
            return toRes(r, pid, title, img);
        });
    }

    // 待评价（三分页）——为 buyer/seller 两个页签批量补齐 product brief
    public PendingRes pending(UUID me, String tab, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        var buyerPage  = slots.findByReviewerIdAndReviewerRoleAndStatus(me, "BUYER",  ReviewSlotStatus.PENDING, pageable);
        var sellerPage = slots.findByReviewerIdAndReviewerRoleAndStatus(me, "SELLER", ReviewSlotStatus.PENDING, pageable);
        var commented  = reviews.findByReviewerId(me, pageable);

        var uids = new HashSet<UUID>();
        buyerPage.forEach(s -> uids.add(s.getRevieweeId()));
        sellerPage.forEach(s -> uids.add(s.getRevieweeId()));
        commented.forEach(r -> uids.add(r.getRevieweeId()));

        var briefMap = users.briefBatch(uids.stream().toList()).stream()
                .collect(Collectors.toMap(UserClient.UserBrief::id, b -> b));

        // 批量补齐 product brief
        var allProductIds = new HashSet<UUID>();
        buyerPage.forEach(s -> allProductIds.add(s.getProductId()));
        sellerPage.forEach(s -> allProductIds.add(s.getProductId()));
        var pmap = loadProductBriefMap(allProductIds);

        List<PendingRes.Item> buyerItems = buyerPage.stream().map(s -> {
            var pb = pmap.get(s.getProductId());
            return new PendingRes.Item("buyer", s.getOrderId(), s.getProductId(), null,
                    toBrief(briefMap.get(s.getRevieweeId())),
                    new PendingRes.ProductBrief(s.getProductId(),
                            pb == null ? null : pb.title(),
                            pb == null ? null : pb.firstImageUrl()));
        }).toList();

        List<PendingRes.Item> sellerItems = sellerPage.stream().map(s -> {
            var pb = pmap.get(s.getProductId());
            return new PendingRes.Item("seller", s.getOrderId(), s.getProductId(), null,
                    toBrief(briefMap.get(s.getRevieweeId())),
                    new PendingRes.ProductBrief(s.getProductId(),
                            pb == null ? null : pb.title(),
                            pb == null ? null : pb.firstImageUrl()));
        }).toList();

        // commented 保持与你现在的“已评价 tab 走 /me/given”策略一致，这里不回 product
        return new PendingRes(buyerItems, sellerItems,
                new PendingRes.Counts(buyerPage.getNumberOfElements(), sellerPage.getNumberOfElements(), commented.getNumberOfElements()));
    }

    // 某订单的双方评价
    public List<ReviewRes> byOrder(UUID orderId) {
        var list = reviews.findAllByOrderId(orderId);
        return list.stream().map(r -> toRes(r, null)).toList();
    }

    // ====================== 构造/遮罩辅助 ======================

    private PendingRes.Brief toBrief(UserClient.UserBrief b){
        return b == null ? null : new PendingRes.Brief(b.id(), b.displayName(), b.avatarUrl());
    }

    // 新版：带 title/firstImageUrl
    private ReviewRes toRes(OrderReview r, UUID productId, String title, String firstImageUrl){
        var reviewerBrief = safeBriefOne(r.getReviewerId());
        var revieweeBrief = safeBriefOne(r.getRevieweeId());
        var safeReviewer  = maskReviewerIfAnon(r, reviewerBrief);
        ReviewRes.ProductBrief pb = productId == null ? null : new ReviewRes.ProductBrief(productId, title, firstImageUrl);
        return new ReviewRes(r.getId(), r.getOrderId(), r.getRating(), r.getComment(),
                r.getReviewerRole(), r.isAnonymous(), r.getCreatedAt(),
                safeReviewer,
                revieweeBrief == null ? null : new ReviewRes.UserBrief(revieweeBrief.id(), revieweeBrief.displayName(), revieweeBrief.avatarUrl()),
                pb,
                null
        );
    }

    private ReviewRes toResWithCachedReviewer(OrderReview r, UUID productId,
                                              Map<UUID, UserClient.UserBrief> cache,
                                              String title, String firstImageUrl){
        var reviewerBrief = cache.get(r.getReviewerId());
        var revieweeBrief = safeBriefOne(r.getRevieweeId());
        var safeReviewer  = maskReviewerIfAnon(r, reviewerBrief);
        ReviewRes.ProductBrief pb = productId == null ? null : new ReviewRes.ProductBrief(productId, title, firstImageUrl);
        return new ReviewRes(r.getId(), r.getOrderId(), r.getRating(), r.getComment(),
                r.getReviewerRole(), r.isAnonymous(), r.getCreatedAt(),
                safeReviewer,
                revieweeBrief == null ? null : new ReviewRes.UserBrief(revieweeBrief.id(), revieweeBrief.displayName(), revieweeBrief.avatarUrl()),
                pb,
                null
        );
    }

    // 兼容旧调用：不传 title/img 时走空
    private ReviewRes toRes(OrderReview r, UUID productId){
        return toRes(r, productId, null, null);
    }
    private ReviewRes toResWithCachedReviewer(OrderReview r, UUID productId, Map<UUID, UserClient.UserBrief> cache){
        return toResWithCachedReviewer(r, productId, cache, null, null);
    }

    private ReviewRes.UserBrief maskReviewerIfAnon(OrderReview r, UserClient.UserBrief brief){
        if (!r.isAnonymous()) {
            return brief == null ? null : new ReviewRes.UserBrief(brief.id(), brief.displayName(), brief.avatarUrl());
        }
        String alias = "BUYER".equalsIgnoreCase(r.getReviewerRole()) ? "Anonymous buyer" : "Anonymous seller";
        return new ReviewRes.UserBrief(null, alias, null);
    }

    private UserClient.UserBrief safeBriefOne(UUID id){
        try { return users.briefOne(id); } catch (Exception ignore) { return null; }
    }
}
