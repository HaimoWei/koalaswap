import type { PublicUser } from "../api/users";

interface UserProfileCardProps {
  user: PublicUser;
  mode?: "view" | "preview";  // view: view others, preview: preview self
  className?: string;
}

export function UserProfileCard({ user, mode = "view", className = "" }: UserProfileCardProps) {
  // Calculate membership years
  const memberYears = user.memberSince ?
    Math.floor((new Date().getTime() - new Date(user.memberSince).getTime()) / (365 * 24 * 60 * 60 * 1000)) : 0;

  // Format last active time
  const formatLastActive = (lastActiveAt?: string) => {
    if (!lastActiveAt) return "Last active: unknown";
    const now = Date.now();
    const lastActive = new Date(lastActiveAt).getTime();
    const diff = now - lastActive;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Last active: just now";
    if (minutes < 60) return `Last active: ${minutes} minutes ago`;
    if (hours < 24) return `Last active: ${hours} hours ago`;
    if (days < 7) return `Last active: ${days} days ago`;
    if (days < 30) return `Last active: ${days} days ago`;

    const date = new Date(lastActiveAt);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `Last active: ${month}/${day}`;
  };

  return (
    <div className={`card p-6 ${className}`}>
      {/* Compact top section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <img
            src={user.avatarUrl || "https://placehold.co/80x80"}
            alt={user.displayName ? `${user.displayName}'s avatar` : "User avatar"}
            className="w-16 h-16 rounded-full border-2 border-orange-200 object-cover"
          />
          {/* Verification badge */}
          {(user.phoneVerified || user.emailVerified) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1">
          {/* Display name and basic info */}
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
            <span>
              {memberYears > 0 ? `Member for ${memberYears} year${memberYears > 1 ? "s" : ""}` : "New member"}
            </span>
          </div>
        </div>
      </div>

      {/* Reputation summary */}
      {user.ratingAvg && user.ratingCount ? (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-orange-500 text-base">★</span>
          <span className="font-semibold text-gray-900">
            {user.ratingAvg.toFixed(1)}
          </span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-600 text-sm">{user.ratingCount} reviews</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-600 text-sm">{formatLastActive(user.lastActiveAt)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3 text-gray-500">
          <span className="text-orange-300 text-base">★</span>
          <span className="text-sm">No reviews yet</span>
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <div className="mb-4">
          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
            {user.bio}
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Verification status */}
          {user.phoneVerified && (
            <span className="inline-flex items-center gap-1 text-green-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Phone verified
            </span>
          )}
          {user.emailVerified && (
            <span className="inline-flex items-center gap-1 text-blue-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Email verified
            </span>
          )}
        </div>

        {/* Trade stats */}
        {user.stats && (
          <div className="flex items-center gap-3">
            {user.stats.totalSold !== undefined && (
              <span>Sold {user.stats.totalSold}</span>
            )}
            {user.stats.totalListings !== undefined && (
              <span>Active listings {user.stats.totalListings}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
