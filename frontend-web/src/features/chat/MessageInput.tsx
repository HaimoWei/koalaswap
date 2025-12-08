import { useState } from "react";
import ChatImageUploader from "./ChatImageUploader";

export function MessageInput({
                                 conversationId,
                                 onSendText,
                                 onSendImage,
                                 sending,
                             }: {
    conversationId: string;
    onSendText: (text: string) => Promise<void> | void;
    onSendImage: (url: string) => Promise<void> | void;
    sending?: boolean;
}) {
    const [text, setText] = useState("");
    const [uploading, setUploading] = useState(false);

    async function submitText() {
        const t = text.trim();
        if (!t) return;
        await onSendText(t);
        setText("");
    }

    // Handle image upload completion
    const handleImageUploaded = async (cdnUrl: string) => {
        await onSendImage(cdnUrl);
    };

    const isDisabled = sending || uploading;

    return (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            {/* Main input area */}
            <div className="flex gap-2 items-end">
                {/* Image upload button */}
                <ChatImageUploader
                    conversationId={conversationId}
                    onImageUploaded={handleImageUploaded}
                    onUploadStart={() => setUploading(true)}
                    onUploadEnd={() => setUploading(false)}
                    disabled={isDisabled}
                />

                {/* Text input */}
                <input
                    className="flex-1 input text-sm"
                    placeholder="Type a message and press Enter"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitText()}
                    disabled={isDisabled}
                />

                {/* Send button */}
                <button
                    onClick={submitText}
                    disabled={isDisabled || !text.trim()}
                    className="btn btn-primary disabled:opacity-50 text-sm px-4"
                >
                    Send
            </button>
            </div>

            {/* Upload status */}
            {uploading && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading image...</span>
                </div>
            )}
        </div>
    );
}
