package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordReq(
    @NotBlank(message = "Current password must not be empty.")
    String currentPassword,

    @NotBlank(message = "New password must not be empty.")
    @Size(min = 6, max = 50, message = "New password length must be between 6 and 50 characters.")
    String newPassword
) {}
