import React from "react";
import { View, Text, FlatList } from "react-native";
import { OrderService } from "../../services/orders";
import { useAuth } from "../../context/AuthContext";

export default function MyOrdersScreen() {
    const { token } = useAuth();
    const [list, setList] = React.useState<any[]>([]);
    React.useEffect(()=>{ (async()=>{ if (token) setList(await OrderService.myOrders(token)); })(); },[token]);

    return (
        <View style={{ flex:1, padding:12 }}>
            <FlatList data={list} keyExtractor={i=>i.id} renderItem={({item}) => (
                <View style={{ padding:12, borderWidth:1, borderRadius:12, marginBottom:8 }}>
                    <Text>订单 {item.id}</Text>
                    <Text>金额 A${item.priceSnapshot}</Text>
                    <Text>状态 {item.status}</Text>
                </View>
            )}/>
        </View>
    );
}
