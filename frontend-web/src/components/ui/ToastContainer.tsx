import { useEffect } from "react";
import { useToastStore } from "../../store/overlay";

export function ToastContainer() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);
  useEffect(() => {}, [items]);
  const cls = (t?: string) => {
    switch (t) {
      case "success": return "bg-[var(--success-bg)] text-[var(--success)] border-l-4 border-[var(--success)]";
      case "error": return "bg-[var(--error-bg)] text-[var(--error)] border-l-4 border-[var(--error)]";
      case "warning": return "bg-[var(--warning-bg)] text-[var(--warning)] border-l-4 border-[var(--warning)]";
      default: return "bg-[var(--info-bg)] text-[var(--color-text)] border-l-4 border-[var(--info)]";
    }
  };
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[1000] space-y-2 w-[92%] sm:w-auto">
      {items.map((it) => (
        <div key={it.id} className={`px-4 py-2 rounded-lg shadow-[var(--shadow-2)] border ${cls(it.type)}`} role="status">
          <div className="flex items-center gap-3">
            <div className="text-sm">{it.message}</div>
            <button className="ml-auto text-xs underline" onClick={() => remove(it.id)}>关闭</button>
          </div>
        </div>
      ))}
    </div>
  );
}

