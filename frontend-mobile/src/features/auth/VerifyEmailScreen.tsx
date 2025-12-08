import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { AuthService } from "../../services/auth";

export default function VerifyEmailScreen() {
    const route = useRoute<any>();
    const [token, setToken] = useState(route.params?.presetToken || "");

    const onSubmit = async () => {
        if (!token) return Alert.alert("提示","请输入验证令牌");
        try {
            await AuthService.verifyEmail(token.trim());
            Alert.alert("成功","邮箱已验证，请返回登录");
        } catch (e: any) {
            Alert.alert("失败", e?.message || "验证失败");
        }
    };

    return (
        <View style={{ flex:1, padding:16, gap:12 }}>
            <Text style={{ fontSize:20, fontWeight:"700" }}>邮箱验证</Text>
            <TextInput placeholder="验证令牌（离线模式注册后获得）" value={token} onChangeText={setToken}
                       style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <Button title="提交验证" onPress={onSubmit} />
        </View>
    );
}
