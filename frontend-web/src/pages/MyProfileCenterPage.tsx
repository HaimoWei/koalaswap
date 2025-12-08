import { useMemo, useState } from "react";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { listSellerActive } from "../api/products";
import { listUserReviews, type SellerReview } from "../api/reviews";
import { ProductCard } from "../components/ProductCard";
import { Link } from "react-router-dom";

function Avatar({ url, name, size = 64 }: { url?: string | null; name?: string | null; size?: number }) {
  const fb = `https://placehold.co/${size}x${size}?text=%20`;
  return <img src={url || fb} alt={name || 'Avatar'} className="rounded-full border border-[var(--color-border)]" width={size} height={size} />;
}

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value || 0)));
  return <div className="text-orange-500 text-sm" aria-label={`Rating ${value} / 5`}>{"★★★★★☆☆☆☆☆".slice(5 - full, 10 - full)}</div>;
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

  // 计算会员年数
  const memberYears = profile?.memberSince ? Math.floor((new Date().getTime() - new Date(profile.memberSince).getTime()) / (365 * 24 * 60 * 60 * 1000)) : 0;


  return (
    <div className="space-y-6">
      {/* 用户资料预览 */}
      {profile && (
        <div className="card p-6">
          <div className="flex items-start gap-6">
            <Avatar url={profile.avatarUrl} name={profile.displayName || 'Me'} size={80} />
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-xl font-semibold mb-2">{profile.displayName || 'Me'}</div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </div>
                  )}
                  {memberYears > 0 && <span>Member for {memberYears} years</span>}
                </div>
              </div>

              {/* 个人简介 */}
              {profile.bio && (
                <div className="text-gray-700 leading-relaxed">
                  {profile.bio}
                </div>
              )}

              {/* 信誉和统计信息 */}
              <div className="grid grid-cols-2 gap-8 py-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-500">
                    {profile.ratingAvg && profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {profile.ratingCount || 0} reviews
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-500">
                    {productsQ.data?.totalElements || 0}
                  </div>
                  <div className="text-xs text-gray-500">Active listings</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Joined in {profile.memberSince ? new Date(profile.memberSince).getFullYear() : 'Unknown'}
                  </div>
                </div>
              </div>

              {/* 认证信息 */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs text-gray-500">Verification status:</span>
                <div className="flex gap-3">
                  {profile.phoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Phone verified
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Phone not verified</span>
                  )}
                  {profile.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Email verified
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Email not verified</span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to="/me/center/profile"
              className="btn btn-primary text-sm"
            >
              Edit profile
            </Link>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex gap-6 border-b border-[var(--color-border)]">
        <TabBtn active={tab === 'goods'} onClick={() => setTab('goods')}>
          My listings {productsQ.data?.totalElements ? `(${productsQ.data.totalElements})` : ''}
        </TabBtn>
        <TabBtn active={tab === 'reviews'} onClick={() => setTab('reviews')}>
          Reviews received {reviews.length ? `(${reviews.length})` : ''}
        </TabBtn>
      </div>

      {/* Content area */}
      <section>
          {tab === 'goods' ? (
            <div>
              {productsQ.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
                  ))}
                </div>
              ) : (productsQ.data?.content?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <div className="text-gray-500 mb-4">You have not listed any items yet.</div>
                  <Link
                    to="/publish"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    List an item
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productsQ.data!.content.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
              )}
            </div>
          ) : (
            <div>
              {reviewsQ.isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">⭐</div>
                  <div className="text-gray-500">You have not received any reviews yet.</div>
                  <div className="text-sm text-gray-400 mt-2">Reviews will appear here after your transactions are completed.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(({ root, appends }) => (
                    <div key={String(root.id)} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center gap-3">
                        <Avatar url={root.reviewer?.avatarUrl} name={root.reviewer?.displayName} size={36} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {root.reviewer?.displayName ?? (root.anonymous ? 'Anonymous' : String(root.reviewer?.id ?? 'User'))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {root.createdAt ? new Date(root.createdAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <Stars value={root.rating} />
                      </div>
                      {!!root.comment && <p className="text-sm mt-3 text-gray-700 leading-relaxed whitespace-pre-line">{root.comment}</p>}
                      {appends.map((ap) => (
                        <div key={String(ap.id)} className="mt-3 ml-3 bg-orange-50 border-l-4 border-orange-200 rounded-r p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-orange-600 font-medium">Additional review</span>
                            <div className="text-xs text-gray-500">
                              {ap.createdAt ? new Date(ap.createdAt).toLocaleString() : ''}
                            </div>
                          </div>
                          {!!ap.comment && <div className="text-sm text-gray-700 whitespace-pre-line">{ap.comment}</div>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </section>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-1 pb-2 text-sm ${
        active ? "font-semibold text-gray-900" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gray-900 rounded-full" />}
    </button>
  );
}
