// src/pages/ProductPublishPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, updateProduct, getProduct, type Condition } from "../api/products";
import { fetchAllCategories, type CategoryRes } from "../api/categories";
import { translateCategoryName } from "../categoryNames";
import SimpleImageUploader from "../components/SimpleImageUploader";
import { toastSuccess } from "../store/overlay";

const CONDITIONS: { value: Condition; label: string }[] = [
    { value: "NEW", label: "Brand new" },
    { value: "LIKE_NEW", label: "Like new" },
    { value: "GOOD", label: "Good" },
    { value: "FAIR", label: "Fair" },
    { value: "POOR", label: "Well-used" },
];

export default function ProductPublishPage() {
    const nav = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        currency: "AUD",      // For China market you may switch to "CNY"
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

    // Load category data
    useEffect(() => {
        fetchAllCategories()
            .then(setCategories)
            .catch((err) => console.error("Failed to load categories:", err))
            .finally(() => setLoadingCategories(false));
    }, []);

    // Edit mode: load existing product data
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
                    console.error("Failed to load product:", err);
                    setError("Failed to load product, please try again later.");
                })
                .finally(() => setLoading(false));
        }
    }, [isEditing, id]);

    const update = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Client-side validation
        if (!form.title.trim()) return setError("Please enter a title.");
        if (images.length === 0) return setError("Please upload at least one product image.");
        const priceNum = Number(form.price);
        if (!priceNum || priceNum <= 0) return setError("Price must be greater than 0.");

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

            toastSuccess(isEditing ? "Item updated successfully" : "Listing created successfully");
            // After success, navigate to the product detail page
            nav(`/products/${result.id}`);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    (isEditing ? "Update failed, please try again later." : "Publish failed, please try again later.")
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl p-4 sm:p-6">
                <div className="text-center py-8">Loading...</div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl p-4 sm:p-6">
            <h1 className="text-2xl font-semibold mb-4">
                {isEditing ? "Edit item" : "List an item"}
            </h1>

            <form className="space-y-6" onSubmit={onSubmit}>
                {/* Basic information */}
                <section className="card p-4 sm:p-6 space-y-4">
                    <h2 className="text-lg font-medium">Basic information</h2>

                    <label className="block">
                        <span className="text-sm text-gray-600">Title *</span>
                        <input
                            className="mt-1 input"
                            placeholder='Write a clear title, e.g. "iPhone 12 128GB"'
                            value={form.title}
                            onChange={(e) => update("title", e.target.value)}
                            maxLength={200}
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-gray-600">Description</span>
                        <textarea
                            className="mt-1 input"
                            rows={5}
                            placeholder="Add brand/model, purchase date, condition, invoice/packaging and other details."
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            maxLength={5000}
                        />
                    </label>

                    {/* Image upload */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-3">
                            Product images (required, up to 8)
                        </label>
                        <SimpleImageUploader
                            maxImages={8}
                            onImagesChange={setImages}
                            initialImages={images}
                            className="mt-2"
                        />
                    </div>
                </section>

                {/* Price and attributes */}
                <section className="card p-4 sm:p-6 space-y-4">
                    <h2 className="text-lg font-medium">Price & attributes</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm text-gray-600">Price *</span>
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
                            <span className="text-sm text-gray-600">Currency</span>
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
                            <span className="text-sm text-gray-600">Category (optional)</span>
                            {loadingCategories ? (
                                <div className="mt-1 input bg-gray-50 flex items-center justify-center">
                                    <span className="text-gray-500">Loading categories...</span>
                                </div>
                            ) : (
                                <select
                                    className="mt-1 input bg-white"
                                    value={form.categoryId}
                                    onChange={(e) => update("categoryId", e.target.value)}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => {
                                        const parentName = cat.parentId
                                            ? categories.find((p) => p.id === cat.parentId)?.name
                                            : null;
                                        return (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.parentId ? "　　" : ""}
                                                {translateCategoryName(cat.name)}
                                                {cat.parentId && (
                                                    <> ({translateCategoryName(parentName)})</>
                                                )}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </label>

                        {/* Free shipping */}
                        <label className="block">
                            <span className="text-sm text-gray-600">Free shipping</span>
                            <div className="mt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((s) => ({ ...s, freeShipping: !s.freeShipping }))
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        form.freeShipping ? "bg-green-500" : "bg-gray-300"
                                    }`}
                                    aria-pressed={form.freeShipping}
                                    aria-label="Toggle free shipping"
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                            form.freeShipping ? "translate-x-5" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                                <span className="text-sm text-gray-700">
                                    {form.freeShipping
                                        ? "Free shipping (seller covers shipping cost)"
                                        : "Shipping not included (buyer pays shipping)"}
                                </span>
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">Condition *</span>
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

                {/* Submit */}
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={submitting || loading}
                    className="w-full sm:w-40 btn btn-primary"
                >
                    {submitting
                        ? isEditing
                            ? "Updating..."
                            : "Publishing..."
                        : isEditing
                            ? "Update"
                            : "Publish"}
                </button>
            </form>
        </div>
    );
}
