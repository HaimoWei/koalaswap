package com.koalaswap.user.controller.internal;

import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/users")
@RequiredArgsConstructor
public class UserInternalController {
    private final UserRepository users;

    @GetMapping("/{id}/token-version")
    public Integer tokenVersion(@PathVariable UUID id) {
        return users.findTokenVersionById(id).orElse(1);
    }
}
