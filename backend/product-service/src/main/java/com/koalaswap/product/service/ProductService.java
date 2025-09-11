package com.koalaswap.product.service;

import com.koalaswap.product.config.ProductProperties;
import com.koalaswap.product.dto.ProductCreateReq;
import com.koalaswap.product.dto.ProductRes;
import com.koalaswap.product.dto.ProductUpdateReq;
import com.koalaswap.product.entity.Product;
import com.koalaswap.product.entity.ProductImage;
import com.koalaswap.product.model.ProductStatus;
import com.koalaswap.product.repository.ProductImageRepository;
import com.koalaswap.product.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository products;
    private final ProductImageRepository images;
    private final ProductProperties props;

    /** 发布商品（默认 ACTIVE） */
    @Transactional
    public ProductRes create(UUID sellerId, ProductCreateReq req) {
        if (req.images() != null && req.images().size() > props.getMaxImages()) {
            throw new IllegalArgumentException("最多上传 " + props.getMaxImages() + " 张图片");
        }
        var p = new Product();
        p.setSellerId(sellerId);
        p.setTitle(req.title());
        p.setDescription(req.description());
        p.setPrice(req.price());
        p.setCurrency(req.currency());
        p.setCategoryId(req.categoryId());
        p.setCondition(req.condition());
        p.setStatus(ProductStatus.ACTIVE); // create 总是上架
        p = products.save(p);

        if (req.images() != null) {
            int i = 0;
            for (var url : req.images()) {
                var img = new ProductImage();
                img.setProductId(p.getId());
                img.setUrl(url);
                img.setSortOrder(i++);
                images.save(img);
            }
        }
        return toRes(p, imageUrlsOf(p.getId()));
    }

    /** 商品详情 */
    public ProductRes find(UUID id) {
        var p = products.findById(id).orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        return toRes(p, imageUrlsOf(id));
    }

    /** 修改商品（仅作者；图片全量替换 → 先删后插 + flush 防止唯一键冲突） */
    @Transactional
    public ProductRes update(UUID editorId, UUID id, ProductUpdateReq req) {
        var p = products.findById(id).orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        assertOwner(p, editorId);

        if (req.title() != null) p.setTitle(req.title());
        if (req.description() != null) p.setDescription(req.description());
        if (req.price() != null) p.setPrice(req.price());
        if (req.currency() != null) p.setCurrency(req.currency());
        if (req.categoryId() != null) p.setCategoryId(req.categoryId());
        if (req.condition() != null) p.setCondition(req.condition());
        if (req.status() != null) p.setStatus(req.status());

        if (req.images() != null) {
            if (req.images().size() > props.getMaxImages()) {
                throw new IllegalArgumentException("最多上传 " + props.getMaxImages() + " 张图片");
            }
            images.deleteByProductId(id);
            images.flush(); // 避免 (product_id, sort_order) 冲突
            int i = 0;
            for (var url : req.images()) {
                var img = new ProductImage();
                img.setProductId(id);
                img.setUrl(url);
                img.setSortOrder(i++);
                images.save(img);
            }
        }
        var saved = products.save(p);
        return toRes(saved, imageUrlsOf(id));
    }

    /** 下架（仅作者）：设置为 HIDDEN */
    @Transactional
    public void softHide(UUID requesterId, UUID id) {
        var p = products.findById(id).orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        assertOwner(p, requesterId);
        if (p.getStatus() == ProductStatus.HIDDEN) return; // 幂等
        p.setStatus(ProductStatus.HIDDEN);
        products.save(p);
    }

    // ProductService.java —— 仅替换这个方法
    @Transactional
    public void relist(UUID requesterId, UUID id) {
        var p = products.findById(id).orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        assertOwner(p, requesterId);

        // SOLD：不允许重新上架（业务规则）
        if (p.getStatus() == ProductStatus.SOLD) {
            throw new IllegalArgumentException("已售出的商品不能重新上架");
        }
        // RESERVED：有进行中的订单，不允许上架
        if (p.getStatus() == ProductStatus.RESERVED) {
            throw new IllegalArgumentException("有进行中的订单，暂不能上架");
        }
        // 已经是 ACTIVE，幂等返回
        if (p.getStatus() == ProductStatus.ACTIVE) {
            return;
        }

        // 只允许从 HIDDEN -> ACTIVE，且用条件更新避免并发竞态
        int updated = products.updateStatusIf(id, ProductStatus.HIDDEN, ProductStatus.ACTIVE);
        if (updated == 0) {
            // 并发或非法状态导致更新失败：再读一次状态给出明确提示（返回 400，而不是 500）
            var now = products.findById(id).orElseThrow();
            throw new IllegalArgumentException("当前状态不可上架：" + now.getStatus());
        }
    }

    /** 彻底删除（仅作者）：仅允许在 HIDDEN 状态；如存在订单将因外键失败 */
    @Transactional
    public void hardDelete(UUID requesterId, UUID id) {
        var p = products.findById(id).orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        assertOwner(p, requesterId);
        if (p.getStatus() != ProductStatus.HIDDEN) {
            throw new IllegalArgumentException("仅可以删除“已下架”的商品");
        }
        try {
            products.delete(p); // images & favorites 级联删除；orders 为 RESTRICT
        } catch (DataIntegrityViolationException e) {
            // 订单引用（ON DELETE RESTRICT），数据库会拒绝；给出友好提示
            throw new IllegalArgumentException("该商品存在订单记录，无法删除");
        }
    }

    /** 搜索分页（仅 ACTIVE） */
    public Page<ProductRes> search(String kw, Integer catId, BigDecimal minPrice, BigDecimal maxPrice,
                                   int page, int size, String sort, UUID excludeSellerId, UUID sellerId) { // ★ 新增 sellerId
        int page0 = Math.max(0, page);
        int sizeClamped = Math.min(Math.max(size, 1), 50);
        var pageable = PageRequest.of(page0, sizeClamped, safeSort(sort));
        var normalizedKw = normalizeKeyword(kw);
        String kwLike = (normalizedKw == null) ? null : "%" + normalizedKw + "%";

        // ★ 传入 sellerId（null 时不生效）
        var pageData = products.searchByLike(
                kwLike, catId, minPrice, maxPrice, excludeSellerId, sellerId, pageable
        );
        return pageData.map(pp -> toRes(pp, imageUrlsOf(pp.getId())));
    }

    /** 我的发布：tab=onsale(默认：ACTIVE/RESERVED) | hidden(HIDDEN) */
    public Page<ProductRes> listMine(UUID sellerId, String tab, int page, int size, String sort) {
        int page0 = Math.max(0, page);
        int sizeClamped = Math.min(Math.max(size, 1), 50);
        var pageable = PageRequest.of(page0, sizeClamped, safeSort(sort));

        Page<Product> pageData;
        if ("hidden".equalsIgnoreCase(tab)) {
            pageData = products.findBySellerIdAndStatusIn(sellerId, List.of(ProductStatus.HIDDEN), pageable);
        } else { // onsale
            pageData = products.findBySellerIdAndStatusIn(sellerId, List.of(ProductStatus.ACTIVE, ProductStatus.RESERVED), pageable);
        }
        return pageData.map(p -> toRes(p, imageUrlsOf(p.getId())));
    }

    /** 首页（仅 ACTIVE 且可选排除本人） */
    public Page<ProductRes> home(UUID excludeSellerId, int page, int size, String sort) {
        int page0 = Math.max(0, page);
        int sizeClamped = Math.min(Math.max(size, 1), 50);
        var pageable = PageRequest.of(page0, sizeClamped, safeSort(sort));
        var pageData = products.home(excludeSellerId, pageable);
        return pageData.map(p -> toRes(p, imageUrlsOf(p.getId())));
    }

    // ---------- helpers ----------
    private void assertOwner(Product p, UUID userId) {
        if (!p.getSellerId().equals(userId)) {
            throw new IllegalArgumentException("无权操作：只能修改/删除自己的商品");
        }
    }

    private List<String> imageUrlsOf(UUID productId) {
        return images.findByProductIdOrderBySortOrderAsc(productId).stream()
                .map(ProductImage::getUrl)
                .toList();
    }

    private static ProductRes toRes(Product p, List<String> imgs) {
        return new ProductRes(
                p.getId(),
                p.getSellerId(),
                p.getTitle(),
                p.getDescription(),
                p.getPrice(),
                p.getCurrency(),
                p.getCategoryId(),
                p.getCondition(),
                p.getStatus(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                imgs
        );
    }

    /** 排序字段白名单（默认 createdAt,desc） */
    private static Sort safeSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Order.desc("createdAt"));
        }
        var parts = sortParam.split(",", 2);
        var field = parts[0].trim();
        var dir = parts.length > 1 ? parts[1].trim().toLowerCase(Locale.ROOT) : "desc";
        Set<String> allowed = Set.of("createdAt", "price", "title");
        if (!allowed.contains(field)) field = "createdAt";
        var direction = "asc".equals(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(new Sort.Order(direction, field));
    }

    private static String normalizeKeyword(String s) {
        if (s == null) return null;
        var t = s.trim().toLowerCase(Locale.ROOT);
        return t.isEmpty() ? null : t;
    }
}
