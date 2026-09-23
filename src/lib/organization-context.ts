const KEY = "mis_active_organization_id";

export function getActiveOrganizationId(): number | null {
    if (typeof window === "undefined") return null;
    const value = localStorage.getItem(KEY);
    if (!value) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

export function setActiveOrganizationId(id: number): void {
    localStorage.setItem(KEY, String(id));
}

export function clearActiveOrganizationId(): void {
    localStorage.removeItem(KEY);
}
