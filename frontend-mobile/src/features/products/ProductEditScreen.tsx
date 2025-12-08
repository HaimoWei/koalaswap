import React from "react";
import { View, Text, TextInput, Button, Alert, Switch } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { ProductService } from "../../services/products";

type Params = { id?: string; relist?: boolean };

export default function ProductEditScreen() {
    const nav = useNavigation<any>();
    const { params } = useRoute<any>();
    const { token } = useAuth();
    const { id } = (params as Params) || { id: null };
    const isCreate = !id;

    React.useEffect(() => {
        if (!token) { nav.navigate("Login"); } // ✅ 未登录拉起登录
    }, [token]);

    const [title, setTitle] = React.useState("");
    const [price, setPrice] = React.useState("");
    const [desc, setDesc] = React.useState("");
    const [condition, setCondition] = React.useState<"NEW"|"LIKE_NEW"|"GOOD"|"FAIR"|"POOR">("GOOD");
    const [categoryId, setCategoryId] = React.useState<number | null>(null);
    const [freeShipping, setFreeShipping] = React.useState(true);
    const [imageUrl, setImageUrl] = React.useState("");

    React.useEffect(() => {
        if (!isCreate && id) {
            ProductService.getById(id).then(p => {
                setTitle(p.title); setPrice(String(p.price)); setDesc(p.description || "");
                setCondition(p.condition); setCategoryId(p.categoryId ?? null); setFreeShipping(Boolean((p as any).freeShipping));
                setImageUrl(p.images?.[0]?.imageUrl || "");
            });
        }
    }, [isCreate, id]);

    const onSubmit = async () => {
        if (!title || !price) return Alert.alert("提示","请填写标题和价格");
        const payload: any = { title, price: Number(price), description: desc, condition, categoryId, freeShipping,
            images: imageUrl ? [{ id:"tmp", imageUrl, sortOrder:0 }] : undefined
        };
        try {
            if (isCreate) await ProductService.create(payload);
            else await ProductService.update(id!, payload);
            if (params.relist) {
                await ProductService.relist(params.id!);
            }
            nav.goBack();
        } catch (e: any) {
            Alert.alert("失败", e?.message || "请稍后再试");
        }
    };

    return (
        <View style={{ flex:1, padding:16, gap:12 }}>
            <Text style={{ fontSize:20, fontWeight:"700" }}>{isCreate ? "发布商品" : "编辑商品"}</Text>
            <TextInput placeholder="图片URL（离线占位，可空）" value={imageUrl} onChangeText={setImageUrl} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <TextInput placeholder="标题" value={title} onChangeText={setTitle} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <TextInput placeholder="价格" value={price} onChangeText={setPrice} inputMode="numeric" style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <TextInput placeholder="描述" value={desc} onChangeText={setDesc} style={{ borderWidth:1, borderRadius:8, padding:10, minHeight:80 }} multiline />
            <Text>成色（简单输入：NEW/LIKE_NEW/GOOD/FAIR/POOR）：</Text>
            <TextInput value={condition} onChangeText={(t)=>setCondition(t as any)} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <Text>分类ID（占位，可空）：</Text>
            <TextInput value={categoryId===null?"":String(categoryId)} onChangeText={t=>setCategoryId(t?Number(t):null)} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Text>包邮</Text><Switch value={freeShipping} onValueChange={setFreeShipping} />
            </View>
            <Button title={isCreate ? "发布" : "保存"} onPress={onSubmit} />
        </View>
    );
}
