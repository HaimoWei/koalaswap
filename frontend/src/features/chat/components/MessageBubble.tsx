// src/features/chat/components/MessageBubble.tsx
import React from "react";
import { View, Text, Image } from "react-native";
import type { MessageResponse } from "../../../types/chat";

type Props = {
    msg: MessageResponse;
    me: boolean;
    peerAvatar?: string | null;
    peerNickname?: string | null;
    showAvatar?: boolean;
    showName?: boolean;
    showRead?: boolean; // 仅我方最后一条可能展示
};

export default function MessageBubble({ msg, me, peerAvatar, peerNickname, showAvatar, showName, showRead }: Props) {
    if (msg.type === "SYSTEM") {
        return (
            <View style={{ alignItems: "center", marginVertical: 8 }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#eee", borderRadius: 10 }}>
                    <Text style={{ color: "#666", fontSize: 12 }}>{msg.body || msg.systemEvent || "系统消息"}</Text>
                </View>
            </View>
        );
    }

    const Bubble = ({ children }: { children: React.ReactNode }) => (
        <View style={{
            maxWidth: "72%",
            backgroundColor: me ? "#d1f7c4" : "#fff",
            borderWidth: 1, borderColor: "#eee",
            borderRadius: 16,
        }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                {children}
            </View>
        </View>
    );

    return (
        <View style={{ marginVertical: 6 }}>
            {/* 昵称（只对对方 & 分组首条显示） */}
            {showName && !me ? (
                <Text style={{ marginBottom: 4, color: "#999", fontSize: 12 }}>{peerNickname || "对方"}</Text>
            ) : null}

            <View style={{ flexDirection: me ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                {/* 左侧头像（只对对方 & 分组首条显示） */}
                {!me && showAvatar ? (
                    peerAvatar ? (
                        <Image source={{ uri: peerAvatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                    ) : (
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#ddd", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: "#666" }}>{(peerNickname || "?").slice(0,1)}</Text>
                        </View>
                    )
                ) : <View style={{ width: 28 }} />}

                {/* 气泡内容 */}
                <Bubble>
                    {msg.type === "IMAGE" && msg.imageUrl ? (
                        <Image source={{ uri: msg.imageUrl }} style={{ width: 180, height: 180, borderRadius: 12 }} />
                    ) : (
                        <Text style={{ fontSize: 16 }}>{msg.body}</Text>
                    )}
                </Bubble>
            </View>

            {/* 我方最后一条的已读标记（需要 peerReadTo 支持才会显示） */}
            {me && showRead ? (
                <Text style={{ alignSelf: "flex-end", marginTop: 2, color: "#999", fontSize: 11 }}>已读</Text>
            ) : null}
        </View>
    );
}
