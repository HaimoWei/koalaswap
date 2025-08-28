// src/navigation/RootNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

import ProductListScreen from "../features/products/ProductListScreen";
import MeScreen from "../features/me/MeScreen";
import ProductDetailScreen from "../features/products/ProductDetailScreen";
import ProductEditScreen from "../features/products/ProductEditScreen";
import ProductPreviewScreen from "../features/products/ProductPreviewScreen";
import SellerProfileScreen from "../features/users/SellerProfileScreen";

import LoginScreen from "../features/auth/LoginScreen";
import RegisterScreen from "../features/auth/RegisterScreen";
import ForgotPasswordScreen from "../features/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../features/auth/ResetPasswordScreen";
import VerifyEmailScreen from "../features/auth/VerifyEmailScreen";

import SearchScreen from "../features/search/SearchScreen";
import SearchResultScreen from "../features/search/SearchResultScreen";

import MyListingsScreen from "../features/me/MyListingsScreen";
import FavoritesScreen from "../features/me/FavoritesScreen";
import MyOrdersScreen from "../features/me/MyOrdersScreen";
import SoldScreen from "../features/me/SoldScreen";
import PendingReviewsScreen from "../features/me/PendingReviewsScreen";
import SettingsScreen from "../features/settings/SettingsScreen";


const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const Title = ({ children }: { children?: React.ReactNode }) => (
    <Text style={{ fontSize: 17, fontWeight: "600" }}>{String(children ?? "")}</Text>
);

function SellButton() {
    const rootNav = useNavigation<any>();
    const { token } = useAuth();
    return (
        <Pressable
            onPress={() => {
                if (!token) {
                    rootNav.navigate("Login", { afterLogin: { type: "open", name: "ProductEdit", params: { id: null } } });
                    return;
                }
                rootNav.navigate("ProductEdit", { id: null });
            }}
            style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#ffd400",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
            }}
        >
            <Text style={{ fontWeight: "800" }}>发布</Text>
        </Pressable>
    );
}

function KoalaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { token } = useAuth();
    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "flex-end",
                padding: 8,
                borderTopWidth: 1,
                borderColor: "#eee",
                backgroundColor: "#fff",
            }}
        >
            {state.routes.map((route, index) => {
                if (route.name === "Sell") return <SellButton key="sell" />;
                const isFocused = state.index === index;
                const label =
                    descriptors[route.key].options.title ??
                    descriptors[route.key].options.tabBarLabel ??
                    route.name;

                return (
                    <Pressable
                        key={route.key}
                        onPress={() => {
                            if (route.name === "Me" && !token) {
                                navigation.getParent()?.navigate("Login", {
                                    afterLogin: { type: "switchTab", tab: "Me" },
                                });
                                return;
                            }
                            navigation.navigate(route.name);
                        }}
                        style={{ padding: 8 }}
                    >
                        <Text style={{ color: isFocused ? "#000" : "#666" }}>{String(label)}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function AppTabs() {
    const Empty = () => <View />;

    return (
        <Tabs.Navigator
            screenOptions={{
                headerTitleAlign: "center",
                headerTitle: ({ children }) => <Title>{children}</Title>,
            }}
            tabBar={(p) => <KoalaTabBar {...p} />}
        >
            <Tabs.Screen name="Home" component={ProductListScreen} options={{ title: "首页" }} />
            <Tabs.Screen name="Sell" component={Empty} options={{ title: "" }} />
            <Tabs.Screen name="Me" component={MeScreen} options={{ title: "我的" }} />
        </Tabs.Navigator>
    );
}

export default function RootNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTitleAlign: "center",
                headerTitle: ({ children }) => <Title>{children}</Title>,
            }}
        >
            <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />

            {/* 搜索 & 商品相关 */}
            <Stack.Screen name="Search" component={SearchScreen} options={{ title: "搜索" }} />
            <Stack.Screen name="SearchResult" component={SearchResultScreen} options={{ title: "搜索结果" }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "商品详情" }} />
            <Stack.Screen name="ProductPreview" component={ProductPreviewScreen} options={{ title: "预览" }} />
            <Stack.Screen name="ProductEdit" component={ProductEditScreen} options={{ title: "发布/编辑" }} />

            {/* 我的 子页 */}
            <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "我发布的" }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: "我的收藏" }} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: "我的订单" }} />
            <Stack.Screen name="Sold" component={SoldScreen} options={{ title: "我卖出的" }} />
            <Stack.Screen name="PendingReviews" component={PendingReviewsScreen} options={{ title: "待评价" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "设置" }} />

            {/* 登录 */}
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={({ navigation }) => ({
                    title: "登录",
                    presentation: "modal",
                    headerLeft: () => (
                        <Pressable
                            onPress={() => {
                                if (navigation.canGoBack()) navigation.goBack();
                                else navigation.navigate("AppTabs", { screen: "Home" });
                            }}
                        >
                            <Text style={{ padding: 8, fontSize: 18 }}>✕</Text>
                        </Pressable>
                    ),
                })}
            />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "注册", presentation: "modal" }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "忘记密码", presentation: "modal" }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "重设密码", presentation: "modal" }} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "邮箱验证", presentation: "modal" }} />
            <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: "卖家主页", presentation: "modal"  }} />
        </Stack.Navigator>
    );
}
