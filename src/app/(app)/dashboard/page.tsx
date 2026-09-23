"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { DashboardData } from "@/types/mis";

function formatCurrency(value: number | string) {

    return `₹${Number(value || 0).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 0,
        }
    )}`;
}

export default function DashboardPage() {

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [month, setMonth] =
        useState("2026-06-01");

    async function loadDashboard() {

        try {

            setLoading(true);

            const response =
                await apiFetch<{
                    success: boolean;
                    data: DashboardData;
                }>(
                    `/api/dashboard?month=${month}`
                );

            setDashboard(response.data);

        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {

        loadDashboard();

    }, [month]);

    if (loading) {

        return (
            <div>

                <Header
                    title="Dashboard"
                    subtitle="Management overview"
                />

                <div className="p-8">
                    Loading dashboard...
                </div>

            </div>
        );
    }

    if (!dashboard) {

        return (
            <div>

                <Header
                    title="Dashboard"
                    subtitle="Management overview"
                />

                <div className="p-8">
                    Unable to load dashboard.
                </div>

            </div>
        );
    }

    const summary =
        dashboard.summary;

    return (
        <div>

            <Header
                title="Management Dashboard"
                subtitle="Overview of MIS performance"
            />

            <main className="p-8">

                {/* Top Controls */}

                <div className="flex justify-between items-center mb-6">

                    <div>

                        <h2 className="text-lg font-semibold">
                            Performance Overview
                        </h2>

                        <p className="text-sm text-slate-500">
                            Monitor business performance for the selected month.
                        </p>

                    </div>

                    <select
                        value={month}
                        onChange={(e) =>
                            setMonth(e.target.value)
                        }
                        className="bg-white border border-slate-300 rounded-lg px-4 py-2"
                    >

                        <option value="2026-06-01">
                            June 2026
                        </option>

                        <option value="2026-05-01">
                            May 2026
                        </option>

                        <option value="2026-04-01">
                            April 2026
                        </option>

                    </select>

                </div>

                {/* KPI */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">

                    <Kpi
                        title="Total Loans"
                        value={Number(
                            summary.totalLoans
                        ).toLocaleString("en-IN")}
                    />

                    <Kpi
                        title="Total Disbursement"
                        value={formatCurrency(
                            summary.totalDisbursement
                        )}
                    />

                    <Kpi
                        title="Average Loan"
                        value={formatCurrency(
                            summary.averageLoanAmount
                        )}
                    />

                    <Kpi
                        title="Cashback"
                        value={formatCurrency(
                            summary.totalCashback
                        )}
                    />

                    <Kpi
                        title="Subvention"
                        value={formatCurrency(
                            summary.totalSubvention
                        )}
                    />

                </div>

                {/* Charts */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <ChartCard
                        title="Bank-wise Disbursement"
                    >

                        <BarChartComponent
                            data={dashboard.bankWise}
                        />

                    </ChartCard>


                    <ChartCard
                        title="Product Distribution"
                    >

                        <ProductChart
                            data={dashboard.productWise}
                        />

                    </ChartCard>


                    <ChartCard
                        title="Team Performance"
                    >

                        <BarChartComponent
                            data={dashboard.teamWise}
                        />

                    </ChartCard>


                    <ChartCard
                        title="Seller Performance"
                    >

                        <BarChartComponent
                            data={dashboard.sellerWise}
                        />

                    </ChartCard>


                    <div className="lg:col-span-2">

                        <ChartCard
                            title="City-wise Disbursement"
                        >

                            <BarChartComponent
                                data={dashboard.cityWise}
                            />

                        </ChartCard>

                    </div>

                </div>

            </main>

        </div>
    );
}


/* KPI */

function Kpi({
    title,
    value,
}: {
    title: string;
    value: string;
}) {

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5">

            <p className="text-sm text-slate-500">
                {title}
            </p>

            <p className="text-2xl font-bold text-slate-900 mt-2">
                {value}
            </p>

        </div>
    );
}


/* Chart Card */

function ChartCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6">

            <h3 className="font-semibold text-slate-900 mb-6">
                {title}
            </h3>

            <div className="h-80">
                {children}
            </div>

        </div>
    );
}


/* Bar Chart */

function BarChartComponent({
    data,
}: {
    data: {
        name: string;
        loans: number;
        amount: number | string;
    }[];
}) {

    return (
        <ResponsiveContainer
            width="100%"
            height="100%"
        >

            <BarChart data={data}>

                <CartesianGrid
                    strokeDasharray="3 3"
                />

                <XAxis
                    dataKey="name"
                />

                <YAxis />

                <Tooltip
                    formatter={(value) =>
                        formatCurrency(
                            Number(value)
                        )
                    }
                />

                <Bar
                    dataKey="amount"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                />

            </BarChart>

        </ResponsiveContainer>
    );
}


/* Product Pie */
function ProductChart({
    data,
}: {
    data: {
        name: string;
        loans: number;
        amount: number | string;
    }[];
}) {
    const chartData = data.map((item) => ({
        name: item.name,
        loans: Number(item.loans),
        amount: Number(item.amount),
    }));

    const COLORS = [
        "#2563EB",
        "#16A34A",
        "#F59E0B",
        "#DC2626",
        "#7C3AED",
        "#0891B2",
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                >
                    {chartData.map((_, index) => (
                        <Cell
                            key={`product-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>

                <Tooltip
                    formatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                    }
                />

                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}