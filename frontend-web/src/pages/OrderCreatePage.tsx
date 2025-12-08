import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../api/products";
import { createOrder } from "../api/orders";
import { useAuthStore } from "../store/auth";
import { useLocation } from "react-router-dom";
import { AddressSelector } from "../components/AddressSelector";

export function OrderCreatePage() {
    const { id = "" } = useParams<{ id: string }>();
    const nav = useNavigate();
    const loc = useLocation();
    const { token } = useAuthStore();
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");

    const q = useQuery({
        queryKey: ["checkout", id],
        queryFn: () => getProduct(id),
        enabled: !!id,
    });

    const p = q.data;

    async function onConfirm() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }

        if (!selectedAddressId) {
            const { toast } = await import("../store/overlay");
            toast("Please select a delivery address.", "error");
            return;
        }

        try {
            // Create order first
            const order = await createOrder(id, selectedAddressId);
            // Then navigate to the mock payment page
            nav(`/pay/${order.id}`);
        } catch (e: any) {
            // Show error via toast
            const { toast } = await import("../store/overlay");
            toast(e?.message || "Failed to create order.", "error");
        }
    }

    if (q.isLoading) {
        return <main className="max-w-6xl mx-auto p-6">Loading…</main>;
    }
    if (q.isError || !p) {
        return (
            <main className="max-w-6xl mx-auto p-6 text-red-600">
                This item does not exist or is no longer available.
            </main>
        );
    }

    return (
        <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: address + order info */}
            <section className="md:col-span-2 space-y-4">
                <div className="card p-4">
                    <div className="font-medium mb-3">Delivery address</div>
                    <AddressSelector
                        selectedAddressId={selectedAddressId}
                        onAddressChange={setSelectedAddressId}
                    />
                </div>

                <div className="card p-4">
                    <div className="font-medium mb-3">Order details</div>
                    <div className="flex gap-3">
                        <img
                            src={p.images?.[0] || "https://placehold.co/80"}
                            className="w-20 h-20 rounded object-cover border border-[var(--color-border)]"
                        />
                        <div className="flex-1">
                            <div className="text-sm line-clamp-2 mb-1">{p.title}</div>
                            <div className="text-base font-semibold">{formatPrice(p.price, p.currency)}</div>
                            <div className="mt-1 text-xs text-gray-500">Quantity: 1</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Right: totals and confirmation */}
            <aside className="space-y-4">
                <div className="card p-4">
                    <div className="text-sm text-gray-600">Price breakdown</div>
                    <div className="mt-2 flex justify-between">
                        <span className="text-sm">Item total</span>
                        <span>{formatPrice(p.price, p.currency)}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                        <span className="text-sm">Shipping</span>
                        <span>{formatPrice(0, p.currency)}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t font-semibold text-orange-600 flex justify-between">
                        <span>Total:</span>
                        <span>{formatPrice(p.price, p.currency)}</span>
                    </div>
                    <button
                        onClick={onConfirm}
                        className="mt-4 w-full btn btn-primary"
                    >
                        Confirm order and proceed to payment
                    </button>
                </div>
            </aside>
        </main>
    );
}

function formatPrice(n: number, c?: string | null) {
    try {
        if (c === "AUD" || c === "CNY") {
            return new Intl.NumberFormat("en-AU", { style: "currency", currency: c }).format(n);
        }
    } catch {}
    return `$${n.toFixed(2)}`;
}
