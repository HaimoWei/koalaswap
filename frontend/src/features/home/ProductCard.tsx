// src/features/home/ProductCard.tsx
import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { formatAUD } from "../../utils/currency";

export default function ProductCard({
                                        item,
                                        onPress,
                                        seller,
                                    }: {
    item: any;
    onPress: () => void;
    seller?: { displayName?: string; avatarUrl?: string | null } | null;
}) {
    const firstImage = Array.isArray(item.images)
        ? typeof item.images[0] === "string"
            ? item.images[0]
            : item.images[0]?.imageUrl
        : undefined;

    const status = item.status as string | undefined;

    const overlayLabel =
        status === "HIDDEN" ? "已下架" : status === "SOLD" ? "已售出" : status === "RESERVED" ? "已预订" : null;

    return (
        <Pressable
            onPress={onPress}
            style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}
        >
            <View>
                {firstImage && <Image source={{ uri: firstImage }} style={{ width: "100%", height: 170 }} />}
                {overlayLabel && (
                    <View
                        style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            backgroundColor: "rgba(0,0,0,0.45)",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                        }}
                    >
                        <Text style={{ fontSize: 12, color: "#fff" }}>{overlayLabel}</Text>
                    </View>
                )}
            </View>
            <View style={{ padding: 8, gap: 6 }}>
                <Text numberOfLines={1} style={{ fontWeight: "600" }}>
                    {item.title}
                </Text>
                <Text style={{ color: "#e33500", fontSize: 16, fontWeight: "700" }}>{formatAUD(item.price)}</Text>
                {seller && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {seller.avatarUrl ? (
                            <Image source={{ uri: seller.avatarUrl }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                        ) : (
                            <View
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: "#ddd",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={{ fontSize: 12, color: "#666" }}>{seller.displayName?.slice(0, 1) ?? "?"}</Text>
                            </View>
                        )}
                        <Text style={{ color: "#666" }}>{seller.displayName}</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}
