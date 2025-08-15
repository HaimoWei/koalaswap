import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

type AfterLogin =
    | { type: "switchTab"; tab: "Me" | "Home" }
    | { type: "open"; name: "ProductEdit"; params?: any }
    | undefined;

export default function LoginScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const afterLogin: AfterLogin = route.params?.afterLogin;
    const { login, runPendingAction } = useAuth();

    const [email, setEmail] = useState("demo@koala.au");
    const [password, setPassword] = useState("123456");
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await login(email.trim(), password);

            // 先执行“登录前挂起的动作”（比如收藏、购买、发布等）
            runPendingAction();

            // 再处理显式的 afterLogin
            if (afterLogin?.type === "switchTab") {
                nav.navigate("AppTabs", { screen: afterLogin.tab });
            } else if (afterLogin?.type === "open") {
                nav.replace(afterLogin.name, afterLogin.params || {});
            } else if (nav.canGoBack()) {
                nav.goBack(); // 返回至来源页（比如商品详情）
            } else {
                nav.navigate("AppTabs", { screen: "Home" });
            }
        } catch (e: any) {
            Alert.alert("登录失败", e?.message || "请稍后再试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>登录</Text>
            <TextInput
                placeholder="邮箱"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
            />
            <TextInput
                placeholder="密码"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
            />
            <Button title={loading ? "登录中..." : "登录"} onPress={onSubmit} />
            <Button title="忘记密码" onPress={() => nav.navigate("ForgotPassword")} />
            <Button title="注册" onPress={() => nav.navigate("Register")} />
        </View>
    );
}
