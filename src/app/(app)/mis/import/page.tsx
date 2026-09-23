"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

interface ImportResponse {
    success: boolean;
    data: {
        importId: number;
        fileName: string;
        reportingMonth: string;
        totalRows: number;
        successfulRows: number;
        failedRows: number;
        status: string;
        misPeriodId?: number;
        teamId?: number;
    };
}

export default function ImportMisPage() {

    const { user } = useAuth();


    const currentDate = new Date();

    const defaultMonth =
        `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
        ).padStart(2, "0")}`;

    const [month, setMonth] =
        useState(defaultMonth);

    const [teams, setTeams] =
        useState<{
            id: number;
            name: string;
            code?: string | null;
            departmentId?: number | null;
        }[]>([]);

    const [teamId, setTeamId] =
        useState("");

    const [teamsLoading, setTeamsLoading] =
        useState(true);

    const isTeamLeader =
        user?.role === "TEAM_LEADER";

    const isDepartmentHead =
        user?.role === "DEPARTMENT_HEAD";

    useEffect(() => {
        if (isTeamLeader && user?.team?.id) {
            setTeamId(String(user.team.id));
            return;
        }

        if (
            isDepartmentHead &&
            user?.department?.id &&
            teamId
        ) {
            const selectedTeam = teams.find(
                (team) => team.id === Number(teamId)
            );

            if (
                selectedTeam &&
                Number(selectedTeam.departmentId) !==
                    Number(user.department.id)
            ) {
                setTeamId("");
            }
        }
    }, [
        isTeamLeader,
        isDepartmentHead,
        user?.team?.id,
        user?.department?.id,
        teams,
        teamId
    ]);

    const [file, setFile] =
        useState<File | null>(null);

    const [dragging, setDragging] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [result, setResult] =
        useState<ImportResponse["data"] | null>(null);

    useEffect(() => {

        // Team Leaders do not need the team list.
        // The backend automatically uses their assigned team.
        if (isTeamLeader) {
            setTeamsLoading(false);
            return;
        }

        async function loadTeams() {
            try {
                setTeamsLoading(true);

                const response = await apiFetch<{
                    success: boolean;
                    data: {
                        id: number;
                        name: string;
                        code?: string | null;
                        departmentId?: number | null;
                    }[];
                }>("/api/teams");

                setTeams(response.data || []);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load teams."
                );
            } finally {
                setTeamsLoading(false);
            }
        }

        loadTeams();

    }, [isTeamLeader]);

    function handleFile(
        selectedFile: File | null
    ) {

        setError("");
        setResult(null);

        if (!selectedFile) {
            return;
        }

        const validExtensions = [
            ".xlsx",
            ".xls",
        ];

        const extension =
            selectedFile.name
                .substring(
                    selectedFile.name.lastIndexOf(".")
                )
                .toLowerCase();

        if (!validExtensions.includes(extension)) {

            setError(
                "Please select an Excel file (.xlsx or .xls)."
            );

            return;
        }

        if (selectedFile.size > 20 * 1024 * 1024) {

            setError(
                "File size cannot exceed 20 MB."
            );

            return;
        }

        setFile(selectedFile);
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {

        handleFile(
            event.target.files?.[0] || null
        );
    }

    function handleDrop(
        event: React.DragEvent<HTMLDivElement>
    ) {

        event.preventDefault();

        setDragging(false);

        handleFile(
            event.dataTransfer.files?.[0] || null
        );
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setError("");
        setResult(null);

        if (
            !["ORG_ADMIN", "MIS_USER", "DEPARTMENT_HEAD", "TEAM_LEADER"]
                .includes(user?.role || "")
        ) {
            setError(
                "You do not have permission to import MIS data."
            );

            return;
        }

        if (!month) {

            setError(
                "Please select a reporting month."
            );

            return;
        }

        if (!isTeamLeader && !teamId) {
            setError(
                "Please select a team."
            );
            return;
        }

        if (!file) {

            setError(
                "Please select an Excel file."
            );

            return;
        }

        try {

            setLoading(true);

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            formData.append(
                "reportingMonth",
                `${month}-01`
            );

            if (!isTeamLeader && teamId) {
                formData.append(
                    "teamId",
                    teamId
                );
            }

            const response =
                await uploadFile<ImportResponse>(
                    "/api/mis/import",
                    formData
                );

            setResult(response.data);

            setFile(null);

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Import failed."
            );

        } finally {

            setLoading(false);

        }
    }

    return (
        <div>

            <Header
                title="Import MIS"
                subtitle="Upload monthly MIS data"
            />

            <main className="p-8 max-w-5xl">

                <div className="mb-8">

                    <h2 className="text-xl font-semibold text-slate-900">
                        Import Monthly MIS
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        Upload the Excel file prepared by your MIS team.
                    </p>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >

                    {/* Reporting Month */}

                    <div className="bg-white border border-slate-200 rounded-xl p-6">

                        <div>

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Reporting Month
                            </label>

                            <input
                                type="month"
                                value={month}
                                onChange={(e) =>
                                    setMonth(e.target.value)
                                }
                                className="w-full md:w-80 border border-slate-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <p className="text-xs text-slate-500 mt-2">
                                Select the month for which this MIS is being uploaded.
                            </p>

                        </div>

                    </div>


                    {/* Team */}

                    {!isTeamLeader && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6">

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Team
                            </label>

                            <select
                                value={teamId}
                                onChange={(e) => setTeamId(e.target.value)}
                                disabled={teamsLoading}
                                className="w-full md:w-80 border border-slate-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                            >
                                <option value="">
                                    {teamsLoading
                                        ? "Loading teams..."
                                        : "Select team"}
                                </option>

                                {teams
                                    .filter(
                                        (team) =>
                                            !isDepartmentHead ||
                                            team.departmentId === user?.department?.id
                                    )
                                    .map((team) => (
                                        <option
                                            key={team.id}
                                            value={team.id}
                                        >
                                            {team.name}
                                            {team.code ? ` (${team.code})` : ""}
                                        </option>
                                    ))}
                            </select>

                            <p className="text-xs text-slate-500 mt-2">
                                {isDepartmentHead
                                    ? "Select a team from your assigned department."
                                    : "Select the team this MIS belongs to."}
                            </p>

                        </div>
                    )}

                    {/* Upload */}

                    <div className="bg-white border border-slate-200 rounded-xl p-6">

                        <label className="block text-sm font-semibold text-slate-700 mb-4">
                            Excel File
                        </label>

                        <div
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() =>
                                setDragging(false)
                            }
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl
                                p-12 text-center
                                transition
                                ${dragging
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-slate-300"
                                }
                            `}
                        >

                            <input
                                id="mis-file"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <label
                                htmlFor="mis-file"
                                className="cursor-pointer"
                            >

                                {file ? (

                                    <>

                                        <FileSpreadsheet
                                            size={48}
                                            className="mx-auto text-green-600 mb-4"
                                        />

                                        <p className="font-semibold text-slate-900">
                                            {file.name}
                                        </p>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {formatFileSize(
                                                file.size
                                            )}
                                        </p>

                                        <p className="text-sm text-blue-600 mt-4">
                                            Click to select another file
                                        </p>

                                    </>

                                ) : (

                                    <>

                                        <Upload
                                            size={48}
                                            className="mx-auto text-slate-400 mb-4"
                                        />

                                        <p className="font-semibold text-slate-800">
                                            Drop your Excel file here
                                        </p>

                                        <p className="text-sm text-slate-500 mt-2">
                                            or click to browse
                                        </p>

                                        <p className="text-xs text-slate-400 mt-3">
                                            Supported: .xlsx, .xls · Maximum 20 MB
                                        </p>

                                    </>

                                )}

                            </label>

                        </div>

                    </div>


                    {/* Error */}

                    {error && (

                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

                            <AlertCircle
                                size={20}
                                className="mt-0.5"
                            />

                            <div>
                                <p className="font-medium">
                                    Import failed
                                </p>

                                <p className="text-sm mt-1">
                                    {error}
                                </p>
                            </div>

                        </div>

                    )}


                    {/* Result */}

                    {result && (

                        <div className="rounded-xl border border-green-200 bg-green-50 p-6">

                            <div className="flex items-center gap-3 mb-5">

                                <CheckCircle2
                                    size={24}
                                    className="text-green-600"
                                />

                                <div>

                                    <h3 className="font-semibold text-green-800">
                                        Import completed successfully
                                    </h3>

                                    <p className="text-sm text-green-700">
                                        {result.fileName}
                                    </p>

                                </div>

                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                <ResultCard
                                    label="Total Rows"
                                    value={result.totalRows}
                                />

                                <ResultCard
                                    label="Successful"
                                    value={result.successfulRows}
                                />

                                <ResultCard
                                    label="Failed"
                                    value={result.failedRows}
                                />

                                <ResultCard
                                    label="Status"
                                    value={result.status}
                                />

                            </div>

                        </div>

                    )}


                    {/* Submit */}

                    <div className="flex justify-end">

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !file ||
                                !month ||
                                (!isTeamLeader && !teamId) ||
                                (!isTeamLeader && teamsLoading)
                            }
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                            <Upload size={18} />

                            {loading
                                ? "Importing..."
                                : "Validate & Import"}

                        </button>

                    </div>

                </form>

            </main>

        </div>
    );
}

/* Upload helper */

async function uploadFile<T>(
    endpoint: string,
    formData: FormData
): Promise<T> {

    const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5001";

    const token =
        localStorage.getItem("mis_token");

    const headers: HeadersInit = {};

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                method: "POST",
                headers,
                body: formData,
            }
        );

    if (!response.ok) {

        const error =
            await response.json()
                .catch(() => ({
                    message:
                        `Import failed (${response.status})`,
                }));

        throw new Error(
            error.message ||
            "Import failed"
        );
    }

    return response.json();
}


function ResultCard({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {

    return (
        <div className="bg-white rounded-lg p-4 border border-green-100">

            <p className="text-xs text-slate-500">
                {label}
            </p>

            <p className="text-xl font-bold text-slate-900 mt-1">
                {value}
            </p>

        </div>
    );
}


function formatMonth(
    value: string
) {

    const date =
        new Date(`${value}T00:00:00`);

    return date.toLocaleDateString(
        "en-IN",
        {
            month: "long",
            year: "numeric",
        }
    );
}


function formatFileSize(
    bytes: number
) {

    if (bytes < 1024 * 1024) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes / (1024 * 1024)
    ).toFixed(2)} MB`;
}