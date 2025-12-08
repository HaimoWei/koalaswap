import { useNavigation } from "@react-navigation/native";
import { useAuth } from "./AuthContext";

export function useRequireAuth() {
    const nav = useNavigation<any>();
    const { token, setPendingAction } = useAuth();
    return (action: () => void) => {
        if (token) { action(); return true; }
        setPendingAction(action);
        nav.navigate("Login");
        return false;
    };
}
