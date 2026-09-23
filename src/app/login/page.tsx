"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CurrentUser } from "@/lib/auth";

import Link from "next/link";
export interface LoginResponse {
    success: boolean;
    data: {
        token: string;
        user: CurrentUser;
    };
}

export default function LoginPage() {

    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setLoading(true);
        setError("");

        try {

            const response =
                await apiFetch<LoginResponse>(
                    "/api/auth/login",
                    {
                        method: "POST",
                        auth: false,
                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );

            setToken(response.data.token);
            setUser(response.data.user);

            router.push("/dashboard");

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Login failed"
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-lg p-8">

                    <div className="mb-8 text-center">

                        <h1 className="text-3xl font-bold text-slate-900">
                            MIS Management
                        </h1>

                        <p className="text-slate-500 mt-2">
                            Management Information System
                        </p>

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        <div>

                            <label className="block text-sm font-medium mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="admin@mis.local"
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                        </div>

                        <div>

                            <label className="block text-sm font-medium mb-2">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="••••••••"
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition disabled:opacity-50"
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign In"}
                        </button>

                        <div className="text-center text-sm text-slate-500 mt-5">
                            Don't have an account?{" "}
                            <Link
                                href="/register"
                                className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Create organization
                            </Link>
                        </div>

                    </form>

                </div>

            </div>

        </main>
    );
}