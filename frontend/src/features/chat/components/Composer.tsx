import React from "react";
import { View, TextInput, Button } from "react-native";

export default function Composer({ onSend }: { onSend: (text: string) => Promise<any> }) {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);

    const submit = async () => {
        if (!text.trim()) return;
        try {
            setSending(true);
            await onSend(text.trim());
            setText("");
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8, borderTopWidth: 1, borderColor: "#eee", gap: 8 }}>
            <TextInput
                style={{ flex: 1, height: 40, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 10 }}
                placeholder="发一条消息…"
                value={text}
                onChangeText={setText}
                editable={!sending}
                returnKeyType="send"
                onSubmitEditing={submit}
            />
            <Button title={sending ? "发送中…" : "发送"} onPress={submit} disabled={sending} />
        </View>
    );
}
