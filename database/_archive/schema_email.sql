CREATE TABLE IF NOT EXISTS email_verifications (
                                                   token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    token_hash  VARCHAR(128) NOT NULL,     -- 只存哈希
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at     TIMESTAMPTZ
    );

ALTER TABLE email_verifications
    ADD CONSTRAINT fk_ev_user
        FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_ev_token_hash ON email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS ix_ev_user_expires ON email_verifications(user_id, expires_at);
