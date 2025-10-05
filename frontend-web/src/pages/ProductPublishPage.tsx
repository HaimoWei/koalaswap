// src/pages/ProductPublishPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, updateProduct, getProduct, type Condition } from "../api/products";
import { fetchAllCategories, type CategoryRes } from "../api/categories";
import SimpleImageUploader from "../components/SimpleImageUploader";
import { toastSuccess } from "../store/overlay";

const CONDITIONS: { value: Condition; label: string }[] = [
    { value: "NEW", label: "全新" },
    { value: "LIKE_NEW", label: "99新" },
    { value: "GOOD", label: "良好" },
    { value: "FAIR", label: "一般" },
    { value: "POOR", label: "有明显使用痕迹" },
];

export default function ProductPublishPage() {
    const nav = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        currency: "AUD",      // 中国市场可改 "CNY"
        categoryId: "",
        condition: "GOOD" as Condition,
        freeShipping: false,
    });
    const [images, setImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<CategoryRes[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loading, setLoading] = useState(false);

    // 加载分类数据
    useEffect(() => {
        fetchAllCategories()
            .then(setCategories)
            .catch((err) => console.error("加载分类失败:", err))
            .finally(() => setLoadingCategories(false));
    }, []);

    // 编辑模式：加载现有商品数据
    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            getProduct(id)
                .then((product) => {
                    setForm({
                        title: product.title,
                        description: product.description || "",
                        price: product.price.toString(),
                        currency: product.currency,
                        categoryId: product.categoryId ? product.categoryId.toString() : "",
                        condition: product.condition,
                        freeShipping: !!((product as any).freeShipping ?? (product as any).free_shipping),
                    });
                    setImages(product.images || []);
                })
                .catch((err) => {
                    console.error("加载商品失败:", err);
                    setError("加载商品失败，请稍后重试");
                })
                .finally(() => setLoading(false));
        }
    }, [isEditing, id]);

    const update = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 前端校验
        if (!form.title.trim()) return setError("请填写标题");
        if (images.length === 0) return setError("请至少上传一张商品图片");
        const priceNum = Number(form.price);
        if (!priceNum || priceNum <= 0) return setError("价格必须大于 0");

        const payload = {
            title: form.title.trim(),
            description: form.description?.trim() || "",
            price: priceNum,
            currency: form.currency.trim() || "AUD",
            categoryId: form.categoryId ? Number(form.categoryId) : undefined,
            condition: form.condition,
            images: images.filter(Boolean), // 发送图片URL列表
            freeShipping: !!form.freeShipping,
        };

        try {
            setSubmitting(true);
            let result;

            if (isEditing && id) {
                result = await updateProduct(id, payload);
            } else {
                result = await createProduct(payload);
            }

            toastSuccess(isEditing ? "商品更新成功" : "发布成功");
            // 成功后跳转商品详情
            nav(`/products/${result.id}`);
        } catch (err: any) {
            setError(err?.response?.data?.message || (isEditing ? "更新失败，请稍后重试" : "发布失败，请稍后重试"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl p-4 sm:p-6">
                <div className="text-center py-8">加载中...</div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl p-4 sm:p-6">
            <h1 className="text-2xl font-semibold mb-4">{isEditing ? "编辑商品" : "发布闲置"}</h1>

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

                    {/* 图片上传 */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-3">
                            商品图片（必填，最多 8 张）
                        </label>
                        <SimpleImageUploader
                            maxImages={8}
                            onImagesChange={setImages}
                            initialImages={images}
                            className="mt-2"
                        />
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
                            {loadingCategories ? (
                                <div className="mt-1 input bg-gray-50 flex items-center justify-center">
                                    <span className="text-gray-500">加载分类中...</span>
                                </div>
                            ) : (
                                <select
                                    className="mt-1 input bg-white"
                                    value={form.categoryId}
                                    onChange={(e) => update("categoryId", e.target.value)}
                                >
                                    <option value="">请选择分类</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.parentId ? "　　" : ""}{cat.name}
                            {cat.parentId ? ` (${categories.find(p => p.id === cat.parentId)?.name})` : ""}
                        </option>
                    ))}
                </select>
            )}
        </label>

        {/* 是否包邮 */}
        <label className="block">
            <span className="text-sm text-gray-600">包邮</span>
            <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, freeShipping: !s.freeShipping }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.freeShipping ? 'bg-green-500' : 'bg-gray-300'}`}
                  aria-pressed={form.freeShipping}
                  aria-label="切换是否包邮"
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.freeShipping ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-700">{form.freeShipping ? '包邮（卖家承担运费）' : '不包邮（买家自理运费）'}</span>
            </div>
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
                    disabled={submitting || loading}
                    className="w-full sm:w-40 btn btn-primary"
                >
                    {submitting ? (isEditing ? "更新中..." : "发布中...") : (isEditing ? "更新" : "发布")}
                </button>
            </form>
        </div>
    );
}
