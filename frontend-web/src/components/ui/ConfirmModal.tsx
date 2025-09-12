import { useConfirmStore } from "../../store/overlay";

export function ConfirmModal() {
  const { open, title, message, close } = useConfirmStore();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30">
      <div className="card p-5 w-[92%] max-w-sm">
        {title && <div className="text-lg font-semibold mb-2">{title}</div>}
        {message && <div className="text-sm text-[var(--color-text)] mb-4">{message}</div>}
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={() => close(false)}>取消</button>
          <button className="btn btn-primary" onClick={() => close(true)}>确认</button>
        </div>
      </div>
    </div>
  );
}

