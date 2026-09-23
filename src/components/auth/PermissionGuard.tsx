"use client";

import {
    useEffect
} from "react";

import {
    useRouter
} from "next/navigation";

import {
    useAuth
} from "./AuthProvider";

import {
    type Permission
} from "@/lib/permissions";


interface PermissionGuardProps {
    permission: Permission;
    children: React.ReactNode;
}


export default function PermissionGuard({
    permission,
    children
}: PermissionGuardProps) {

    const router =
        useRouter();

    const {
        loading,
        hasPermission
    } = useAuth();


    useEffect(() => {

        if (
            !loading &&
            !hasPermission(permission)
        ) {

            router.replace(
                "/dashboard"
            );
        }

    }, [
        loading,
        permission,
        hasPermission,
        router
    ]);


    if (loading) {

        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm text-slate-500">
                    Loading...
                </p>
            </div>
        );
    }


    if (!hasPermission(permission)) {
        return null;
    }


    return children;
}