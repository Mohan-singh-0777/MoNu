import { useAuth } from "@/context/AuthContext";

export function useIsAdmin() {
    const { user } = useAuth();

    if (!user) return false;

    return false;
}