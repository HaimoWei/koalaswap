// backend/user-service/src/main/java/com/koalaswap/user/controller/UserAddressController.java
package com.koalaswap.user.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.user.dto.AddressRes;
import com.koalaswap.user.dto.CreateAddressReq;
import com.koalaswap.user.dto.UpdateAddressReq;
import com.koalaswap.user.entity.UserAddress;
import com.koalaswap.user.repository.UserAddressRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/addresses")
@RequiredArgsConstructor
public class UserAddressController {
    private final UserAddressRepository addressRepository;

    /** 获取我的地址列表（需登录） */
    @GetMapping
    public ApiResponse<List<AddressRes>> listAddresses(Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var addresses = addressRepository.findByUserIdOrderByCreatedAtDesc(userId);
        var result = addresses.stream()
                .map(this::toAddressRes)
                .toList();
        return ApiResponse.ok(result);
    }

    /** 获取单个地址详情（需登录） */
    @GetMapping("/{id}")
    public ApiResponse<AddressRes> getAddress(@PathVariable UUID id, Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var address = addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("The address does not exist or you do not have permission to access it."));
        return ApiResponse.ok(toAddressRes(address));
    }

    /** 创建新地址（需登录） */
    @PostMapping
    @Transactional
    public ApiResponse<AddressRes> createAddress(@Valid @RequestBody CreateAddressReq request, Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);

        // 如果要设置为默认地址，先清除用户现有的默认地址
        boolean isDefault = request.isDefault() != null && request.isDefault();
        if (isDefault) {
            addressRepository.clearDefaultForUser(userId);
        }

        var address = new UserAddress();
        address.setUserId(userId);
        address.setReceiverName(request.receiverName());
        address.setPhone(request.phone());
        address.setProvince(request.province());
        address.setCity(request.city());
        address.setDistrict(request.district());
        address.setDetailAddress(request.detailAddress());
        address.setPostalCode(request.postalCode());
        address.setDefault(isDefault);

        address = addressRepository.save(address);
        return ApiResponse.ok(toAddressRes(address));
    }

    /** 更新地址（需登录） */
    @PutMapping("/{id}")
    @Transactional
    public ApiResponse<AddressRes> updateAddress(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAddressReq request,
            Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var address = addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("The address does not exist or you do not have permission to access it."));

        // 如果要设置为默认地址，先清除用户现有的默认地址
        boolean isDefault = request.isDefault() != null && request.isDefault();
        if (isDefault && !address.isDefault()) {
            addressRepository.clearDefaultForUser(userId);
        }

        // 更新地址信息
        address.setReceiverName(request.receiverName());
        address.setPhone(request.phone());
        address.setProvince(request.province());
        address.setCity(request.city());
        address.setDistrict(request.district());
        address.setDetailAddress(request.detailAddress());
        address.setPostalCode(request.postalCode());
        address.setDefault(isDefault);
        address.setUpdatedAt(Instant.now());

        address = addressRepository.save(address);
        return ApiResponse.ok(toAddressRes(address));
    }

    /** 删除地址（需登录） */
    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> deleteAddress(@PathVariable UUID id, Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);

        // 验证地址存在且属于当前用户
        var address = addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("The address does not exist or you do not have permission to access it."));

        addressRepository.deleteByIdAndUserId(id, userId);
        return ApiResponse.ok(null);
    }

    /** 设置为默认地址（需登录） */
    @PutMapping("/{id}/default")
    @Transactional
    public ApiResponse<AddressRes> setDefaultAddress(@PathVariable UUID id, Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var address = addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("The address does not exist or you do not have permission to access it."));

        // 清除用户现有的默认地址，设置新的默认地址
        addressRepository.clearDefaultForUser(userId);
        address.setDefault(true);
        address.setUpdatedAt(Instant.now());
        address = addressRepository.save(address);

        return ApiResponse.ok(toAddressRes(address));
    }

    /** 实体转换为响应DTO */
    private AddressRes toAddressRes(UserAddress address) {
        return new AddressRes(
                address.getId(),
                address.getReceiverName(),
                address.getPhone(),
                address.getProvince(),
                address.getCity(),
                address.getDistrict(),
                address.getDetailAddress(),
                address.getPostalCode(),
                address.isDefault(),
                address.getCreatedAt(),
                address.getUpdatedAt()
        );
    }
}
