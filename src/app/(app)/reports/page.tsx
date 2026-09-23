"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart2 } from "lucide-react";
import Header from "@/components/layout/Header";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { apiFetch } from "@/lib/api";
import { getActiveOrganizationId } from "@/lib/organization-context";
import { useAuth } from "@/components/auth/AuthProvider";

interface ReportSummary {
    totalLoans: number | string;
    totalDisbursement: number | string;
    approvedAmount: number | string;
    pendingAmount: number | string;
    rejectedAmount: number | string;
    totalCashback: number | string;
    totalSubvention: number | string;
}

interface TeamPerformance {
    teamId: number | null;
    teamName: string;
    loans: number | string;
    disbursementAmount: number | string;
    approvedAmount: number | string;
    approvedLoans: number | string;
}

interface ReportRow {
    id: number;
    customerName: string;
    loanAccountNo: string;
    bankName?: string;
    product?: string;
    city?: string;
    teamName?: string;
    sellerName?: string;
    disbursementAmount: number | string;
    disbursementMonth: string;
    cashback: number | string;
    subvention: number | string;
    status: string;
    approvedAmount: number | string;
    bankApprovalDate?: string | null;
    remarks?: string | null;
}

interface ReportResponse {
    organization: { id: number; name: string; code: string };
    summary: ReportSummary;
    teamPerformance: TeamPerformance[];
    rows: ReportRow[];
}

const money = (value: number | string) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function ReportsPage() {
    return (
        <PermissionGuard permission="reports.view">
            <ReportsContent />
        </PermissionGuard>
    );
}

