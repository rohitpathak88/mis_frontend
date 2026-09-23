import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
    title: "MIS Platform",
    description: "MIS Management & Analytics Platform"
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}