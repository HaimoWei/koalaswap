package com.koalaswap.user.repository;

import com.koalaswap.user.entity.UserAddress;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 用户地址数据访问层（DAO）：继承 JpaRepository 就拥有了大量 CRUD 能力。
 * Spring 会根据方法名自动生成 SQL。
 */
public interface UserAddressRepository extends JpaRepository<UserAddress, UUID> {

    /** 查找用户的所有地址：按创建时间倒序排列 */
    List<UserAddress> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /** 查找用户的默认地址 */
    Optional<UserAddress> findByUserIdAndIsDefaultTrue(UUID userId);

    /** 查找指定用户的指定地址（用于权限校验） */
    Optional<UserAddress> findByIdAndUserId(UUID id, UUID userId);

    /** 判断用户是否已有默认地址 */
    boolean existsByUserIdAndIsDefaultTrue(UUID userId);

    /** 统计用户的地址数量 */
    long countByUserId(UUID userId);

    /** 将用户的所有地址设为非默认（用于设置新默认地址前的清理） */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE UserAddress ua SET ua.isDefault = false WHERE ua.userId = :userId")
    void clearDefaultForUser(@Param("userId") UUID userId);

    /** 删除用户的指定地址（附加用户权限校验） */
    void deleteByIdAndUserId(UUID id, UUID userId);
}