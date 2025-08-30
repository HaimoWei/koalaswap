import React from "react";
import { Modal, View, Pressable, Text } from "react-native";

export default function ConversationActions({
                                                visible,
                                                onClose,
                                                archived,
                                                pinned,
                                                onPin,
                                                onArchive,
                                                onMute,
                                                onDelete,
                                            }: {
    visible: boolean;
    onClose: () => void;
    archived: boolean;
    pinned: boolean;
    onPin: () => Promise<any> | void;
    onArchive: () => Promise<any> | void;
    onMute: () => Promise<any> | void;
    onDelete: () => Promise<any> | void;
}) {
    const Item = ({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) => (
        <Pressable onPress={() => { onPress(); onClose(); }} style={{ paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: danger ? "#ff4d4f" : "#222" }}>{label}</Text>
        </Pressable>
    );
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
                <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 12 }}>
                    <Item label={pinned ? "取消置顶" : "置顶"} onPress={() => onPin()} />
                    <View style={{ height: 1, backgroundColor: "#eee" }} />
                    <Item label={archived ? "取消归档" : "归档"} onPress={() => onArchive()} />
                    <View style={{ height: 1, backgroundColor: "#eee" }} />
                    <Item label="静音30分钟" onPress={() => onMute()} />
                    <View style={{ height: 1, backgroundColor: "#eee" }} />
                    <Item label="删除会话" onPress={() => onDelete()} danger />
                    <View style={{ height: 8 }} />
                    <Item label="取消" onPress={onClose} />
                    <View style={{ height: 12 }} />
                </View>
            </Pressable>
        </Modal>
    );
}
