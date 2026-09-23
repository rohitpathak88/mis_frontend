"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import type { Role } from "@/types/user";
import PermissionGuard from "@/components/auth/PermissionGuard";

interface RolesResponse {
    success: boolean;
    data: Role[];
}

interface Department {
    id: number;
    name: string;
    code?: string | null;
    status?: string;
}

interface Team {
    id: number;
    name: string;
    code?: string | null;
    departmentId?: number;
    department_id?: number;
    status?: string;
}

interface DepartmentsResponse {
    success: boolean;
    data: Department[];
}

interface TeamsResponse {
    success: boolean;
    data: Team[];
}

export default function NewUserPage() {

    const router = useRouter();

    const [roles, setRoles] = useState<Role[]>([]);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [roleId, setRoleId] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [teamId, setTeamId] = useState("");

    const [departments, setDepartments] =
        useState<Department[]>([]);

    const [teams, setTeams] =
        useState<Team[]>([]);

    const [departmentsLoading, setDepartmentsLoading] =
        useState(true);

    const [teamsLoading, setTeamsLoading] =
        useState(true);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        async function loadAssignmentData() {

            try {

                const [
                    rolesResponse,
                    departmentsResponse,
                    teamsResponse
                ] = await Promise.all([
                    apiFetch<RolesResponse>(
                        "/api/users/roles"
                    ),
                    apiFetch<DepartmentsResponse>(
                        "/api/departments"
                    ),
                    apiFetch<TeamsResponse>(
                        "/api/teams"
                    )
                ]);

                setRoles(
                    rolesResponse.data || []
                );

                setDepartments(
                    (departmentsResponse.data || []).filter(
                        (department) =>
                            !department.status ||
                            department.status === "ACTIVE"
                    )
                );

                setTeams(
                    (teamsResponse.data || []).filter(
                        (team) =>
                            !team.status ||
                            team.status === "ACTIVE"
                    )
                );

            } catch (err) {

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load roles, departments and teams"
                );

            } finally {

                setRolesLoading(false);
                setDepartmentsLoading(false);
                setTeamsLoading(false);
            }
        }

        loadAssignmentData();

    }, []);

    const selectedRole =
        roles.find(
            (role) => String(role.id) === roleId
        );

    const selectedRoleName =
        selectedRole?.name || "";

    const isTeamLeader =
        selectedRoleName === "TEAM_LEADER";

    const isDepartmentHead =
        selectedRoleName === "DEPARTMENT_HEAD";

    const availableTeams =
        teams.filter((team) => {
            const teamDepartmentId =
                team.departmentId ??
                team.department_id ??
                null;

            return departmentId
                ? Number(teamDepartmentId) ===
                    Number(departmentId)
                : true;
        });

    async function handleSubmit(
        e: React.FormEvent
    ) {

        e.preventDefault();

        setError("");

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

        if (!roleId) {
            setError("Please select a role");
            return;
        }

        if (isDepartmentHead && !departmentId) {
            setError(
                "Please select a department for Department Head"
            );
            return;
        }

        if (isTeamLeader && !departmentId) {
            setError(
                "Please select a department for Team Leader"
            );
            return;
        }

        if (isTeamLeader && !teamId) {
            setError(
                "Please select a team for Team Leader"
            );
            return;
        }

        if (teamId && !departmentId) {
            setError(
                "Please select a department before selecting a team"
            );
            return;
        }

        try {

            setLoading(true);

            await apiFetch("/api/users", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role: selectedRoleName,
                    departmentId: departmentId
                        ? Number(departmentId)
                        : null,
                    teamId: teamId
                        ? Number(teamId)
                        : null
                })
            });

            router.push("/users");

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create user"
            );

        } finally {

            setLoading(false);
        }
    }

    return (
        <PermissionGuard permission="users.manage">
        <div className="min-h-screen bg-slate-50">

            <Header
                title="Add User"
                subtitle="Create a new organization user"
            />

            <main className="p-6">

                <Link
                    href="/users"
                    className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft size={16} />
                    Back to Users
                </Link>

                <div className="mx-auto max-w-2xl">

                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                        <div className="border-b border-slate-200 px-6 py-5">
                            <h1 className="text-lg font-semibold text-slate-900">
                                Create User
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Add a user and assign their organization role.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

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
                                    placeholder="Enter full name"
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
                                    placeholder="user@company.com"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Role
                                </label>

                                <select
                                    value={roleId}
                                    onChange={(e) => {
                                        const nextRoleId =
                                            e.target.value;

                                        setRoleId(nextRoleId);

                                        const nextRole =
                                            roles.find(
                                                (role) =>
                                                    String(role.id) ===
                                                    nextRoleId
                                            );

                                        if (
                                            nextRole?.name ===
                                            "DEPARTMENT_HEAD"
                                        ) {
                                            setTeamId("");
                                        }
                                    }}
                                    required
                                    disabled={rolesLoading}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                >
                                    <option value="">
                                        {rolesLoading
                                            ? "Loading roles..."
                                            : "Select role"}
                                    </option>

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

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Department
                                    {isDepartmentHead || isTeamLeader
                                        ? " *"
                                        : ""}
                                </label>

                                <select
                                    value={departmentId}
                                    onChange={(e) => {
                                        const nextDepartmentId =
                                            e.target.value;

                                        setDepartmentId(
                                            nextDepartmentId
                                        );

                                        if (
                                            !teams.some(
                                                (team) => {
                                                    const teamDepartmentId =
                                                        team.departmentId ??
                                                        team.department_id ??
                                                        null;

                                                    return (
                                                        String(
                                                            teamDepartmentId
                                                        ) ===
                                                        nextDepartmentId &&
                                                        String(
                                                            team.id
                                                        ) ===
                                                        teamId
                                                    );
                                                }
                                            )
                                        ) {
                                            setTeamId("");
                                        }
                                    }}
                                    disabled={departmentsLoading}
                                    required={
                                        isDepartmentHead ||
                                        isTeamLeader
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                >
                                    <option value="">
                                        {departmentsLoading
                                            ? "Loading departments..."
                                            : "Select department"}
                                    </option>

                                    {departments.map(
                                        (department) => (
                                            <option
                                                key={department.id}
                                                value={department.id}
                                            >
                                                {department.name}
                                                {department.code
                                                    ? ` (${department.code})`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Team
                                    {isTeamLeader
                                        ? " *"
                                        : ""}
                                </label>

                                <select
                                    value={
                                        isDepartmentHead
                                            ? ""
                                            : teamId
                                    }
                                    onChange={(e) =>
                                        setTeamId(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        teamsLoading ||
                                        isDepartmentHead ||
                                        !departmentId
                                    }
                                    required={isTeamLeader}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                                >
                                    <option value="">
                                        {isDepartmentHead
                                            ? "Not applicable"
                                            : !departmentId
                                                ? "Select department first"
                                                : teamsLoading
                                                    ? "Loading teams..."
                                                    : "Select team"}
                                    </option>

                                    {!isDepartmentHead &&
                                        availableTeams.map(
                                            (team) => (
                                                <option
                                                    key={team.id}
                                                    value={team.id}
                                                >
                                                    {team.name}
                                                    {team.code
                                                        ? ` (${team.code})`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                </select>

                                <p className="mt-1.5 text-xs text-slate-500">
                                    {isTeamLeader
                                        ? "Team Leader must be assigned to a team."
                                        : isDepartmentHead
                                            ? "Department Head is assigned at department level."
                                            : "Optional. If selected, the team must belong to the selected department."}
                                </p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Password
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
                                        required
                                        minLength={8}
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
                                    Confirm Password
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
                                        required
                                        minLength={8}
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

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                                <Link
                                    href="/users"
                                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? "Creating..."
                                        : "Create User"}
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