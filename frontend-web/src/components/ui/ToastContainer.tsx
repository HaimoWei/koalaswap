import { useEffect, useState } from "react";
import { useToastStore, type ToastItem } from "../../store/overlay";

// 图标组件
function ToastIcon({ type }: { type?: ToastItem["type"] }) {
  const baseClasses = "w-5 h-5 flex-shrink-0";

  switch (type) {
    case "success":
      return (
        <svg className={`${baseClasses} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    case "error":
      return (
        <svg className={`${baseClasses} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    case "warning":
      return (
        <svg className={`${baseClasses} text-yellow-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg className={`${baseClasses} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
  }
}

// 单个Toast项组件
function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(item.id), 200); // 动画持续时间
  };

  const getColorClasses = (type?: ToastItem["type"]) => {
    switch (type) {
      case "success":
        return "bg-white border border-green-200 shadow-green-100/50";
      case "error":
        return "bg-white border border-red-200 shadow-red-100/50";
      case "warning":
        return "bg-white border border-yellow-200 shadow-yellow-100/50";
      case "info":
      default:
        return "bg-white border border-blue-200 shadow-blue-100/50";
    }
  };

  return (
    <div
      className={`
        relative max-w-sm w-full rounded-xl p-4 transition-all duration-300 ease-out
        ${getColorClasses(item.type)}
        shadow-lg backdrop-blur-sm
        ${isVisible && !isLeaving
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95'
        }
        ${isLeaving ? 'opacity-0 -translate-y-2 scale-95' : ''}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <ToastIcon type={item.type} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-5">
            {item.message}
          </p>
        </div>

        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          aria-label="关闭通知"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* 进度条（可选） */}
      {item.timeout && item.timeout > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
          <div
            className={`h-full transition-all ease-linear ${
              item.type === 'success' ? 'bg-green-400' :
              item.type === 'error' ? 'bg-red-400' :
              item.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
            }`}
            style={{
              width: '100%',
              animation: `shrink ${item.timeout}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);

  if (items.length === 0) return null;

  return (
    <>
      {/* CSS动画定义 */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Toast容器 */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
        <div className="flex flex-col items-end space-y-3 pointer-events-auto">
          {items.map((item) => (
            <ToastItem
              key={item.id}
              item={item}
              onRemove={remove}
            />
          ))}
        </div>
      </div>
    </>
  );
}