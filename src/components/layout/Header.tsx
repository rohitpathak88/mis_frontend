"use client";

import { Bell } from "lucide-react";

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({
    title,
    subtitle,
}: HeaderProps) {

    return (
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">

            <div>

                <h1 className="text-xl font-bold text-slate-900">
                    {title}
                </h1>

                {subtitle && (
                    <p className="text-sm text-slate-500 mt-1">
                        {subtitle}
                    </p>
                )}

            </div>

            <div className="flex items-center gap-5">

                <button className="relative text-slate-500 hover:text-slate-800">

                    <Bell size={20} />

                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />

                </button>

            </div>

        </header>
    );
}