// [NEW] backend/user-service/src/main/java/com/koalaswap/user/events/PvBumpedEvent.java
package com.koalaswap.user.events;

import java.util.UUID;

/** 当用户 token_version 被加 1 时抛出该事件（事务提交后去写 Redis 并发布消息） */
public record PvBumpedEvent(UUID userId) {}
