"use client";

import { useEffect, useState } from "react";
import {
    Search,
    RefreshCw,
    Filter,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { MisRecord } from "@/types/mis";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MisPage() {

    const { user } = useAuth();

    const isOrgAdmin =
        user?.role === "ORG_ADMIN";

    const [records, setRecords] =
        useState<MisRecord[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [month, setMonth] =
        useState("");

    const [bank, setBank] =
        useState("");

    const [product, setProduct] =
        useState("");

    const [team, setTeam] =
        useState("");

    const [seller, setSeller] =
        useState("");

    const [city, setCity] =
        useState("");

    async function loadData() {

        try {

            setLoading(true);

            const params =
                new URLSearchParams();

            if (month)
                params.append("month", month);

            if (bank)
                params.append("bank", bank);

            if (product)
                params.append("product", product);

            if (team)
                params.append("team", team);

            if (seller)
                params.append("seller", seller);

            if (city)
                params.append("city", city);

            const response =
                await apiFetch<{
                    success: boolean;
                    data: MisRecord[] | {
                        scope: string;
                        rows: MisRecord[];
                    };
                }>(
                    `/api/mis/data?${params.toString()}`
                );

            const result = response.data;

            setRecords(
                Array.isArray(result)
                    ? result
                    : result?.rows ?? []
            );

        } catch (error) {

            console.error(
                "MIS data error:",
                error
            );

        } finally {

            setLoading(false);

        }
    }

    async function updateStatus(
        loanId: number,
        status: string
    ) {

        try {

            await apiFetch(
                `/api/mis/data/${loanId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status,
                    }),
                }
            );

            await loadData();

        } catch (error) {

            console.error(
                "MIS status update error:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Unable to update transaction status."
            );
        }
    }

    useEffect(() => {

        loadData();

    }, [
        month,
        bank,
        product,
        team,
        seller,
        city,
    ]);

    const filteredRecords =
        records.filter((record) => {

            const value =
                search.toLowerCase();

            return (
                record.customerName
                    ?.toLowerCase()
                    .includes(value) ||

                record.loanAccountNo
                    ?.toLowerCase()
                    .includes(value) ||

                record.employerName
                    ?.toLowerCase()
                    .includes(value) ||

                record.contactNumber
                    ?.toLowerCase()
                    .includes(value)
            );

        });

    const banks =
        unique(
            records.map(
                (x) => x.bankName
            )
        );

    const products =
        unique(
            records.map(
                (x) => x.product
            )
        );

    const teams =
        unique(
            records.map(
                (x) => x.teamName
            )
        );

    const sellers =
        unique(
            records.map(
                (x) => x.sellerName
            )
        );

    const cities =
        unique(
            records.map(
                (x) => x.city
            )
        );

    return (
        <div>

            <Header
                title="MIS Data"
                subtitle="View and analyse imported MIS records"
            />

            <main className="p-8">

                {/* Top */}

                <div className="flex items-center justify-between mb-6">

                    <div>

                        <h2 className="text-lg font-semibold">
                            Disbursement Records
                        </h2>

                        <p className="text-sm text-slate-500">
                            {filteredRecords.length} records found
                        </p>

                    </div>

                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >

                        <RefreshCw size={16} />

                        Refresh

                    </button>

                </div>

                {/* Search */}

                <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">

                    <div className="relative">

                        <Search
                            size={18}
                            className="absolute left-3 top-3 text-slate-400"
                        />

                        <input
                            type="text"
                            placeholder="Search customer, loan account, employer or contact..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>

                </div>

                {/* Filters */}

                <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">

                    <div className="flex items-center gap-2 mb-4">

                        <Filter size={17} />

                        <h3 className="font-semibold">
                            Filters
                        </h3>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

                        <SelectFilter
                            label="Month"
                            value={month}
                            onChange={setMonth}
                            options={[
                                "2026-06-01",
                            ]}
                        />

                        <SelectFilter
                            label="Bank"
                            value={bank}
                            onChange={setBank}
                            options={banks}
                        />

                        <SelectFilter
                            label="Product"
                            value={product}
                            onChange={setProduct}
                            options={products}
                        />

                        <SelectFilter
                            label="Team"
                            value={team}
                            onChange={setTeam}
                            options={teams}
                        />

                        <SelectFilter
                            label="Seller"
                            value={seller}
                            onChange={setSeller}
                            options={sellers}
                        />

                        <SelectFilter
                            label="City"
                            value={city}
                            onChange={setCity}
                            options={cities}
                        />

                    </div>

                </div>

                {/* Table */}

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-slate-50 border-b border-slate-200">

                                <tr>

                                    <Th>
                                        Customer
                                    </Th>

                                    <Th>
                                        Contact
                                    </Th>

                                    <Th>
                                        Employer
                                    </Th>

                                    <Th>
                                        Bank
                                    </Th>

                                    <Th>
                                        City
                                    </Th>

                                    <Th>
                                        Product
                                    </Th>

                                    <Th>
                                        Loan A/c
                                    </Th>

                                    <Th>
                                        Status
                                    </Th>

                                    <Th align="right">
                                        Disbursement
                                    </Th>

                                    <Th>
                                        Seller
                                    </Th>

                                    <Th>
                                        Team
                                    </Th>

                                    <Th>
                                        DSA
                                    </Th>

                                    <Th align="right">
                                        Cashback
                                    </Th>

                                    <Th align="right">
                                        Subvention
                                    </Th>

                                </tr>

                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan={14}
                                            className="text-center py-12 text-slate-500"
                                        >
                                            Loading MIS data...
                                        </td>

                                    </tr>

                                ) : filteredRecords.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={14}
                                            className="text-center py-12 text-slate-500"
                                        >
                                            No records found
                                        </td>

                                    </tr>

                                ) : (

                                    filteredRecords.map(
                                        (record) => (

                                            <tr
                                                key={record.id}
                                                className="border-b border-slate-100 hover:bg-slate-50"
                                            >

                                                <Td>
                                                    <div className="font-medium text-slate-900">
                                                        {record.customerName}
                                                    </div>
                                                </Td>

                                                <Td>
                                                    {record.contactNumber || "-"}
                                                </Td>

                                                <Td>
                                                    {record.employerName || "-"}
                                                </Td>

                                                <Td>
                                                    {record.bankName || "-"}
                                                </Td>

                                                <Td>
                                                    {record.city || "-"}
                                                </Td>

                                                <Td>
                                                    {record.product || "-"}
                                                </Td>

                                                <Td>
                                                    <span className="font-mono text-xs">
                                                        {record.loanAccountNo}
                                                    </span>
                                                </Td>

                                                <Td>
                                                    <div className="flex items-center gap-2">

                                                        {!isOrgAdmin && (<StatusBadge
                                                            status={
                                                                (record as MisRecord & {
                                                                    reconciliationStatus?: string;
                                                                }).reconciliationStatus
                                                            }
                                                        />)}

                                                        {isOrgAdmin && (
                                                            <select
                                                                value={
                                                                    (record as MisRecord & {
                                                                        reconciliationStatus?: string;
                                                                    }).reconciliationStatus || "PENDING"
                                                                }
                                                                onChange={(e) =>
                                                                    updateStatus(
                                                                        record.id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white"
                                                            >
                                                                <option value="PENDING">Under Review</option>
                                                                <option value="MATCHED">Matched</option>
                                                                <option value="VARIANCE">Variance</option>
                                                                <option value="NOT_FOUND">Not Found</option>
                                                                <option value="APPROVED">Approved</option>
                                                                <option value="REJECTED">Rejected</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                </Td>

                                                <Td align="right">
                                                    {formatCurrency(
                                                        record.disbursementAmount
                                                    )}
                                                </Td>

                                                <Td>
                                                    {record.sellerName || "-"}
                                                </Td>

                                                <Td>
                                                    {record.teamName || "-"}
                                                </Td>

                                                <Td>
                                                    {record.dsaCode || "-"}
                                                </Td>

                                                <Td align="right">
                                                    {formatCurrency(
                                                        record.cashback
                                                    )}
                                                </Td>

                                                <Td align="right">
                                                    {formatCurrency(
                                                        record.subvention
                                                    )}
                                                </Td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </main>

        </div>
    );
}


function StatusBadge({
    status,
}: {
    status?: string;
}) {

    const normalized =
        String(status || "PENDING").toUpperCase();

    const config: Record<
        string,
        {
            label: string;
            className: string;
        }
    > = {
        PENDING: {
            label: "Under Review",
            className:
                "bg-amber-50 text-amber-700 border-amber-200",
        },
        MATCHED: {
            label: "Matched",
            className:
                "bg-blue-50 text-blue-700 border-blue-200",
        },
        VARIANCE: {
            label: "Variance",
            className:
                "bg-orange-50 text-orange-700 border-orange-200",
        },
        NOT_FOUND: {
            label: "Not Found",
            className:
                "bg-slate-100 text-slate-700 border-slate-200",
        },
        APPROVED: {
            label: "Approved",
            className:
                "bg-green-50 text-green-700 border-green-200",
        },
        REJECTED: {
            label: "Rejected",
            className:
                "bg-red-50 text-red-700 border-red-200",
        },
    };

    const item =
        config[normalized] || config.PENDING;

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${item.className}`}
        >
            {item.label}
        </span>
    );
}


/* Select */

function SelectFilter({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: (string | undefined)[];
}) {

    return (
        <div>

            <label className="block text-xs font-medium text-slate-500 mb-1">
                {label}
            </label>

            <select
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
            >

                <option value="">
                    All
                </option>

                {options
                    .filter(Boolean)
                    .map((option) => (

                        <option
                            key={option}
                            value={option}
                        >
                            {option}
                        </option>

                    ))}

            </select>

        </div>
    );
}


function Th({
    children,
    align = "left",
}: {
    children: React.ReactNode;
    align?: "left" | "right";
}) {

    return (
        <th
            className={`px-4 py-3 font-semibold text-slate-600 whitespace-nowrap text-${align}`}
        >
            {children}
        </th>
    );
}


function Td({
    children,
    align = "left",
}: {
    children: React.ReactNode;
    align?: "left" | "right";
}) {

    return (
        <td
            className={`px-4 py-3 whitespace-nowrap text-${align}`}
        >
            {children}
        </td>
    );
}


function unique(
    values: (string | undefined)[]
): string[] {

    return Array.from(
        new Set(
            values.filter(
                (value): value is string =>
                    Boolean(value)
            )
        )
    );
}


function formatCurrency(
    value: number | string
) {

    return `₹${Number(value || 0).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 0,
        }
    )}`;
}