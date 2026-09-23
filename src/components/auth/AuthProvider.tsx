"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    getToken,
    getCurrentUser,
    removeToken,
    setToken,
    type CurrentUser,
} from "@/lib/auth";

import { clearActiveOrganizationId } from "@/lib/organization-context";

import {
    hasPermission as checkPermission,
    type Permission,
} from "@/lib/permissions";

interface AuthContextType {
    user: CurrentUser | null;
    loading: boolean;
    setUser: (user: CurrentUser | null) => void;
    hasPermission: (permission: Permission) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = getToken();

                if (!token) {
                    setUser(null);
                    return;
                }

                const currentUser = await getCurrentUser();

                setUser(currentUser);
            } catch (error) {
                console.error("Failed to load current user:", error);
                removeToken();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const hasPermission = (permission: Permission) => {
        if (!user) {
            return false;
        }

        return checkPermission(user.role, permission);
    };

    const logout = () => {
        removeToken();
        clearActiveOrganizationId();
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                setUser,
                hasPermission,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}