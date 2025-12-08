// src/features/search/SearchScreen.tsx  —— “输入页”
import React from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

const KEY = "search_history_v1";

export default function SearchScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const preset = route.params?.q ?? "";
    const [q, setQ] = React.useState<string>(preset);
    const [hist, setHist] = React.useState<string[]>([]);

    React.useEffect(() => {
        (async () => {
            try {
                const s = await AsyncStorage.getItem(KEY);
                setHist(s ? JSON.parse(s) : []);
            } catch {}
        })();
    }, []);

    const saveHist = async (keyword: string) => {
        const arr = [keyword, ...hist.filter((x) => x !== keyword)].slice(0, 10);
        setHist(arr);
        await AsyncStorage.setItem(KEY, JSON.stringify(arr));
    };

    const goSearch = async (keyword: string) => {
        const kw = keyword.trim();
        if (!kw) return Alert.alert("提示", "请输入关键字");
        await saveHist(kw);
        nav.navigate("SearchResult", { q: kw }); // ← 跳转到“结果页”
    };

    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>搜索</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                    placeholder="请输入关键字"
                    value={q}
                    onChangeText={setQ}
                    style={{ flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 10 }}
                />
                <Pressable onPress={() => goSearch(q)}>
                    <Text style={{ padding: 10, color: "#06c" }}>搜索</Text>
                </Pressable>
            </View>

            <Text style={{ fontWeight: "700", marginBottom: 6 }}>历史搜索</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {hist.map((h) => (
                    <Pressable
                        key={h}
                        onPress={() => goSearch(h)}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#eee", borderRadius: 16 }}
                    >
                        <Text>{h}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}
