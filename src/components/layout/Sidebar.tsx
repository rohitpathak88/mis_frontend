"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Permission } from "@/lib/permissions";

interface MenuItem {
    label: string;
    href: string;
    permission: Permission;
    icon: React.ReactNode;
}

function DashboardIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function MisIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M7 16l3-4 3 2 5-7" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 16V4" />
            <path d="M7 9l5-5 5 5" />
            <path d="M4 20h16" />
        </svg>
    );
}

function PayoutIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M7 12h10" />
            <path d="M8 9h.01M16 15h.01" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function OrganizationIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="8.5" y="14" width="7" height="7" rx="1" />
            <path d="M6.5 10v2h11v-2" />
            <path d="M12 12v2" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </svg>
    );
}

export default function Sidebar() {
    const pathname = usePathname();

    const {
        user,
        loading,
        hasPermission,
        logout
    } = useAuth();

    const menuItems: MenuItem[] = [
        {
            label: "Dashboard",
            href: "/dashboard",
            permission: "dashboard.view",
            icon: <DashboardIcon />
        },
        {
            label: "MIS Data",
            href: "/mis",
            permission: "mis.view",
            icon: <MisIcon />
        },
        {
            label: "Import MIS",
            href: "/mis/import",
            permission: "mis.import",
            icon: <UploadIcon />
        },
        {
            label: "Payout",
            href: "/payout",
            permission: "payout.view",
            icon: <PayoutIcon />
        },
        {
            label: "Users",
            href: "/users",
            permission: "users.view",
            icon: <UsersIcon />
        },
        {
            label: "Organizations",
            href: "/organizations",
            permission: "organization.manage",
            icon: <OrganizationIcon />
        },
        {
            label: "Organization",
            href: "/organization",
            permission: "organization.manage",
            icon: <OrganizationIcon />
        }
    ];

    const visibleMenuItems = menuItems.filter((item) => {
        if (!hasPermission(item.permission)) return false;
        if (item.href === "/organizations") return user?.role === "SUPER_ADMIN";
        if (item.href === "/organization") return user?.role !== "SUPER_ADMIN";
        return true;
    });

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }

        return (
            pathname === href ||
            pathname.startsWith(`${href}/`)
        );
    };

    if (loading) {
        return (
            <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white">
                <div className="flex h-16 items-center border-b border-gray-200 px-6">
                    <span className="text-lg font-bold text-gray-900">
                        MIS Platform
                    </span>
                </div>

                <div className="p-6 text-sm text-gray-500">
                    Loading...
                </div>
            </aside>
        );
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white">

            {/* Logo */}

            <div className="flex h-16 items-center border-b border-gray-200 px-6">
                <Link
                    href="/dashboard"
                    className="text-lg font-bold text-gray-900"
                >
                    MIS Platform
                </Link>
            </div>

            {/* Navigation */}

            <nav className="flex-1 overflow-y-auto px-3 py-5">

                <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Main
                </div>

                <div className="space-y-1">

                    {visibleMenuItems.map((item) => {
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                                    active
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                <span
                                    className={
                                        active
                                            ? "text-blue-600"
                                            : "text-gray-400"
                                    }
                                >
                                    {item.icon}
                                </span>

                                <span>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                </div>
            </nav>

            {/* User section */}

            <div className="border-t border-gray-200 p-3">

                <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {user?.name
                            ? user.name.charAt(0).toUpperCase()
                            : "U"}
                    </div>

                    <div className="min-w-0 flex-1">

                        <div className="truncate text-sm font-medium text-gray-900">
                            {user?.name || "User"}
                        </div>

                        <div className="truncate text-xs text-gray-500">
                            {user?.role || ""}
                        </div>

                    </div>

                </div>

                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                    <LogoutIcon />

                    <span>
                        Logout
                    </span>
                </button>

            </div>

        </aside>
    );
}