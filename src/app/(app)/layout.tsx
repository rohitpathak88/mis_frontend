import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100">

            <Sidebar />

            <div className="ml-64 min-h-screen">
                {children}
            </div>

        </div>
    );
}