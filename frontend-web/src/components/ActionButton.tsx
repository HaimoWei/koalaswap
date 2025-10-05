import { Icon } from "./Icon";

interface ActionButtonProps {
    icon: "plus" | "chat" | "support" | "search" | "send" | "heart" | "trash" | "hide" | "relist" | "back" | "close" | "star" | "bell";
    label: string;
    variant?: "primary" | "secondary";
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

export function ActionButton({
    icon,
    label,
    variant = "secondary",
    onClick,
    className = "",
    disabled = false
}: ActionButtonProps) {
    const baseClasses = "group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 shadow-lg border backdrop-blur-sm min-w-[64px] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";

    const variantClasses = {
        primary: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] text-[var(--color-text-strong)] border-[var(--color-primary-300)] shadow-yellow-500/25 hover:shadow-yellow-500/40",
        secondary: "bg-[var(--color-surface)] hover:bg-[var(--color-muted)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-secondary-300)] hover:shadow-xl"
    };

    const iconClasses = {
        primary: "text-[var(--color-text-strong)]",
        secondary: "text-[var(--color-secondary)] group-hover:text-[var(--color-secondary-700)]"
    };

    const labelClasses = {
        primary: "text-[var(--color-text-strong)]",
        secondary: "text-[var(--color-text)] group-hover:text-[var(--color-secondary-700)]"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            aria-label={label}
            title={label}
        >
            <div className={`transition-colors duration-200 ${iconClasses[variant]}`}>
                <Icon name={icon} size={24} />
            </div>
            <span className={`text-xs font-medium transition-colors duration-200 ${labelClasses[variant]}`}>
                {label}
            </span>
        </button>
    );
}