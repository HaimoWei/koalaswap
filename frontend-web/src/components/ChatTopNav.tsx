import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { logout } from "../api/auth";

export function ChatTopNav() {
    const { token, profile, clear } = useAuthStore();
    const nav = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try { 
            await logout(); 
        } catch {
            // 忽略退出错误
        }
        clear();
        nav("/");
    };

    const menuItems = [
        {
            icon: "👤",
            label: "个人中心", 
            onClick: () => nav("/me")
        },
        {
            icon: "⚙️",
            label: "账户设置",
            onClick: () => nav("/me")
        },
        {
            icon: "📋",
            label: "我的订单",
            onClick: () => nav("/orders")
        },
        {
            icon: "❤️",
            label: "我的收藏",
            onClick: () => nav("/me/favorites")
        },
        {
            icon: "🏠",
            label: "返回首页",
            onClick: () => nav("/")
        },
        {
            icon: "📤",
            label: "退出登录",
            onClick: handleLogout,
            isLogout: true
        }
    ];

    return (
        <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
                {/* 左侧：品牌Logo */}
                <div className="flex items-center">
                    <div 
                        className="font-bold text-xl text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => nav("/")}
                    >
                        🐨 KoalaSwap
                    </div>
                </div>

                {/* 右侧：用户信息 */}
                {token && profile ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <img 
                                src={profile.avatarUrl || "https://placehold.co/32x32"} 
                                alt={profile.displayName || "用户"}
                                className="w-8 h-8 rounded-full border border-[var(--color-border)]"
                            />
                            <span className="font-medium text-gray-900">
                                {profile.displayName || "用户"}
                            </span>
                            <svg 
                                className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* 下拉菜单 */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-lg shadow-lg border border-[var(--color-border)] py-1 z-50">
                                {menuItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            item.onClick();
                                            setShowDropdown(false);
                                        }}
                                        className={`
                                            w-full text-left px-4 py-3 text-sm transition-colors flex items-center space-x-3
                                            ${item.isLogout 
                                                ? 'text-red-600 hover:bg-red-50' 
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* 未登录状态 - 理论上聊天页面需要登录才能访问，这里作为兜底 */
                    <button 
                        onClick={() => nav(`/login?next=${encodeURIComponent('/chat')}`)}
                        className="btn btn-primary"
                    >
                        去登录
                    </button>
                )}
            </div>
        </header>
    );
}
