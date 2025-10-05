import { useState } from "react";
import { Icon } from "./Icon";

interface CustomerServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CustomerServiceModal({ isOpen, onClose }: CustomerServiceModalProps) {
    const [copied, setCopied] = useState(false);
    const email = "weihaimoau@gmail.com";

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    const handleEmailClick = () => {
        window.open(`mailto:${email}?subject=KoalaSwap问题反馈`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 弹窗内容 */}
            <div className="relative bg-[var(--color-surface)] rounded-3xl shadow-2xl border border-[var(--color-border)] max-w-md w-full mx-4 overflow-hidden animate-[scale-in_0.3s_ease-out]">
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-[var(--color-muted)] transition-colors"
                    aria-label="关闭"
                >
                    <Icon name="close" size={20} className="text-gray-500" />
                </button>

                {/* 头部装饰 */}
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] h-2"></div>

                {/* 内容区域 */}
                <div className="p-8 text-center">
                    {/* 图标 */}
                    <div className="mb-6">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-300)] rounded-full flex items-center justify-center shadow-lg">
                            <Icon name="support" size={32} className="text-[var(--color-text-strong)]" />
                        </div>
                    </div>

                    {/* 标题 */}
                    <h2 className="text-2xl font-bold text-[var(--color-text-strong)] mb-3">
                        联系客服
                    </h2>

                    {/* 描述 */}
                    <p className="text-[var(--color-text)] mb-6 leading-relaxed">
                        遇到问题了？别担心！<br />
                        请发送邮件告诉我们，我们会尽快回复您
                    </p>

                    {/* 邮箱信息 */}
                    <div className="bg-[var(--color-muted)] rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <span className="text-sm text-[var(--color-text)] font-medium">客服邮箱</span>
                        </div>
                        <div className="text-lg font-mono text-[var(--color-text-strong)] break-all">
                            {email}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCopyEmail}
                            className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] py-3 px-4 rounded-xl font-medium hover:bg-[var(--color-muted)] hover:border-[var(--color-primary-300)] transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Icon name={copied ? "star" : "support"} size={16} />
                            {copied ? "已复制!" : "复制邮箱"}
                        </button>
                        <button
                            onClick={handleEmailClick}
                            className="flex-1 bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-300)] text-[var(--color-text-strong)] py-3 px-4 rounded-xl font-medium hover:from-[var(--color-primary-600)] hover:to-[var(--color-primary)] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Icon name="send" size={16} />
                            发送邮件
                        </button>
                    </div>

                    {/* 底部提示 */}
                    <div className="mt-6 text-xs text-gray-500">
                        💡 建议详细描述问题，并附上截图，方便我们快速定位
                    </div>
                </div>
            </div>

        </div>
    );
}