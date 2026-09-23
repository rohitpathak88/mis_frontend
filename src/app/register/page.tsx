"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Building2,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

interface RegisterResponse {
    success: boolean;
    message: string;
    data: {
        organizationId: number;
        organizationCode: string;
        userId: number;
    };
}

export default function RegisterPage() {

    const router = useRouter();

    const [organizationName, setOrganizationName] =
        useState("");

    const [adminName, setAdminName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState<RegisterResponse["data"] | null>(null);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setError("");
        setSuccess(null);

        if (password.length < 8) {

            setError(
                "Password must be at least 8 characters."
            );

            return;
        }

        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }

        try {

            setLoading(true);

            const response =
                await apiFetch<RegisterResponse>(
                    "/api/auth/register",
                    {
                        method: "POST",
                        auth: false,
                        body: JSON.stringify({
                            organizationName,
                            adminName,
                            email,
                            password,
                        }),
                    }
                );

            setSuccess(response.data);

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to create organization."
            );

        } finally {

            setLoading(false);

        }
    }

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

            <div className="w-full max-w-2xl">

                {/* Brand */}

                <div className="text-center mb-8">

                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4">
                        <Building2 size={25} />
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900">
                        MIS Manager
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Create your organization
                    </p>

                </div>


                {/* Card */}

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

                    {success ? (

                        <RegistrationSuccess
                            data={success}
                            onLogin={() =>
                                router.push("/login")
                            }
                        />

                    ) : (

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-7"
                        >

                            {/* Organization */}

                            <section>

                                <div className="flex items-center gap-3 mb-5">

                                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Building2 size={19} />
                                    </div>

                                    <div>

                                        <h2 className="font-semibold text-slate-900">
                                            Organization
                                        </h2>

                                        <p className="text-xs text-slate-500">
                                            Set up your organization
                                        </p>

                                    </div>

                                </div>

                                <InputField
                                    label="Organization Name"
                                    value={organizationName}
                                    onChange={setOrganizationName}
                                    placeholder="ABC Financial Services"
                                    icon={
                                        <Building2 size={17} />
                                    }
                                    required
                                />

                            </section>


                            {/* Administrator */}

                            <section>

                                <div className="flex items-center gap-3 mb-5">

                                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <User size={19} />
                                    </div>

                                    <div>

                                        <h2 className="font-semibold text-slate-900">
                                            Administrator
                                        </h2>

                                        <p className="text-xs text-slate-500">
                                            Create your administrator account
                                        </p>

                                    </div>

                                </div>

                                <div className="space-y-4">

                                    <InputField
                                        label="Full Name"
                                        value={adminName}
                                        onChange={setAdminName}
                                        placeholder="John Smith"
                                        icon={
                                            <User size={17} />
                                        }
                                        required
                                    />

                                    <InputField
                                        label="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={setEmail}
                                        placeholder="admin@company.com"
                                        icon={
                                            <Mail size={17} />
                                        }
                                        required
                                    />

                                    <PasswordField
                                        label="Password"
                                        value={password}
                                        onChange={setPassword}
                                        show={showPassword}
                                        setShow={setShowPassword}
                                        placeholder="Minimum 8 characters"
                                    />

                                    <PasswordField
                                        label="Confirm Password"
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                        show={showConfirmPassword}
                                        setShow={setShowConfirmPassword}
                                        placeholder="Re-enter your password"
                                    />

                                </div>

                            </section>


                            {/* Error */}

                            {error && (

                                <div className="flex gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">

                                    <AlertCircle
                                        size={19}
                                        className="flex-shrink-0 mt-0.5"
                                    />

                                    <p className="text-sm">
                                        {error}
                                    </p>

                                </div>

                            )}


                            {/* Submit */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                {loading
                                    ? "Creating organization..."
                                    : "Create Organization"}

                            </button>


                            {/* Login */}

                            <div className="text-center text-sm text-slate-500">

                                Already have an account?{" "}

                                <Link
                                    href="/login"
                                    className="text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    Sign in
                                </Link>

                            </div>

                        </form>

                    )}

                </div>

            </div>

        </main>
    );
}


/* Input */

function InputField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    icon,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    icon: React.ReactNode;
    required?: boolean;
}) {

    return (
        <div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
                {label}
            </label>

            <div className="relative">

                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </div>

                <input
                    type={type}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    placeholder={placeholder}
                    required={required}
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

            </div>

        </div>
    );
}


/* Password */

function PasswordField({
    label,
    value,
    onChange,
    show,
    setShow,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    setShow: (value: boolean) => void;
    placeholder: string;
}) {

    return (
        <div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
                {label}
            </label>

            <div className="relative">

                <Lock
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    placeholder={placeholder}
                    required
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-12 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                    type="button"
                    onClick={() =>
                        setShow(!show)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                    {show
                        ? <EyeOff size={18} />
                        : <Eye size={18} />
                    }
                </button>

            </div>

        </div>
    );
}


/* Success */

function RegistrationSuccess({
    data,
    onLogin,
}: {
    data: {
        organizationId: number;
        organizationCode: string;
        userId: number;
    };
    onLogin: () => void;
}) {

    return (
        <div className="text-center py-6">

            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={34} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
                Organization Created
            </h2>

            <p className="text-slate-500 mt-2">
                Your organization and administrator account
                have been created successfully.
            </p>

            <div className="bg-slate-50 rounded-xl p-5 mt-6 text-left space-y-4">

                <InfoRow
                    label="Organization ID"
                    value={String(data.organizationId)}
                />

                <InfoRow
                    label="Organization Code"
                    value={data.organizationCode}
                />

                <InfoRow
                    label="Administrator ID"
                    value={String(data.userId)}
                />

            </div>

            <button
                onClick={onLogin}
                className="w-full mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5"
            >
                Continue to Sign In
            </button>

        </div>
    );
}


function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {

    return (
        <div className="flex justify-between items-center gap-4">

            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span className="text-sm font-semibold text-slate-900 font-mono">
                {value}
            </span>

        </div>
    );
}