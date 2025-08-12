-- 运行前：确保 pgcrypto 已启用（上面已经启过一次的话可忽略）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
                                                     token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     user_id     UUID NOT NULL,
                                                     token_hash  VARCHAR(128) NOT NULL,      -- SHA-256 或 BCrypt 后的哈希
                                                     expires_at  TIMESTAMPTZ NOT NULL,
                                                     used        BOOLEAN NOT NULL DEFAULT FALSE,
                                                     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                                     used_at     TIMESTAMPTZ
);

-- 关联到 users，用户删除时一并清理其重置令牌
ALTER TABLE password_reset_tokens
    ADD CONSTRAINT fk_prt_user
        FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE;

-- 常用索引：按哈希查找、按用户/过期时间清理
CREATE UNIQUE INDEX IF NOT EXISTS ux_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS ix_prt_user_expires ON password_reset_tokens(user_id, expires_at);
