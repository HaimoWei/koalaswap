package com.koalaswap.order.dto;

/** 发货信息（MVP 先记录日志/事件，后续扩表） */
public record ShipReq(String trackingNo, String carrier) {}
