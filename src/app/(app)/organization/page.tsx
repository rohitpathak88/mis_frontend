"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import PermissionGuard from "@/components/auth/PermissionGuard";
import type {
    Department,
    Team,
    EntityStatus
} from "@/types/organization";

type Tab = "departments" | "teams";

export default function OrganizationPage() {
    return (
        <PermissionGuard permission="organization.manage">
            <OrganizationManagement />
        </PermissionGuard>
    );
}

function OrganizationManagement() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] =
        useState<Tab>("departments");

    const [departments, setDepartments] =
        useState<Department[]>([]);

    const [teams, setTeams] =
        useState<Team[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [showDepartmentModal, setShowDepartmentModal] =
        useState(false);

    const [showTeamModal, setShowTeamModal] =
        useState(false);

    const [editingDepartment, setEditingDepartment] =
        useState<Department | null>(null);

    const [editingTeam, setEditingTeam] =
        useState<Team | null>(null);

    const loadDepartments = async () => {
        try {
            const response = await apiFetch<{
                success: boolean;
                data: Department[];
            }>("/api/departments");

            setDepartments(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load departments");
        }
    };

    const loadTeams = async () => {
        try {
            const response = await apiFetch<{
                success: boolean;
                data: Team[];
            }>("/api/teams");

            setTeams(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load teams");
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            await Promise.all([
                loadDepartments(),
                loadTeams()
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const handleDepartmentSaved = async () => {
        setShowDepartmentModal(false);
        setEditingDepartment(null);

        await loadDepartments();
    };

    const handleTeamSaved = async () => {
        setShowTeamModal(false);
        setEditingTeam(null);

        await loadTeams();
    };

    const handleDepartmentStatus = async (
        department: Department
    ) => {
        const newStatus: EntityStatus =
            department.status === "ACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        if (
            !window.confirm(
                `Are you sure you want to ${newStatus === "ACTIVE"
                    ? "activate"
                    : "deactivate"
                } this department?`
            )
        ) {
            return;
        }

        try {
            await apiFetch(
                `/api/departments/${department.id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            await loadDepartments();
        } catch (err) {
            console.error(err);
            alert("Failed to update department status");
        }
    };

    const handleTeamStatus = async (
        team: Team
    ) => {
        const newStatus: EntityStatus =
            team.status === "ACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        if (
            !window.confirm(
                `Are you sure you want to ${newStatus === "ACTIVE"
                    ? "activate"
                    : "deactivate"
                } this team?`
            )
        ) {
            return;
        }

        try {
            await apiFetch(
                `/api/teams/${team.id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            await loadTeams();
        } catch (err) {
            console.error(err);
            alert("Failed to update team status");
        }
    };

    const handleDeleteDepartment = async (
        department: Department
    ) => {
        if (
            !window.confirm(
                `Delete department "${department.name}"?`
            )
        ) {
            return;
        }

        try {
            await apiFetch(
                `/api/departments/${department.id}`,
                {
                    method: "DELETE"
                }
            );

            await loadData();

        } catch (err) {
            console.error(err);

            alert(
                "Department cannot be deleted because it may have teams or assigned users."
            );
        }
    };

    const handleDeleteTeam = async (
        team: Team
    ) => {
        if (
            !window.confirm(
                `Delete team "${team.name}"?`
            )
        ) {
            return;
        }

        try {
            await apiFetch(
                `/api/teams/${team.id}`,
                {
                    method: "DELETE"
                }
            );

            await loadTeams();

        } catch (err) {
            console.error(err);

            alert(
                "Team cannot be deleted because users or MIS records may be assigned to it."
            );
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-sm text-gray-500">
                    Loading organization...
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">

            {/* Header */}

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Organization Management
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage departments, teams and organizational structure.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Tabs */}

            <div className="mb-6 border-b border-gray-200">

                <div className="flex gap-6">

                    <button
                        onClick={() =>
                            setActiveTab("departments")
                        }
                        className={`border-b-2 px-1 pb-3 text-sm font-medium ${activeTab === "departments"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Departments
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                            {departments.length}
                        </span>
                    </button>

                    <button
                        onClick={() =>
                            setActiveTab("teams")
                        }
                        className={`border-b-2 px-1 pb-3 text-sm font-medium ${activeTab === "teams"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Teams
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                            {teams.length}
                        </span>
                    </button>

                </div>

            </div>

            {/* Departments */}

            {activeTab === "departments" && (
                <DepartmentSection
                    departments={departments}
                    onAdd={() => {
                        setEditingDepartment(null);
                        setShowDepartmentModal(true);
                    }}
                    onEdit={(department) => {
                        setEditingDepartment(department);
                        setShowDepartmentModal(true);
                    }}
                    onStatus={handleDepartmentStatus}
                    onDelete={handleDeleteDepartment}
                />
            )}

            {/* Teams */}

            {activeTab === "teams" && (
                <TeamSection
                    teams={teams}
                    departments={departments}
                    onAdd={() => {
                        setEditingTeam(null);
                        setShowTeamModal(true);
                    }}
                    onEdit={(team) => {
                        setEditingTeam(team);
                        setShowTeamModal(true);
                    }}
                    onStatus={handleTeamStatus}
                    onDelete={handleDeleteTeam}
                />
            )}

            {/* Department modal */}

            {showDepartmentModal && (
                <DepartmentModal
                    department={editingDepartment}
                    onClose={() => {
                        setShowDepartmentModal(false);
                        setEditingDepartment(null);
                    }}
                    onSaved={handleDepartmentSaved}
                />
            )}

            {/* Team modal */}

            {showTeamModal && (
                <TeamModal
                    team={editingTeam}
                    departments={departments}
                    onClose={() => {
                        setShowTeamModal(false);
                        setEditingTeam(null);
                    }}
                    onSaved={handleTeamSaved}
                />
            )}

        </div>
    );
}
function DepartmentSection({
    departments,
    onAdd,
    onEdit,
    onStatus,
    onDelete
}: {
    departments: Department[];
    onAdd: () => void;
    onEdit: (department: Department) => void;
    onStatus: (department: Department) => void;
    onDelete: (department: Department) => void;
}) {
    return (
        <div>

            <div className="mb-4 flex items-center justify-between">

                <div>
                    <h2 className="text-lg font-medium text-gray-900">
                        Departments
                    </h2>

                    <p className="text-sm text-gray-500">
                        Organize your organization into departments.
                    </p>
                </div>

                <button
                    onClick={onAdd}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    + Add Department
                </button>

            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                <table className="w-full">

                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Department
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Code
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Status
                            </th>

                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                        {departments.map((department) => (
                            <tr key={department.id}>

                                <td className="px-5 py-4">
                                    <div className="font-medium text-gray-900">
                                        {department.name}
                                    </div>
                                </td>

                                <td className="px-5 py-4 text-sm text-gray-500">
                                    {department.code || "-"}
                                </td>

                                <td className="px-5 py-4">
                                    <StatusBadge
                                        status={department.status}
                                    />
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex justify-end gap-2">

                                        <button
                                            onClick={() =>
                                                onEdit(department)
                                            }
                                            className="rounded-md px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                onStatus(department)
                                            }
                                            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                                        >
                                            {department.status === "ACTIVE"
                                                ? "Deactivate"
                                                : "Activate"}
                                        </button>

                                        <button
                                            onClick={() =>
                                                onDelete(department)
                                            }
                                            className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>

                                    </div>
                                </td>

                            </tr>
                        ))}

                        {departments.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-5 py-10 text-center text-sm text-gray-500"
                                >
                                    No departments found.
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}
function TeamSection({
    teams,
    departments,
    onAdd,
    onEdit,
    onStatus,
    onDelete
}: {
    teams: Team[];
    departments: Department[];
    onAdd: () => void;
    onEdit: (team: Team) => void;
    onStatus: (team: Team) => void;
    onDelete: (team: Team) => void;
}) {
    const [departmentFilter, setDepartmentFilter] =
        useState("");

    const filteredTeams = departmentFilter
        ? teams.filter(
            team =>
                team.departmentId ===
                Number(departmentFilter)
        )
        : teams;

    return (
        <div>

            <div className="mb-4 flex items-center justify-between">

                <div>
                    <h2 className="text-lg font-medium text-gray-900">
                        Teams
                    </h2>

                    <p className="text-sm text-gray-500">
                        Manage teams within departments.
                    </p>
                </div>

                <button
                    onClick={onAdd}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    + Add Team
                </button>

            </div>

            {/* Filter */}

            <div className="mb-4">

                <select
                    value={departmentFilter}
                    onChange={(event) =>
                        setDepartmentFilter(event.target.value)
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                    <option value="">
                        All Departments
                    </option>

                    {departments.map((department) => (
                        <option
                            key={department.id}
                            value={department.id}
                        >
                            {department.name}
                        </option>
                    ))}

                </select>

            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                <table className="w-full">

                    <thead className="bg-gray-50">
                        <tr>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Team
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Department
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Code
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                Status
                            </th>

                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                                Actions
                            </th>

                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                        {filteredTeams.map((team) => (
                            <tr key={team.id}>

                                <td className="px-5 py-4">
                                    <div className="font-medium text-gray-900">
                                        {team.name}
                                    </div>
                                </td>

                                <td className="px-5 py-4 text-sm text-gray-600">
                                    {team.departmentName}
                                </td>

                                <td className="px-5 py-4 text-sm text-gray-500">
                                    {team.code || "-"}
                                </td>

                                <td className="px-5 py-4">
                                    <StatusBadge
                                        status={team.status}
                                    />
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex justify-end gap-2">

                                        <button
                                            onClick={() =>
                                                onEdit(team)
                                            }
                                            className="rounded-md px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                onStatus(team)
                                            }
                                            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                                        >
                                            {team.status === "ACTIVE"
                                                ? "Deactivate"
                                                : "Activate"}
                                        </button>

                                        <button
                                            onClick={() =>
                                                onDelete(team)
                                            }
                                            className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>

                                    </div>
                                </td>

                            </tr>
                        ))}

                        {filteredTeams.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-5 py-10 text-center text-sm text-gray-500"
                                >
                                    No teams found.
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}
function StatusBadge({
    status
}: {
    status: EntityStatus;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
                }`}
        >
            {status}
        </span>
    );
}
function DepartmentModal({
    department,
    onClose,
    onSaved
}: {
    department: Department | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] =
        useState(department?.name || "");

    const [code, setCode] =
        useState(department?.code || "");

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleSubmit = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        if (!name.trim()) {
            setError("Department name is required");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const url = department
                ? `/api/departments/${department.id}`
                : "/api/departments";

            await apiFetch(url, {
                method: department ? "PUT" : "POST",
                body: JSON.stringify({
                    name: name.trim(),
                    code: code.trim() || null
                })
            });

            onSaved();

        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save department"
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={
                department
                    ? "Edit Department"
                    : "Add Department"
            }
            onClose={onClose}
        >

            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >

                {error && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Department Name
                    </label>

                    <input
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="e.g. Sales"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Code
                    </label>

                    <input
                        value={code}
                        onChange={(event) =>
                            setCode(event.target.value)
                        }
                        placeholder="e.g. SALES"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <ModalActions
                    onClose={onClose}
                    saving={saving}
                />

            </form>

        </Modal>
    );
}
function TeamModal({
    team,
    departments,
    onClose,
    onSaved
}: {
    team: Team | null;
    departments: Department[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] =
        useState(team?.name || "");

    const [code, setCode] =
        useState(team?.code || "");

    const [departmentId, setDepartmentId] =
        useState(
            team?.departmentId
                ? String(team.departmentId)
                : ""
        );

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const activeDepartments =
        departments.filter(
            department =>
                department.status === "ACTIVE"
        );

    const handleSubmit = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        if (!name.trim()) {
            setError("Team name is required");
            return;
        }

        if (!departmentId) {
            setError("Department is required");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const url = team
                ? `/api/teams/${team.id}`
                : "/api/teams";

            await apiFetch(url, {
                method: team ? "PUT" : "POST",
                body: JSON.stringify({
                    name: name.trim(),
                    code: code.trim() || null,
                    departmentId: Number(departmentId)
                })
            });

            onSaved();

        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save team"
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={
                team
                    ? "Edit Team"
                    : "Add Team"
            }
            onClose={onClose}
        >

            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >

                {error && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Department
                    </label>

                    <select
                        value={departmentId}
                        onChange={(event) =>
                            setDepartmentId(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                        <option value="">
                            Select Department
                        </option>

                        {activeDepartments.map(
                            department => (
                                <option
                                    key={department.id}
                                    value={department.id}
                                >
                                    {department.name}
                                </option>
                            )
                        )}

                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Team Name
                    </label>

                    <input
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="e.g. Delhi Team"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Code
                    </label>

                    <input
                        value={code}
                        onChange={(event) =>
                            setCode(event.target.value)
                        }
                        placeholder="e.g. DELHI"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <ModalActions
                    onClose={onClose}
                    saving={saving}
                />

            </form>

        </Modal>
    );
}
function Modal({
    title,
    children,
    onClose
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>

                    <button
                        onClick={onClose}
                        className="text-xl text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>

                </div>

                <div className="p-5">
                    {children}
                </div>

            </div>

        </div>
    );
}

function ModalActions({
    onClose,
    saving
}: {
    onClose: () => void;
    saving: boolean;
}) {
    return (
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">

            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                Cancel
            </button>

            <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
                {saving ? "Saving..." : "Save"}
            </button>

        </div>
    );
}