import { useEffect, useState } from "react";
import { useConfirmStore } from "../../store/overlay";

export function ConfirmModal() {
  const { open, title, message, close } = useConfirmStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close(false);
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        transition-all duration-200 ease-out
        ${isVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          relative w-[92%] max-w-md mx-4
          bg-white rounded-2xl shadow-2xl
          transition-all duration-300 ease-out
          ${isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95'
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "confirm-title" : undefined}
        aria-describedby={message ? "confirm-message" : undefined}
      >
        {/* 头部 */}
        <div className="px-6 pt-6 pb-4">
          {title && (
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
          )}
          {message && (
            <p id="confirm-message" className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          )}
        </div>

        {/* 按钮区域 */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            onClick={() => close(false)}
          >
            取消
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200 shadow-sm"
            onClick={() => close(true)}
            autoFocus
          >
            确认
          </button>
        </div>

        {/* 关闭按钮（可选） */}
        <button
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          onClick={() => close(false)}
          aria-label="关闭"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}