import { create } from "zustand";

type UiState = {
    authOpen: boolean;
    openAuth: () => void;
    closeAuth: () => void;
};

export const useUiStore = create<UiState>((set) => ({
    authOpen: false,
    openAuth: () => set({ authOpen: true }),
    closeAuth: () => set({ authOpen: false }),
}));
