// src/context/AuthContext.tsx
// 功能：全局管理登录 token（启动时恢复、登录时保存、登出时清空）。
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { AuthService } from "../services/auth";

type UserLite = { id: string; email: string; displayName: string } | null;
type Ctx = {
    token: string | null;
    user: UserLite;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    setPendingAction: (fn: (() => void) | null) => void;
    runPendingAction: () => void;
};

const AuthContext = createContext<Ctx>({
    token: null,
    user: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    setPendingAction: () => {},
    runPendingAction: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserLite>(null);
    const [loading, setLoading] = useState(true);
    const pendingRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        (async () => {
            const t = await SecureStore.getItemAsync("access_token");
            const uJson = await SecureStore.getItemAsync("user_json");
            if (t) setToken(t);
            if (uJson) setUser(JSON.parse(uJson));
            setLoading(false);
        })();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await AuthService.login(email, password);
        await SecureStore.setItemAsync("access_token", res.token);
        await SecureStore.setItemAsync("user_json", JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
    };

    const register = async (email: string, password: string, displayName: string) => {
        await AuthService.register(email, password, displayName);
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("user_json");
        setToken(null);
        setUser(null);
    };

    const setPendingAction = (fn: (() => void) | null) => { pendingRef.current = fn; };
    const runPendingAction = () => { pendingRef.current?.(); pendingRef.current = null; };

    return (
        <AuthContext.Provider value={{ token, user, loading, login, register, logout, setPendingAction, runPendingAction }}>
            {children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => useContext(AuthContext);
