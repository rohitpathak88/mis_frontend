export type UserRole =
    | "SUPER_ADMIN"
    | "ORG_ADMIN"
    | "MANAGEMENT"
    | "DEPARTMENT_HEAD"
    | "TEAM_LEADER"
    | "MIS_USER"
    | "VIEWER";

export type Permission =
    | "dashboard.view"
    | "mis.view"
    | "mis.import"
    | "users.view"
    | "users.manage"
    | "organization.manage"
    | "payout.view"
    | "payout.manage"
    | "reports.view";


const rolePermissions: Record<
    UserRole,
    Permission[]
> = {

    SUPER_ADMIN: [
        "dashboard.view",
        "mis.view",
        "mis.import",
        "users.view",
        "users.manage",
        "organization.manage",
        "payout.view",
        "payout.manage",
        "reports.view"
    ],

    ORG_ADMIN: [
        "dashboard.view",
        "mis.view",
        "mis.import",
        "users.view",
        "users.manage",
        "organization.manage",
        "payout.view",
        "payout.manage",
        "reports.view"
    ],

    MANAGEMENT: [
        "dashboard.view",
        "mis.view",
        "payout.view"
    ],

    DEPARTMENT_HEAD: [
        "dashboard.view",
        "mis.view",
        "mis.import",
        "payout.view"
    ],

    TEAM_LEADER: [
        "dashboard.view",
        "mis.view",
        "mis.import",
        "payout.view"
    ],

    MIS_USER: [
        "dashboard.view",
        "mis.view",
        "payout.view"
    ],

    VIEWER: [
        "dashboard.view",
        "mis.view",
        "payout.view"
    ]
};


export function hasPermission(
    role: UserRole | null | undefined,
    permission: Permission
): boolean {

    if (!role) {
        return false;
    }

    return (
        rolePermissions[role]?.includes(
            permission
        ) ?? false
    );
}


export function hasAnyPermission(
    role: UserRole | null | undefined,
    permissions: Permission[]
): boolean {

    return permissions.some(
        (permission) =>
            hasPermission(role, permission)
    );
}


export function hasAllPermissions(
    role: UserRole | null | undefined,
    permissions: Permission[]
): boolean {

    return permissions.every(
        (permission) =>
            hasPermission(role, permission)
    );
}