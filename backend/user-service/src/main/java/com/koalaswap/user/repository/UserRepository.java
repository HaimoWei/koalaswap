package com.koalaswap.user.repository;

import com.koalaswap.user.entity.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * 数据访问层（DAO）：继承 JpaRepository 就拥有了大量 CRUD 能力。
 * Spring 会根据方法名自动生成 SQL。
 */
public interface UserRepository extends JpaRepository<User, UUID> {

    /** 通过邮箱查找用户：会生成 SELECT * FROM users WHERE email = ? */
    Optional<User> findByEmail(String email);

    /** 判断邮箱是否已存在：SELECT COUNT(1) FROM users WHERE email = ? */
    boolean existsByEmail(String email);

    @Query("select u.passwordUpdatedAt from User u where u.id = :id")
    Optional<Instant> findPasswordUpdatedAt(@Param("id") UUID id);

    @Query("select u.tokenVersion from User u where u.id = :id")
    java.util.Optional<Integer> findTokenVersionById(@org.springframework.data.repository.query.Param("id") java.util.UUID id);

    // backend/user-service/src/main/java/com/koalaswap/user/repository/UserRepository.java
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update User u set u.tokenVersion = u.tokenVersion + 1 where u.id = :id")
    int bumpTokenVersion(@Param("id") UUID id);
}
