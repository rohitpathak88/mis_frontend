"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Eye,
    EyeOff
} from "lucide-react";
import PermissionGuard from "@/components/auth/PermissionGuard";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import type { Role, User } from "@/types/user";

interface UserResponse {
    success: boolean;
    data: User;
}

interface RolesResponse {
    success: boolean;
    data: Role[];
}

export default function EditUserPage() {

    const params = useParams();
    const router = useRouter();

    const userId = params.id;

    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {

        async function loadData() {

            try {

                const [
                    userResponse,
                    rolesResponse
                ] = await Promise.all([
                    apiFetch<UserResponse>(
                        `/api/users/${userId}`
                    ),
                    apiFetch<RolesResponse>(
                        "/api/users/roles"
                    )
                ]);

                const currentUser =
                    userResponse.data;

                setUser(currentUser);
                setRoles(rolesResponse.data || []);

                setName(currentUser.name);
                setEmail(currentUser.email);
                setRoleId(
                    String(currentUser.role.id)
                );

            } catch (err) {

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load user"
                );

            } finally {

                setLoading(false);
            }
        }

        if (userId) {
            loadData();
        }

    }, [userId]);

    async function handleSave(
        e: React.FormEvent
    ) {

        e.preventDefault();

        setError("");
        setSuccess("");

        try {

            setSaving(true);

            const response =
                await apiFetch<UserResponse>(
                    `/api/users/${userId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            name,
                            email,
                            roleId: Number(roleId)
                        })
                    }
                );

            setUser(response.data);

            setSuccess(
                "User details updated successfully."
            );

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update user"
            );

        } finally {

            setSaving(false);
        }
    }

    async function updateStatus() {

        if (!user) return;

        const newStatus =
            user.status === "ACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        if (
            !window.confirm(
                `Are you sure you want to ${newStatus === "ACTIVE"
                    ? "activate"
                    : "deactivate"
                } this user?`
            )
        ) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            const response =
                await apiFetch<UserResponse>(
                    `/api/users/${userId}/status`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            status: newStatus
                        })
                    }
                );

            setUser(response.data);

            setSuccess(
                `User ${newStatus === "ACTIVE"
                    ? "activated"
                    : "deactivated"
                } successfully.`
            );

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update status"
            );
        }
    }

    async function handlePasswordUpdate(
        e: React.FormEvent
    ) {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters"
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {

            setPasswordSaving(true);

            await apiFetch(
                `/api/users/${userId}/password`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        password
                    })
                }
            );

            setPassword("");
            setConfirmPassword("");

            setSuccess(
                "Password updated successfully."
            );

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update password"
            );

        } finally {

            setPasswordSaving(false);
        }
    }

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-50">
                <Header
                    title="Edit User"
                    subtitle="Manage user account"
                />

                <main className="p-6">
                    <div className="flex min-h-[300px] items-center justify-center">
                        <p className="text-sm text-slate-500">
                            Loading user...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (

        <PermissionGuard permission="users.manage">
            <div className="min-h-screen bg-slate-50">

                <Header
                    title="Edit User"
                    subtitle="Manage user account and access"
                />

                <main className="p-6">

                    <Link
                        href="/users"
                        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft size={16} />
                        Back to Users
                    </Link>

                    <div className="mx-auto max-w-3xl space-y-6">

                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {success}
                            </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                                <div>
                                    <h1 className="text-lg font-semibold text-slate-900">
                                        User Details
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Update profile and role information.
                                    </p>
                                </div>

                                {user && (
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === "ACTIVE"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-red-50 text-red-700"
                                            }`}
                                    >
                                        {user.status}
                                    </span>
                                )}

                            </div>

                            <form
                                onSubmit={handleSave}
                                className="space-y-5 p-6"
                            >

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Full Name
                                    </label>

                                    <input
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Role
                                    </label>

                                    <select
                                        value={roleId}
                                        onChange={(e) =>
                                            setRoleId(e.target.value)
                                        }
                                        required
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                    >
                                        {roles.map((role) => (
                                            <option
                                                key={role.id}
                                                value={role.id}
                                            >
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-between border-t border-slate-100 pt-5">

                                    <button
                                        type="button"
                                        onClick={updateStatus}
                                        className={`rounded-lg px-4 py-2.5 text-sm font-medium ${user?.status === "ACTIVE"
                                                ? "border border-red-200 text-red-600 hover:bg-red-50"
                                                : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                            }`}
                                    >
                                        {user?.status === "ACTIVE"
                                            ? "Deactivate User"
                                            : "Activate User"}
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>

                                </div>

                            </form>

                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-6 py-5">

                                <h2 className="text-lg font-semibold text-slate-900">
                                    Reset Password
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Set a new password for this user.
                                </p>

                            </div>

                            <form
                                onSubmit={handlePasswordUpdate}
                                className="space-y-5 p-6"
                            >

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        New Password
                                    </label>

                                    <div className="relative">

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            minLength={8}
                                            required
                                            placeholder="Minimum 8 characters"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-slate-400"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    !showPassword
                                                )
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            {showPassword
                                                ? <EyeOff size={17} />
                                                : <Eye size={17} />}
                                        </button>

                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Confirm New Password
                                    </label>

                                    <div className="relative">

                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            minLength={8}
                                            required
                                            placeholder="Confirm password"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-slate-400"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            {showConfirmPassword
                                                ? <EyeOff size={17} />
                                                : <Eye size={17} />}
                                        </button>

                                    </div>
                                </div>

                                <div className="flex justify-end">

                                    <button
                                        type="submit"
                                        disabled={passwordSaving}
                                        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {passwordSaving
                                            ? "Updating..."
                                            : "Update Password"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </main>

            </div>
        </PermissionGuard>
    );
}