import { apiFetch } from "./api";
import type { UserRole } from "./permissions";

export interface CurrentUser {
    id: number;
    name: string;
    email: string;
    organizationId: number;
    role: UserRole;

    department: {
        id: number;
        name: string;
        code: string | null;
    } | null;

    team: {
        id: number;
        name: string;
        code: string | null;
    } | null;
}

export function getToken(): string | null {

    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("mis_token");
}


export function setToken(token: string): void {

    localStorage.setItem(
        "mis_token",
        token
    );
}


export function removeToken(): void {

    localStorage.removeItem(
        "mis_token"
    );
}


export function isAuthenticated(): boolean {

    return !!getToken();
}


export async function getCurrentUser(): Promise<CurrentUser> {

    const response =
        await apiFetch<{
            success: boolean;
            data: CurrentUser;
        }>("/api/auth/me");

    return response.data;
}