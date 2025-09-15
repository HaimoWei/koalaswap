import { create } from "zustand";

export type ToastItem = { id: number; type?: "success" | "error" | "info" | "warning"; message: string; timeout?: number };

type ToastState = {
  items: ToastItem[];
  add: (t: Omit<ToastItem, "id">) => number;
  remove: (id: number) => void;
}

let seq = 1;
export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  add: (t) => {
    const id = seq++;
    const item: ToastItem = { id, timeout: 3000, ...t };
    set((s) => ({ items: [...s.items, item] }));
    if (item.timeout && item.timeout > 0) setTimeout(() => get().remove(id), item.timeout);
    return id;
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function toast(message: string, type: ToastItem["type"] = "info", timeout = 3000) {
  return useToastStore.getState().add({ message, type, timeout });
}

// 便捷方法
export const toastSuccess = (message: string, timeout = 3000) => toast(message, "success", timeout);
export const toastError = (message: string, timeout = 4000) => toast(message, "error", timeout);
export const toastWarning = (message: string, timeout = 3500) => toast(message, "warning", timeout);
export const toastInfo = (message: string, timeout = 3000) => toast(message, "info", timeout);

type ConfirmState = {
  open: boolean;
  title?: string;
  message?: string;
  resolve?: (v: boolean) => void;
  ask: (title: string, message?: string) => Promise<boolean>;
  close: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  title: undefined,
  message: undefined,
  resolve: undefined,
  ask: (title, message) => new Promise<boolean>((resolve) => set({ open: true, title, message, resolve })),
  close: (ok) => {
    const res = get().resolve;
    set({ open: false, title: undefined, message: undefined, resolve: undefined });
    try { res?.(ok); } catch {}
  },
}));

export function confirm(title: string, message?: string) {
  return useConfirmStore.getState().ask(title, message);
}

