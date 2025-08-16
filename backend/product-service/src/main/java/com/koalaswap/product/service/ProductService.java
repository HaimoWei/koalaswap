package com.koalaswap.product.service;

import com.koalaswap.product.config.ProductProperties;
import com.koalaswap.product.dto.ProductCreateReq;
import com.koalaswap.product.dto.ProductRes;
import com.koalaswap.product.dto.ProductUpdateReq;
import com.koalaswap.product.entity.Product;
import com.koalaswap.product.entity.ProductImage;
import com.koalaswap.product.repository.ProductImageRepository;
import com.koalaswap.product.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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
    private final ProductProperties props; // 业务配置（图片上限等）

    /** 发布商品 */
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
        p.setActive(true);
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

        if (req.title() != null)       p.setTitle(req.title());
        if (req.description() != null) p.setDescription(req.description());
        if (req.price() != null)       p.setPrice(req.price());
        if (req.currency() != null)    p.setCurrency(req.currency());
        if (req.categoryId() != null)  p.setCategoryId(req.categoryId());
        if (req.condition() != null)   p.setCondition(req.condition());
        if (req.active() != null)      p.setActive(req.active());

        if (req.images() != null) {
            if (req.images().size() > props.getMaxImages()) {
                throw new IllegalArgumentException("最多上传 " + props.getMaxImages() + " 张图片");
            }
            images.deleteByProductId(id);
            images.flush(); // ⭐ 关键：避免 (product_id, sort_order) 冲突

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

    /** 软删除（仅作者）：active=false */
    @Transactional
    public void softDelete(UUID requesterId, UUID id) {
        var p = products.findById(id).orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        assertOwner(p, requesterId);
        if (!p.isActive()) return; // 幂等
        p.setActive(false);
        products.save(p);
    }

    /**
     * 搜索分页（仅 active=true）
     * @param kw       关键字（title/description）
     * @param catId    分类 ID
     * @param minPrice 最低价
     * @param maxPrice 最高价
     * @param page     页号（0 起）
     * @param size     页大小
     * @param sort     排序（如 "createdAt,desc" / "price,asc"）
     * @param excludeSellerId 排除的卖家（可选）
     */
    public Page<ProductRes> search(String kw, Integer catId,
                                   BigDecimal minPrice, BigDecimal maxPrice,
                                   int page, int size, String sort,
                                   UUID excludeSellerId) {
        int page0 = Math.max(0, page);
        int sizeClamped = Math.min(Math.max(size, 1), 50);
        var pageable = PageRequest.of(page0, sizeClamped, safeSort(sort));

        var normalizedKw = normalizeKeyword(kw);
        String kwLike = (normalizedKw == null) ? null : "%" + normalizedKw + "%";

        var pageData = products.searchByLike(kwLike, catId, minPrice, maxPrice, excludeSellerId, pageable);
        return pageData.map(pp -> toRes(pp, imageUrlsOf(pp.getId())));
    }

    /** 我的发布（需要登录） */
    public Page<ProductRes> listMine(UUID sellerId, int page, int size, String sort) {
        int page0 = Math.max(0, page);
        int sizeClamped = Math.min(Math.max(size, 1), 50);
        var pageable = PageRequest.of(page0, sizeClamped, safeSort(sort));
        var pageData = products.findBySellerId(sellerId, pageable);
        return pageData.map(p -> toRes(p, imageUrlsOf(p.getId())));
    }

    /** ✅ 首页推荐：不走 search()，走仓库专用 JPQL（active=true + 可选排除本人） */
    public Page<ProductRes> home(UUID excludeSellerId, int page, int size, String sort) {
        int page0 = Math.max(0, page);
        int sizeClamped = Math.min(Math.max(size, 1), 50);
        var pageable = PageRequest.of(page0, sizeClamped, safeSort(sort));
        var pageData = products.home(excludeSellerId, pageable);
        return pageData.map(p -> toRes(p, imageUrlsOf(p.getId())));
    }

    // ---------- 内部工具 ----------

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
                p.getId(), p.getSellerId(),
                p.getTitle(), p.getDescription(),
                p.getPrice(), p.getCurrency(),
                p.getCategoryId(), p.getCondition(),
                p.isActive(), p.getCreatedAt(), p.getUpdatedAt(),
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
