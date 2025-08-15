import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { AuthService } from "../../services/auth";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [token, setToken] = useState<string | null>(null);

    const onSubmit = async () => {
        try {
            const res = await AuthService.forgot(email.trim()); // res: { sent: boolean; token?: string; note?: string }
            setToken(res.token ?? null); // 统一：没有 token 时设为 null

            // 友好提示：有 token（离线模式下）就引导去“重设密码”，否则给 note 或兜底文案
            Alert.alert(
                "已发送",
                res.token
                    ? "离线模式：下方显示重置令牌，复制到“重设密码”页使用。"
                    : (res.note ?? "如果该邮箱存在，会收到邮件")
            );
        } catch (e: any) {
            Alert.alert("失败", e?.message || "请稍后再试");
        }
    };

    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>忘记密码</Text>
            <TextInput
                placeholder="注册邮箱"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
            />
            <Button title="发送重置邮件（mock）" onPress={onSubmit} />

            {token !== null && ( // 用 !== null 更明确
                <View style={{ marginTop: 12 }}>
                    <Text style={{ color: "#888" }}>离线模式重置令牌：</Text>
                    <Text selectable style={{ fontWeight: "700" }}>{token}</Text>
                </View>
            )}
        </View>
    );
}
