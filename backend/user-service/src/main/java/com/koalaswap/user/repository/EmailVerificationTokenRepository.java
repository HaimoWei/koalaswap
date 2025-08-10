package com.koalaswap.user.repository;

import com.koalaswap.user.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository
        extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByToken(String token);
    Optional<EmailVerificationToken> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
}
