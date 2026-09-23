"use client";

import { useEffect, useState } from "react";
import { Building2, Search, ExternalLink, Users, Network, Layers3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setActiveOrganizationId } from "@/lib/organization-context";
import PermissionGuard from "@/components/auth/PermissionGuard";
import Header from "@/components/layout/Header";

interface Organization {
    id: number;
    name: string;
    code: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    userCount: number;
    departmentCount: number;
    teamCount: number;
    misRecordCount: number;
}

export default function OrganizationsPage() {
    return (
        <PermissionGuard permission="organization.manage">
            <OrganizationsManagement />
        </PermissionGuard>
    );
}

function OrganizationsManagement() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        apiFetch<{ success: boolean; data: Organization[] }>("/api/organizations")
            .then((response) => setOrganizations(response.data))
            .catch((err) => setError(err.message || "Failed to load organizations"))
            .finally(() => setLoading(false));
    }, []);

    const filtered = organizations.filter((org) => {
        const value = `${org.name} ${org.code}`.toLowerCase();
        return value.includes(search.toLowerCase());
    });

    const openOrganization = (organization: Organization) => {
        setActiveOrganizationId(organization.id);
        router.push("/dashboard");
    };

    return (
        <div>
            <Header title="Organizations" subtitle="Platform organization management" />

            <main className="p-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">All Organizations</h2>
                        <p className="mt-1 text-sm text-slate-500">Select an organization to enter its management workspace.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search organizations..."
                            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                {loading ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading organizations...</div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No organizations found.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {filtered.map((org) => (
                            <div key={org.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Building2 size={22} /></div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{org.name}</h3>
                                            <p className="text-xs text-slate-500">{org.code}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${org.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{org.status}</span>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <Metric icon={<Users size={15} />} label="Users" value={org.userCount} />
                                    <Metric icon={<Layers3 size={15} />} label="Departments" value={org.departmentCount} />
                                    <Metric icon={<Network size={15} />} label="Teams" value={org.teamCount} />
                                    <Metric icon={<Building2 size={15} />} label="MIS Records" value={org.misRecordCount} />
                                </div>

                                <button onClick={() => openOrganization(org)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                                    Open Organization <ExternalLink size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return <div className="rounded-lg bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</div><div className="mt-1 text-lg font-semibold text-slate-900">{Number(value || 0).toLocaleString("en-IN")}</div></div>;
}
