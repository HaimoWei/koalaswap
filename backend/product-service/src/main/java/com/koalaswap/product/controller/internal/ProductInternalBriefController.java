// product-service/src/main/java/com/koalaswap/product/controller/internal/ProductInternalBriefController.java
package com.koalaswap.product.controller.internal;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.product.entity.Product;
import com.koalaswap.product.entity.ProductImage;
import com.koalaswap.product.repository.ProductImageRepository;
import com.koalaswap.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/internal/products/brief")
@RequiredArgsConstructor
public class ProductInternalBriefController {

    private final ProductRepository productRepo;
    private final ProductImageRepository imageRepo;

    // 返回字段需与 chat 的 ProductClient.ProductBrief 一致
    public record ProductBriefRes(UUID id, UUID sellerId, String firstImageUrl, String title) {}

    /** 单个 brief：GET /api/internal/products/brief/{id}  -> ApiResponse<ProductBriefRes> */
    @GetMapping("/{id}")
    public ApiResponse<ProductBriefRes> one(@PathVariable UUID id) {
        Product p = productRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found"));
        String first = imageRepo.findFirstByProductIdOrderBySortOrderAsc(p.getId())
                .map(ProductImage::getUrl)
                .orElse(null);
        return ApiResponse.ok(new ProductBriefRes(p.getId(), p.getSellerId(), first, p.getTitle()));
    }

    /** 批量 brief：GET /api/internal/products/brief/batch?ids={id}&ids={id2}...  -> ApiResponse<List<ProductBriefRes>> */
    @GetMapping("/batch")
    public ApiResponse<List<ProductBriefRes>> batch(@RequestParam(name = "ids", required = false) List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return ApiResponse.ok(List.of());
        List<UUID> distinct = ids.stream().filter(Objects::nonNull).distinct().toList();

        List<Product> products = productRepo.findAllById(distinct);
        List<ProductBriefRes> out = new ArrayList<>(products.size());
        for (Product p : products) {
            String first = imageRepo.findFirstByProductIdOrderBySortOrderAsc(p.getId())
                    .map(ProductImage::getUrl)
                    .orElse(null);
            out.add(new ProductBriefRes(p.getId(), p.getSellerId(), first, p.getTitle()));
        }
        return ApiResponse.ok(out);
    }
}
