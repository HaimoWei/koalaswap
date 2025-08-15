import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function RegisterScreen() {
    const nav = useNavigation<any>();
    const { register } = useAuth();
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = async () => {
        if (!email || !password || !displayName) return Alert.alert("提示","请填写完整");
        try {
            const { verifyToken } = await register(email.trim(), password, displayName.trim());
            Alert.alert("注册成功","离线模式：已生成邮箱验证令牌，已帮你带入验证页");
            nav.navigate("VerifyEmail", { presetToken: verifyToken });
        } catch (e: any) {
            Alert.alert("注册失败", e?.message || "请稍后再试");
        }
    };

    return (
        <View style={{ flex:1, padding:16, gap:12 }}>
            <Text style={{ fontSize:20, fontWeight:"700" }}>注册</Text>
            <TextInput placeholder="邮箱" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <TextInput placeholder="昵称" value={displayName} onChangeText={setDisplayName} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <TextInput placeholder="密码" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <Button title="注册并去验证邮箱" onPress={onSubmit} />
        </View>
    );
}

