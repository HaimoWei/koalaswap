package com.koalaswap.user.security;

import com.koalaswap.common.security.TokenVersionProvider;
import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Primary // ★ 在 user-service 优先注入这个实现
@RequiredArgsConstructor
public class JpaTokenVersionProvider implements TokenVersionProvider {

    private final UserRepository repo;

    @Override
    public int currentVersion(UUID userId) {
        return repo.findTokenVersionById(userId).orElse(1);
    }
}
