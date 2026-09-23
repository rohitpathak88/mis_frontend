"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Pencil,
    UserCheck,
    UserX,
    Users as UsersIcon
} from "lucide-react";
import PermissionGuard from "@/components/auth/PermissionGuard";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import type { User, Role } from "@/types/user";

interface UsersResponse {
    success: boolean;
    data: User[];
}

interface RolesResponse {
    success: boolean;
    data: Role[];
}

export default function UsersPage() {

    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadUsers() {

        try {

            setLoading(true);
            setError("");

            const response =
                await apiFetch<UsersResponse>("/api/users");

            setUsers(response.data || []);

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load users"
            );

        } finally {

            setLoading(false);
        }
    }

    async function loadRoles() {

        try {

            const response =
                await apiFetch<RolesResponse>("/api/users/roles");

            setRoles(response.data || []);

        } catch (err) {

            console.error("Failed to load roles:", err);
        }
    }

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    async function updateStatus(
        userId: number,
        status: "ACTIVE" | "INACTIVE"
    ) {

        const action =
            status === "ACTIVE"
                ? "activate"
                : "deactivate";

        if (
            !window.confirm(
                `Are you sure you want to ${action} this user?`
            )
        ) {
            return;
        }

        try {

            await apiFetch(
                `/api/users/${userId}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status
                    })
                }
            );

            await loadUsers();

        } catch (err) {

            alert(
                err instanceof Error
                    ? err.message
                    : "Failed to update user"
            );
        }
    }

    const filteredUsers = useMemo(() => {

        const query = search
            .trim()
            .toLowerCase();

        return users.filter((user) => {

            const matchesSearch =
                !query ||
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query);

            const matchesRole =
                !roleFilter ||
                user.role?.name === roleFilter;

            const matchesStatus =
                !statusFilter ||
                user.status === statusFilter;

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        });

    }, [
        users,
        search,
        roleFilter,
        statusFilter
    ]);

    return (

        <PermissionGuard permission="users.view">

        <div className="min-h-screen bg-slate-50">

            <Header
                title="Users"
                subtitle="Manage organization users and access"
            />

            <main className="p-6">

                <div className="mb-6 flex items-center justify-between">

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Users
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage users, roles and account status.
                        </p>
                    </div>

                    <Link
                        href="/users/new"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        <Plus size={18} />
                        Add User
                    </Link>

                </div>

                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="relative">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
                        />

                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(e.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                    >
                        <option value="">
                            All Roles
                        </option>

                        {roles.map((role) => (
                            <option
                                key={role.id}
                                value={role.name}
                            >
                                {role.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                    >
                        <option value="">
                            All Status
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="INACTIVE">
                            Inactive
                        </option>
                    </select>

                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    {loading ? (

                        <div className="flex min-h-[300px] items-center justify-center">
                            <p className="text-sm text-slate-500">
                                Loading users...
                            </p>
                        </div>

                    ) : error ? (

                        <div className="p-8 text-center">
                            <p className="text-sm text-red-600">
                                {error}
                            </p>
                        </div>

                    ) : filteredUsers.length === 0 ? (

                        <div className="flex min-h-[300px] flex-col items-center justify-center">

                            <UsersIcon
                                size={42}
                                className="mb-3 text-slate-300"
                            />

                            <p className="font-medium text-slate-700">
                                No users found
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                Try changing your filters or add a new user.
                            </p>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full text-left text-sm">

                                <thead className="border-b border-slate-200 bg-slate-50">

                                    <tr>
                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            User
                                        </th>

                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            Role
                                        </th>

                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            Last Login
                                        </th>

                                        <th className="px-5 py-3 text-right font-semibold text-slate-600">
                                            Actions
                                        </th>
                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredUsers.map((user) => (

                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-50"
                                        >

                                            <td className="px-5 py-4">

                                                <div className="font-medium text-slate-900">
                                                    {user.name}
                                                </div>

                                                <div className="mt-0.5 text-xs text-slate-500">
                                                    {user.email}
                                                </div>

                                            </td>

                                            <td className="px-5 py-4">

                                                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                    {user.role?.name || "-"}
                                                </span>

                                            </td>

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        user.status === "ACTIVE"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-red-50 text-red-700"
                                                    }`}
                                                >
                                                    {user.status}
                                                </span>

                                            </td>

                                            <td className="px-5 py-4 text-slate-500">

                                                {user.lastLoginAt
                                                    ? new Date(
                                                          user.lastLoginAt
                                                      ).toLocaleString()
                                                    : "Never"}

                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <Link
                                                        href={`/users/${user.id}`}
                                                        title="Edit user"
                                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                    >
                                                        <Pencil size={17} />
                                                    </Link>

                                                    {user.status === "ACTIVE" ? (

                                                        <button
                                                            onClick={() =>
                                                                updateStatus(
                                                                    user.id,
                                                                    "INACTIVE"
                                                                )
                                                            }
                                                            title="Deactivate"
                                                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <UserX size={17} />
                                                        </button>

                                                    ) : (

                                                        <button
                                                            onClick={() =>
                                                                updateStatus(
                                                                    user.id,
                                                                    "ACTIVE"
                                                                )
                                                            }
                                                            title="Activate"
                                                            className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                                                        >
                                                            <UserCheck size={17} />
                                                        </button>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

            </main>

        </div>
        </PermissionGuard>
    );
}