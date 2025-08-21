package com.koalaswap.product.service;

import com.koalaswap.product.model.ProductStatus;
import com.koalaswap.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductInternalService {
    private final ProductRepository repo;

    /** 下单占用：ACTIVE -> RESERVED */
    public boolean reserve(UUID productId) {
        return repo.updateStatusIf(productId, ProductStatus.ACTIVE, ProductStatus.RESERVED) > 0;
    }

    /** 取消/超时释放：RESERVED -> ON_SALE（幂等） */
    public boolean release(UUID productId) {
        return repo.updateStatusIf(productId, ProductStatus.RESERVED, ProductStatus.ACTIVE) > 0;
    }

    /** 支付后：标记已售出（允许从 ON_SALE/RESERVED 进入 SOLD；幂等） */
    public boolean markSold(UUID productId) {
        return repo.updateStatusUnless(productId, ProductStatus.SOLD) > 0;
    }
}
