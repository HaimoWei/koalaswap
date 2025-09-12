import { useMemo, useState } from "react";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { listSellerActive } from "../api/products";
import { listUserReviews, type SellerReview } from "../api/reviews";
import { ProductCard } from "../components/ProductCard";

function Avatar({ url, name, size = 64 }: { url?: string | null; name?: string | null; size?: number }) {
  const fb = `https://placehold.co/${size}x${size}?text=%20`;
  return <img src={url || fb} alt={name || '头像'} className="rounded-full border border-[var(--color-border)]" width={size} height={size} />;
}

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value || 0)));
  return <div className="text-orange-500 text-sm" aria-label={`评分 ${value} / 5`}>{"★★★★★☆☆☆☆☆".slice(5 - full, 10 - full)}</div>;
}

function groupReviews(list: SellerReview[]) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((r) => ({
    root: r,
    appends: Array.isArray(r.appends)
      ? [...r.appends].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      : [],
  }));
}

export default function MyProfileCenterPage() {
  const profile = useAuthStore((s) => s.profile);
  const myId = profile?.id || "";
  const [tab, setTab] = useState<'goods' | 'reviews'>('goods');

  const productsQ = useQuery({
    queryKey: ["myCenterProducts", myId],
    queryFn: () => listSellerActive(myId, { page: 0, size: 12 }),
    enabled: !!myId,
  });
  const reviewsQ = useQuery({
    queryKey: ["myCenterReviews", myId],
    queryFn: () => listUserReviews(myId, { page: 0, size: 10, role: "all", withAppends: true }),
    enabled: !!myId,
  });

  const reviews = useMemo(() => groupReviews((reviewsQ.data?.content ?? []) as SellerReview[]), [reviewsQ.data]);

  return (
    <div className="space-y-4">
      {/* 右侧顶部个人信息头卡（不含“编辑资料”） */}
      <div className="card p-4 flex items-center gap-4">
        <Avatar url={profile?.avatarUrl} name={profile?.displayName} />
        <div className="flex-1">
          <div className="text-lg font-semibold">{profile?.displayName || '我'}</div>
          <div className="text-xs text-gray-600">{profile?.id}</div>
        </div>
      </div>

      {/* Tabs: 宝贝 / 评价 */}
      <div className="border-b border-[var(--color-border)]">
        <button className={`relative px-2 pb-2 text-sm ${tab === 'goods' ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setTab('goods')}>宝贝</button>
        <button className={`relative px-2 pb-2 text-sm ${tab === 'reviews' ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setTab('reviews')}>评价</button>
      </div>

      {tab === 'goods' ? (
        <div>
          {productsQ.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
            </div>
          ) : (productsQ.data?.content?.length ?? 0) === 0 ? (
            <div className="text-sm text-gray-600">暂无在售宝贝</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsQ.data!.content.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviewsQ.isLoading ? (
            <div>加载中…</div>
          ) : reviews.length === 0 ? (
            <div className="text-sm text-gray-600">暂无评价</div>
          ) : (
            <ul className="space-y-4">
              {reviews.map(({ root, appends }) => (
                <li key={String(root.id)} className="card p-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={root.reviewer?.avatarUrl} name={root.reviewer?.displayName} size={36} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{root.reviewer?.displayName ?? (root.anonymous ? '匿名' : String(root.reviewer?.id ?? '用户'))}</div>
                      <div className="text-xs text-gray-500">{root.createdAt ? new Date(root.createdAt).toLocaleString() : ''}</div>
                    </div>
                    <Stars value={root.rating} />
                  </div>
                  {!!root.comment && <p className="text-sm mt-2 whitespace-pre-line">{root.comment}</p>}
                  {appends.map((ap) => (
                    <div key={String(ap.id)} className="mt-3 ml-3 bg-[var(--color-muted)] border border-[var(--color-border)] rounded p-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">追评</span>
                        <div className="text-xs text-gray-500">{ap.createdAt ? new Date(ap.createdAt).toLocaleString() : ''}</div>
                      </div>
                      {!!ap.comment && <div className="text-sm whitespace-pre-line">{ap.comment}</div>}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

