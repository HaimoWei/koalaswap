import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MyProfileRes } from "../api/types";

// AuthStore：保存 token + 当前用户
type AuthState = {
    token: string | null;
    profile: MyProfileRes | null;
    setAuth: (token: string, profile: MyProfileRes) => void;
    clear: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            profile: null,
            setAuth: (token, profile) => set({ token, profile }),
            clear: () => set({ token: null, profile: null }),
        }),
        { name: "koala-auth" } // 存 localStorage
    )
);
