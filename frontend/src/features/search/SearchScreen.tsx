// src/features/search/SearchScreen.tsx  —— “输入页”
import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

const KEY = "search_history_v1";

export default function SearchScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const preset = route.params?.q ?? "";

    const [q, setQ] = React.useState(preset);
    const [hist, setHist] = React.useState<string[]>([]);

    React.useEffect(() => {
        AsyncStorage.getItem(KEY).then(v => setHist(v ? JSON.parse(v) : []));
    }, []);

    const goSearch = async (kw: string) => {
        if (!kw) return;
        const arr = [kw, ...hist.filter(x => x !== kw)].slice(0, 10);
        setHist(arr); await AsyncStorage.setItem(KEY, JSON.stringify(arr));
        nav.navigate("SearchResult", { q: kw });
    };

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <TextInput
                    placeholder="搜索你要的宝贝"
                    value={q}
                    onChangeText={setQ}
                    style={{ borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, flex: 1 }}
                />
                <Pressable onPress={() => goSearch(q)}>
                    <Text style={{ padding: 10, color: "#06c" }}>搜索</Text>
                </Pressable>
            </View>

            <Text style={{ fontWeight: "700", marginBottom: 6 }}>历史搜索</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {hist.map((h) => (
                    <Pressable key={h} onPress={() => goSearch(h)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#eee", borderRadius: 16 }}>
                        <Text>{h}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}
