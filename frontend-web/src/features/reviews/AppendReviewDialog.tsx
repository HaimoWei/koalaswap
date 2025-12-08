import { useState } from "react";

export function AppendReviewDialog({
                                       open,
                                       onClose,
                                       onSubmit,
                                       loading,
                                   }: {
    open: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<void> | void;
    loading?: boolean;
}) {
    const [content, setContent] = useState("");
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
            <div className="w-[92%] max-w-md bg-white rounded-xl p-5 shadow">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Additional review</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
                </div>
                <textarea
                    className="w-full border rounded p-3 text-sm h-32"
                    placeholder="Add more about your experience or new findings (pros/cons)…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="mt-3 flex justify-end gap-2">
                    <button onClick={onClose} className="btn btn-secondary text-sm">Cancel</button>
                    <button
                        onClick={async () => { await onSubmit(content.trim()); setContent(""); }}
                        disabled={loading || !content.trim()}
                        className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Submit additional review"}
                    </button>
                </div>
            </div>
        </div>
    );
}
