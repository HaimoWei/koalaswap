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

    /** 取消/超时释放：RESERVED -> ACTIVE（仅当当前为 RESERVED 才生效） */
    public boolean release(UUID productId) {
        return repo.updateStatusIf(productId, ProductStatus.RESERVED, ProductStatus.ACTIVE) > 0;
    }

    /** 支付后：标记已售出（允许从任意非 SOLD 状态进入 SOLD；幂等） */
    public boolean markSold(UUID productId) {
        return repo.updateStatusUnless(productId, ProductStatus.SOLD) > 0;
    }

    /** 新增：无条件激活（把当前状态切到 ACTIVE；幂等） */
    public boolean activate(UUID productId) {
        return repo.updateStatusUnless(productId, ProductStatus.ACTIVE) > 0;
    }
}
