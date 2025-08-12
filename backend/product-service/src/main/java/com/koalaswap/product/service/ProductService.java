// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/service/ProductService.java
// 业务层｜发布 + 详情 + 修改 + 软删除 + 搜索分页
// ===============================
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
import java.util.Set;
import java.util.UUID;
import java.util.Locale;

/**
 * 商品服务（MVP）
 * - create：写入 products + product_images（按顺序）
 * - find：根据 id 返回详情（含图片列表）
 * - update：仅作者可改；图片全量替换
 * - softDelete：仅作者可软删（active=false）
 * - search：分页/排序/条件查询（仅 active=true）
 */
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

    /** 修改商品（仅作者；图片全量替换） */
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
            var old = images.findByProductIdOrderBySortOrderAsc(id);
            images.deleteAll(old);
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
        if (!p.isActive()) return; // 幂等：已是下架/软删状态则直接返回
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
     */
    public Page<ProductRes> search(String kw, Integer catId,
                                   BigDecimal minPrice, BigDecimal maxPrice,
                                   int page, int size, String sort) {
        var pageable = PageRequest.of(page, size, safeSort(sort));

        // 先把 keyword 规范化为小写字符串；为空则置 null
        var normalizedKw = normalizeKeyword(kw);
        // 在 Java 里拼好 %pattern%
        String kwLike = (normalizedKw == null) ? null : "%" + normalizedKw + "%";

        var pageData = products.searchByLike(kwLike, catId, minPrice, maxPrice, pageable);
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

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    /**
     * 排序字段白名单，防止用户传入非法字段导致运行期错误或注入
     * 允许：createdAt / price / title
     * 默认：createdAt,desc
     */
    private static Sort safeSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Order.desc("createdAt"));
        }
        var parts = sortParam.split(",", 2);
        var field = parts[0].trim();
        var dir = parts.length > 1 ? parts[1].trim().toLowerCase() : "desc";

        Set<String> allowed = Set.of("createdAt", "price", "title");
        if (!allowed.contains(field)) {
            field = "createdAt";
        }
        var direction = "asc".equals(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(new Sort.Order(direction, field));
    }

    // 在类里新增这个工具方法（保留原来的 emptyToNull 也行）
    private static String normalizeKeyword(String s) {
        if (s == null) return null;
        var t = s.trim();
        return t.isEmpty() ? null : t.toLowerCase(Locale.ROOT);
    }
}

