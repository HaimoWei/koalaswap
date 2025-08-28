package com.koalaswap.review.service;

import com.koalaswap.review.client.ProductClient;
import com.koalaswap.review.client.UserClient;
import com.koalaswap.review.dto.*;
import com.koalaswap.review.entity.*;
import com.koalaswap.review.model.ReviewSlotStatus;
import com.koalaswap.review.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final OrderReviewRepository reviews;
    private final ReviewAppendRepository appends;
    private final ReviewSlotRepository slots;
    private final ProductClient products;
    private final UserClient users;

    // 创建首评
    @Transactional
    public ReviewRes create(UUID me, ReviewCreateReq req) {
        // 用 slot 判断我是否是该订单的买家/卖家，以及对方是谁
        var example = slotExample(req.orderId(), me);
        var slotOpt = slots.findAll(Example.of(example)).stream().findFirst();
        if (slotOpt.isEmpty()) throw new IllegalArgumentException("订单不存在或无评价权限");
        var slot = slotOpt.get();
        if (slot.getStatus() == ReviewSlotStatus.REVIEWED) throw new IllegalArgumentException("已评价");

        reviews.findByOrderIdAndReviewerId(req.orderId(), me).ifPresent(r -> {
            throw new IllegalArgumentException("已评价");
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

        return toRes(r, slot.getProductId());
    }

    private ReviewSlot slotExample(UUID orderId, UUID me){
        var s = new ReviewSlot();
        s.setOrderId(orderId);
        s.setReviewerId(me);
        return s;
    }

    // 追评
    @Transactional
    public void append(UUID me, UUID reviewId, ReviewAppendReq req) {
        var r = reviews.findById(reviewId).orElseThrow(() -> new IllegalArgumentException("评价不存在"));
        if (!r.getReviewerId().equals(me)) throw new AccessDeniedException("只能追评自己的评价");
        var a = new ReviewAppend();
        a.setReview(r);
        a.setComment(req.comment());
        appends.save(a);
        r.setUpdatedAt(Instant.now());
        reviews.save(r);
    }

    // 用户主页评价列表（公开）
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

        List<ReviewRes> mapped = filtered.stream()
                .map(r -> toResWithCachedReviewer(r, null, reviewerBriefMap))
                .toList();

        long total = "all".equalsIgnoreCase(String.valueOf(role)) || role == null ? origin.getTotalElements() : mapped.size();
        return new PageImpl<>(mapped, pageable, total);
    }

    // [ADDED] 带 withAppends 开关的重载：仅当 withAppends=true 时把追评挂到主评的 appends 上返回
    public Page<ReviewRes> listForUser(UUID userId, int page, int size, String role, boolean withAppends) {
        Page<ReviewRes> roots = listForUser(userId, page, size, role);
        if (!withAppends || roots.isEmpty()) {
            return roots; // 与原行为完全一致
        }
        return roots.map(root -> {
            // 追评由同一作者撰写；匿名与主评一致
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
                    Collections.unmodifiableList(list) // [ADDED]
            );
        });
    }

    // 我写过的首评（进入追评用）
    public Page<ReviewRes> mineGiven(UUID me, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        var p = reviews.findByReviewerId(me, pageable);
        return p.map(r -> toRes(r, null));
    }

    // 待评价（三分页）
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

        List<PendingRes.Item> buyerItems = buyerPage.stream().map(s ->
                new PendingRes.Item("buyer", s.getOrderId(), s.getProductId(), null,
                        toBrief(briefMap.get(s.getRevieweeId())), new PendingRes.ProductBrief(s.getProductId(), null))
        ).toList();

        List<PendingRes.Item> sellerItems = sellerPage.stream().map(s ->
                new PendingRes.Item("seller", s.getOrderId(), s.getProductId(), null,
                        toBrief(briefMap.get(s.getRevieweeId())), new PendingRes.ProductBrief(s.getProductId(), null))
        ).toList();

        List<PendingRes.Item> commentedItems = commented.stream().map(r ->
                new PendingRes.Item("commented", r.getOrderId(), null, r.getCreatedAt(),
                        toBrief(briefMap.get(r.getRevieweeId())), null)
        ).toList();

        return new PendingRes(buyerItems, sellerItems,
                new PendingRes.Counts(buyerPage.getNumberOfElements(), sellerPage.getNumberOfElements(), commented.getNumberOfElements()));
    }

    // 某订单的双方评价
    public List<ReviewRes> byOrder(UUID orderId) {
        var list = reviews.findAllByOrderId(orderId);
        return list.stream().map(r -> toRes(r, null)).toList();
    }

    private PendingRes.Brief toBrief(UserClient.UserBrief b){
        return b == null ? null : new PendingRes.Brief(b.id(), b.displayName(), b.avatarUrl());
    }

    private ReviewRes toRes(OrderReview r, UUID productId){
        var reviewerBrief = safeBriefOne(r.getReviewerId());
        var revieweeBrief = safeBriefOne(r.getRevieweeId());
        var safeReviewer  = maskReviewerIfAnon(r, reviewerBrief);
        ReviewRes.ProductBrief pb = productId == null ? null : new ReviewRes.ProductBrief(productId, null);
        return new ReviewRes(r.getId(), r.getOrderId(), r.getRating(), r.getComment(),
                r.getReviewerRole(), r.isAnonymous(), r.getCreatedAt(),
                safeReviewer,
                revieweeBrief == null ? null : new ReviewRes.UserBrief(revieweeBrief.id(), revieweeBrief.displayName(), revieweeBrief.avatarUrl()),
                pb,
                null // [ADDED] 默认不带追评
        );
    }

    private ReviewRes toResWithCachedReviewer(OrderReview r, UUID productId, Map<UUID, UserClient.UserBrief> cache){
        var reviewerBrief = cache.get(r.getReviewerId());
        var revieweeBrief = safeBriefOne(r.getRevieweeId());
        var safeReviewer  = maskReviewerIfAnon(r, reviewerBrief);
        ReviewRes.ProductBrief pb = productId == null ? null : new ReviewRes.ProductBrief(productId, null);
        return new ReviewRes(r.getId(), r.getOrderId(), r.getRating(), r.getComment(),
                r.getReviewerRole(), r.isAnonymous(), r.getCreatedAt(),
                safeReviewer,
                revieweeBrief == null ? null : new ReviewRes.UserBrief(revieweeBrief.id(), revieweeBrief.displayName(), revieweeBrief.avatarUrl()),
                pb,
                null // [ADDED] 默认不带追评
        );
    }

    private ReviewRes.UserBrief maskReviewerIfAnon(OrderReview r, UserClient.UserBrief brief){
        if (!r.isAnonymous()) {
            return brief == null ? null : new ReviewRes.UserBrief(brief.id(), brief.displayName(), brief.avatarUrl());
        }
        String alias = "BUYER".equalsIgnoreCase(r.getReviewerRole()) ? "匿名买家" : "匿名卖家";
        return new ReviewRes.UserBrief(null, alias, null);
    }

    private UserClient.UserBrief safeBriefOne(UUID id){
        try { return users.briefOne(id); } catch (Exception ignore) { return null; }
    }
}