function ReportsContent() {
    const { user } = useAuth();
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [month, setMonth] = useState("");
    const [teamId, setTeamId] = useState("");
    const [bank, setBank] = useState("");
    const [product, setProduct] = useState("");
    const [status, setStatus] = useState("");
    const [exporting, setExporting] = useState(false);

    const query = useMemo(() => {
        const params = new URLSearchParams();
        if (month) params.set("month", month);
        if (teamId) params.set("teamId", teamId);
        if (bank) params.set("bank", bank);
        if (product) params.set("product", product);
        if (status) params.set("status", status);
        return params.toString();
    }, [month, teamId, bank, product, status]);

    const loadReport = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await apiFetch<{ success: boolean; data: ReportResponse }>(
                `/api/reports/summary${query ? `?${query}` : ""}`
            );
            setReport(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === "SUPER_ADMIN" && !getActiveOrganizationId()) return;
        loadReport();
    }, [user, query]);

    const exportExcel = async () => {
        try {
            setExporting(true);
            const token = localStorage.getItem("mis_token");
            const activeOrganizationId = getActiveOrganizationId();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
            const params = new URLSearchParams(query);
            if (user?.role === "SUPER_ADMIN" && activeOrganizationId) {
                params.set("organizationId", String(activeOrganizationId));
            }

            const response = await fetch(
                `${apiUrl}/api/reports/export${params.toString() ? `?${params.toString()}` : ""}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.message || "Unable to export report");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `MIS-Report-${month || "all"}.xlsx`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to export report");
        } finally {
            setExporting(false);
        }
    };

    const teams = report?.teamPerformance || [];
    const banks = Array.from(new Set((report?.rows || []).map((row) => row.bankName).filter(Boolean))) as string[];
    const products = Array.from(new Set((report?.rows || []).map((row) => row.product).filter(Boolean))) as string[];

    return (
        <div>
            <Header title="Reports" subtitle="MIS, approval and team performance reporting" />

            <main className="p-8">
                <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FileBarChart2 size={18} className="text-blue-600" />
                            MIS Reports
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Filter operational data and review approval and team performance.
                        </p>
                    </div>
                    <button
                        onClick={exportExcel}
                        disabled={exporting || loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download size={17} />
                        {exporting ? "Exporting..." : "Export Excel"}
                    </button>
                </div>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {report?.organization && (
                    <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                            Viewing Organization
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-lg font-semibold text-slate-900">🏢 {report.organization.name}</span>
                            <span className="text-sm text-slate-500">{report.organization.code}</span>
                        </div>
                    </div>
                )}

                <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-5">
                    <Filter label="Month">
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="filter-input" />
                    </Filter>
                    <Filter label="Team">
                        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="filter-input">
                            <option value="">All teams</option>
                            {teams.filter((team) => team.teamId).map((team) => (
                                <option key={team.teamId} value={team.teamId!}>{team.teamName}</option>
                            ))}
                        </select>
                    </Filter>
                    <Filter label="Bank">
                        <select value={bank} onChange={(e) => setBank(e.target.value)} className="filter-input">
                            <option value="">All banks</option>
                            {banks.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </Filter>
                    <Filter label="Product">
                        <select value={product} onChange={(e) => setProduct(e.target.value)} className="filter-input">
                            <option value="">All products</option>
                            {products.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </Filter>
                    <Filter label="Status">
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-input">
                            <option value="">All statuses</option>
                            {['PENDING', 'MATCHED', 'VARIANCE', 'NOT_FOUND', 'APPROVED', 'REJECTED'].map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </Filter>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading reports...</div>
                ) : report ? (
                    <>
                        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-7">
                            <Kpi title="Total Loans" value={Number(report.summary.totalLoans || 0).toLocaleString("en-IN")} />
                            <Kpi title="Disbursement" value={money(report.summary.totalDisbursement)} />
                            <Kpi title="Approved" value={money(report.summary.approvedAmount)} />
                            <Kpi title="Pending" value={money(report.summary.pendingAmount)} />
                            <Kpi title="Rejected" value={money(report.summary.rejectedAmount)} />
                            <Kpi title="Cashback" value={money(report.summary.totalCashback)} />
                            <Kpi title="Subvention" value={money(report.summary.totalSubvention)} />
                        </div>

                        <section className="mb-8 rounded-xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 px-6 py-4">
                                <h2 className="font-semibold text-slate-900">Team Performance</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3">Team</th>
                                            <th className="px-6 py-3 text-right">Loans</th>
                                            <th className="px-6 py-3 text-right">Disbursement</th>
                                            <th className="px-6 py-3 text-right">Approved</th>
                                            <th className="px-6 py-3 text-right">Approval %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.map((team) => {
                                            const loans = Number(team.loans || 0);
                                            const approvedLoans = Number(team.approvedLoans || 0);
                                            const approval = loans ? (approvedLoans / loans) * 100 : 0;
                                            return (
                                                <tr key={`${team.teamId}-${team.teamName}`} className="border-t border-slate-100">
                                                    <td className="px-6 py-3 font-medium text-slate-900">{team.teamName}</td>
                                                    <td className="px-6 py-3 text-right">{loans.toLocaleString("en-IN")}</td>
                                                    <td className="px-6 py-3 text-right">{money(team.disbursementAmount)}</td>
                                                    <td className="px-6 py-3 text-right">{money(team.approvedAmount)}</td>
                                                    <td className="px-6 py-3 text-right">{approval.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h2 className="font-semibold text-slate-900">Detailed MIS Report</h2>
                                    <p className="mt-1 text-xs text-slate-500">Showing up to 5,000 filtered records.</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px] text-sm">
                                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            {['Customer', 'Loan Account', 'Bank', 'Product', 'Team', 'Seller', 'Disbursement', 'Approved', 'Status', 'Approval Date'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.rows.map((row) => (
                                            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{row.customerName || "-"}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{row.loanAccountNo || "-"}</td>
                                                <td className="px-4 py-3">{row.bankName || "-"}</td>
                                                <td className="px-4 py-3">{row.product || "-"}</td>
                                                <td className="px-4 py-3">{row.teamName || "-"}</td>
                                                <td className="px-4 py-3">{row.sellerName || "-"}</td>
                                                <td className="px-4 py-3 text-right">{money(row.disbursementAmount)}</td>
                                                <td className="px-4 py-3 text-right">{money(row.approvedAmount)}</td>
                                                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                                                <td className="px-4 py-3">{row.bankApprovalDate ? new Date(row.bankApprovalDate).toLocaleDateString("en-IN") : "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                ) : null}
            </main>

            <style jsx>{`
                .filter-input {
                    width: 100%;
                    border: 1px solid rgb(203 213 225);
                    border-radius: 0.5rem;
                    background: white;
                    padding: 0.55rem 0.75rem;
                    font-size: 0.875rem;
                    outline: none;
                }
                .filter-input:focus { border-color: rgb(59 130 246); }
            `}</style>
        </div>
    );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>{children}</label>;
}

function Kpi({ title, value }: { title: string; value: string }) {
    return <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-xl font-bold text-slate-900">{value}</p></div>;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        APPROVED: "bg-green-50 text-green-700",
        REJECTED: "bg-red-50 text-red-700",
        PENDING: "bg-amber-50 text-amber-700",
        MATCHED: "bg-blue-50 text-blue-700",
        VARIANCE: "bg-orange-50 text-orange-700",
        NOT_FOUND: "bg-slate-100 text-slate-600"
    };
    return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
