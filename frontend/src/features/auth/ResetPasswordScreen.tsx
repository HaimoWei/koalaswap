import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { AuthService } from "../../services/auth";

export default function ResetPasswordScreen() {
    const [token, setToken] = useState("");
    const [pwd, setPwd] = useState("");

    const onSubmit = async () => {
        if (!token || !pwd) return Alert.alert("提示","请填写完整");
        try {
            await AuthService.reset(token.trim(), pwd);
            Alert.alert("成功","已重置密码，请返回登录");
        } catch (e: any) {
            Alert.alert("失败", e?.message || "重置失败");
        }
    };

    return (
        <View style={{ flex:1, padding:16, gap:12 }}>
            <Text style={{ fontSize:20, fontWeight:"700" }}>重设密码</Text>
            <TextInput placeholder="重置令牌" value={token} onChangeText={setToken} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <TextInput placeholder="新密码" secureTextEntry value={pwd} onChangeText={setPwd} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <Button title="提交" onPress={onSubmit} />
        </View>
    );
}

