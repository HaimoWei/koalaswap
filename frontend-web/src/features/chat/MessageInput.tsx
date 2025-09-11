import { useState } from "react";

export function MessageInput({
                                 onSendText,
                                 onSendImage,
                                 sending,
                             }: {
    onSendText: (text: string) => Promise<void> | void;
    onSendImage: (url: string) => Promise<void> | void;
    sending?: boolean;
}) {
    const [text, setText] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    async function submitText() {
        const t = text.trim();
        if (!t) return;
        await onSendText(t);
        setText("");
    }
    async function submitImage() {
        const u = imageUrl.trim();
        if (!u) return;
        await onSendImage(u);
        setImageUrl("");
    }

    return (
        <div className="border-t bg-white p-3">
            <div className="flex gap-2">
                <input
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder="输入消息，回车发送"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitText()}
                    disabled={!!sending}
                />
                <button
                    onClick={submitText}
                    disabled={!!sending}
                    className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
                >
                    发送
                </button>
            </div>
            {/* 简易图片消息发送：贴一个图片 URL */}
            <div className="flex gap-2 mt-2">
                <input
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder="粘贴图片 URL（可选）"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitImage()}
                    disabled={!!sending}
                />
                <button
                    onClick={submitImage}
                    disabled={!!sending}
                    className="px-3 py-2 rounded bg-gray-100 text-sm disabled:opacity-50"
                >
                    发送图片
                </button>
            </div>
        </div>
    );
}
