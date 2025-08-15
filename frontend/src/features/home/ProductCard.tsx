// src/features/home/ProductCard.tsx
import React from "react";
import { View, Text, Image, Pressable } from "react-native";

export default function ProductCard({ item, onPress }: { item: any; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}
        >
            <View>
                <Image source={{ uri: item.images?.[0]?.imageUrl }} style={{ width: "100%", height: 170 }} />
                {!item.isActive && (
                    <View style={{ position: "absolute", top: 8, right: 8, backgroundColor: "#999", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 12, color: "#fff" }}>已下架</Text>
                    </View>
                )}
            </View>
            <View style={{ padding: 8, gap: 6 }}>
                <Text numberOfLines={1} style={{ fontWeight: "600" }}>{item.title}</Text>
                <Text style={{ color: "#e33500", fontSize: 16, fontWeight: "700" }}>
                    A${item.price} {item.freeShipping ? "· 包邮" : ""}
                </Text>
                {item.seller && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#ddd" }} />
                        <Text style={{ color: "#666" }}>{item.seller.displayName || item.seller.id?.slice(0, 6)}</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}
