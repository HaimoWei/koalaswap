// src/pages/ProductPublishPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct, type Condition } from "../api/products";

const CONDITIONS: { value: Condition; label: string }[] = [
    { value: "NEW", label: "全新" },
    { value: "LIKE_NEW", label: "99新" },
    { value: "GOOD", label: "良好" },
    { value: "FAIR", label: "一般" },
    { value: "POOR", label: "有明显使用痕迹" },
];

export default function ProductPublishPage() {
    const nav = useNavigate();
    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        currency: "AUD",      // 中国市场可改 "CNY"
        categoryId: "",
        condition: "GOOD" as Condition,
    });
    const [images, setImages] = useState<string[]>([""]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

    const addImage = () => {
        if (images.length >= 5) return;
        setImages((arr) => [...arr, ""]);
    };
    const setImage = (i: number, v: string) => {
        setImages((arr) => arr.map((it, idx) => (idx === i ? v : it)));
    };
    const removeImage = (i: number) => {
        setImages((arr) => arr.filter((_, idx) => idx !== i));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 前端校验
        if (!form.title.trim()) return setError("请填写标题");
        const priceNum = Number(form.price);
        if (!priceNum || priceNum <= 0) return setError("价格必须大于 0");

        const payload = {
            title: form.title.trim(),
            description: form.description?.trim() || "",
            price: priceNum,
            currency: form.currency.trim() || "AUD",
            categoryId: form.categoryId ? Number(form.categoryId) : undefined,
            condition: form.condition,
            images: images.map((s) => s.trim()).filter(Boolean),
        };

        try {
            setSubmitting(true);
            const created = await createProduct(payload);
            // 发布成功 → 跳转商品详情
            nav(`/products/${created.id}`);
        } catch (err: any) {
            setError(err?.response?.data?.message || "发布失败，请稍后重试");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl p-4 sm:p-6">
            <h1 className="text-2xl font-semibold mb-4">发布闲置</h1>

            <form className="space-y-6" onSubmit={onSubmit}>
                {/* 基础信息 */}
                <section className="card p-4 sm:p-6 space-y-4">
                    <h2 className="text-lg font-medium">基础信息</h2>

                    <label className="block">
                        <span className="text-sm text-gray-600">标题 *</span>
                        <input
                            className="mt-1 input"
                            placeholder="写一个清晰的标题，比如：iPhone 12 128G"
                            value={form.title}
                            onChange={(e) => update("title", e.target.value)}
                            maxLength={200}
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-gray-600">描述</span>
                        <textarea
                            className="mt-1 input"
                            rows={5}
                            placeholder="补充品牌型号、购买时间、成色、是否有发票/包装等"
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            maxLength={5000}
                        />
                    </label>

                    {/* 图片（URL 模式，最多 5 张） */}
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">图片（最多 5 张，填图片 URL）</span>
                            <button
                                type="button"
                                onClick={addImage}
                                disabled={images.length >= 5}
                                className="btn btn-ghost text-sm disabled:opacity-40"
                            >
                                + 添加一张
                            </button>
                        </div>

                        <div className="mt-2 space-y-2">
                            {images.map((url, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input
                                        className="flex-1 input"
                                        placeholder="https://example.com/your-image.jpg"
                                        value={url}
                                        onChange={(e) => setImage(i, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary text-xs px-2 py-1"
                                        onClick={() => removeImage(i)}
                                        aria-label={`删除第 ${i + 1} 张图片`}
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 价格与属性 */}
                <section className="card p-4 sm:p-6 space-y-4">
                    <h2 className="text-lg font-medium">价格与属性</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm text-gray-600">价格 *</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="mt-1 input"
                                placeholder="0.00"
                                value={form.price}
                                onChange={(e) => update("price", e.target.value)}
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">货币</span>
                            <select
                                className="mt-1 input bg-white"
                                value={form.currency}
                                onChange={(e) => update("currency", e.target.value)}
                            >
                                <option value="AUD">AUD</option>
                                <option value="CNY">CNY</option>
                                <option value="USD">USD</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">分类（可选）</span>
                            <input
                                type="number"
                                className="mt-1 input"
                                placeholder="如：1001"
                                value={form.categoryId}
                                onChange={(e) => update("categoryId", e.target.value)}
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">成色 *</span>
                            <select
                                className="mt-1 input bg-white"
                                value={form.condition}
                                onChange={(e) => update("condition", e.target.value)}
                                required
                            >
                                {CONDITIONS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>

                {/* 提交 */}
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-40 btn btn-primary"
                >
                    {submitting ? "发布中..." : "发布"}
                </button>
            </form>
        </div>
    );
}
