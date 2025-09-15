import type { PublicUser } from "../api/users";

interface UserProfileCardProps {
  user: PublicUser;
  mode?: "view" | "preview";  // view: 查看别人, preview: 预览自己
  className?: string;
}

export function UserProfileCard({ user, mode = "view", className = "" }: UserProfileCardProps) {
  // 计算注册时长
  const memberYears = user.memberSince ?
    Math.floor((new Date().getTime() - new Date(user.memberSince).getTime()) / (365 * 24 * 60 * 60 * 1000)) : 0;

  // 格式化最后活跃时间
  const formatLastActive = (lastActiveAt?: string) => {
    if (!lastActiveAt) return "未知";
    const diff = Date.now() - new Date(lastActiveAt).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 30) return "刚刚活跃";
    if (hours < 24) return `${hours}小时前活跃`;
    if (days < 7) return `${days}天前活跃`;

    // 使用原生JavaScript格式化日期
    const date = new Date(lastActiveAt);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日活跃`;
  };

  return (
    <div className={`card p-6 ${className}`}>
      {/* 简洁的顶部区域 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <img
            src={user.avatarUrl || "https://placehold.co/80x80"}
            alt={`${user.displayName}的头像`}
            className="w-16 h-16 rounded-full border-2 border-orange-200 object-cover"
          />
          {/* 认证徽章 */}
          {(user.phoneVerified || user.emailVerified) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1">
          {/* 昵称和基本信息 */}
          <h1 className="text-lg font-semibold text-gray-900">{user.displayName}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
            {user.location && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user.location}
              </div>
            )}
            <span>•</span>
            <span>会员{memberYears > 0 ? `${memberYears}年` : "新手"}</span>
          </div>
        </div>
      </div>

      {/* 简洁的信誉展示 */}
      {user.ratingAvg && user.ratingCount ? (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-orange-500 text-base">★</span>
          <span className="font-semibold text-gray-900">
            {user.ratingAvg.toFixed(1)}
          </span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-600 text-sm">{user.ratingCount}条评价</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-600 text-sm">{formatLastActive(user.lastActiveAt)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3 text-gray-500">
          <span className="text-orange-300 text-base">★</span>
          <span className="text-sm">暂无评价</span>
        </div>
      )}

      {/* 个人简介 */}
      {user.bio && (
        <div className="mb-4">
          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
            {user.bio}
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* 认证状态 */}
          {user.phoneVerified && (
            <span className="inline-flex items-center gap-1 text-green-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              手机认证
            </span>
          )}
          {user.emailVerified && (
            <span className="inline-flex items-center gap-1 text-blue-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              邮箱认证
            </span>
          )}
        </div>

        {/* 交易统计 */}
        {user.stats && (
          <div className="flex items-center gap-3">
            {user.stats.totalSold !== undefined && (
              <span>已售 {user.stats.totalSold}</span>
            )}
            {user.stats.totalListings !== undefined && (
              <span>在售 {user.stats.totalListings}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}