"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

interface Period { id:number; periodMonth:string; status:string; }
interface HistoryRow { id:number; periodId:number; periodMonth:string; teamName:string; teamLeaderName:string; totalApprovedAmount:number|string; payoutRate:number|string; payoutAmount:number|string; status:string; calculatedAt:string; approvedAt?:string|null; paidAt?:string|null; }

const money = (v:number|string) => Number(v || 0).toLocaleString("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:2 });
const monthLabel = (v:string) => new Date(`${v}T00:00:00`).toLocaleDateString("en-IN", { month:"long", year:"numeric" });
const dateLabel = (v?:string|null) => v ? new Date(v).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "-";

export default function PayoutPage() {
    const { user } = useAuth();
    const isAdmin = ["ORG_ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "");
    const [periods,setPeriods]=useState<Period[]>([]);
    const [history,setHistory]=useState<HistoryRow[]>([]);
    const [month,setMonth]=useState("");
    const [loading,setLoading]=useState(true);
    const [working,setWorking]=useState(false);
    const [error,setError]=useState("");

    const load=async()=>{
        try {
            setLoading(true); setError("");
            if (isAdmin) {
                const r=await apiFetch<{success:boolean;data:Period[]}>("/api/payout/periods");
                setPeriods(r.data||[]);
            } else {
                const r=await apiFetch<{success:boolean;data:HistoryRow[]}>("/api/payout/history");
                setHistory(r.data||[]);
            }
        } catch(e){setError(e instanceof Error?e.message:"Unable to load payout history");}
        finally{setLoading(false);}
    };
    useEffect(()=>{ if(user) load(); },[user]);

    const create=async()=>{
        if(!month)return;
        try{setWorking(true);setError("");await apiFetch("/api/payout/periods",{method:"POST",body:JSON.stringify({periodMonth:`${month}-01`})});setMonth("");await load();}
        catch(e){setError(e instanceof Error?e.message:"Unable to create period");}
        finally{setWorking(false);}
    };

    if (!isAdmin) return <div><Header title="Payout History" subtitle="Your payout history"/><main className="p-8">
        {error&&<div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        <div className="mb-6"><h2 className="text-xl font-semibold">My Payout History</h2><p className="text-sm text-slate-500 mt-1">Only payout records belonging to your user account are shown.</p></div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left px-5 py-3">Period</th><th className="text-left px-5 py-3">Team</th><th className="text-right px-5 py-3">Approved Amount</th><th className="text-right px-5 py-3">Rate</th><th className="text-right px-5 py-3">Payout</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Paid Date</th></tr></thead><tbody>
            {loading?<tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>:history.length===0?<tr><td colSpan={7} className="p-8 text-center text-slate-500">No payout history found.</td></tr>:history.map(p=><tr key={p.id} className="border-t"><td className="px-5 py-4 font-medium">{monthLabel(p.periodMonth)}</td><td className="px-5 py-4">{p.teamName}</td><td className="px-5 py-4 text-right">{money(p.totalApprovedAmount)}</td><td className="px-5 py-4 text-right">{p.payoutRate}%</td><td className="px-5 py-4 text-right font-semibold">{money(p.payoutAmount)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{p.status}</span></td><td className="px-5 py-4">{dateLabel(p.paidAt)}</td></tr>)}
            </tbody></table></div>
        </div>
    </main></div>;

    return <div><Header title="Payout" subtitle="Team Leader payout based on approved amounts"/><main className="p-8">
        {error&&<div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        <div className="mb-6 flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">Payout Periods</h2><p className="text-sm text-slate-500 mt-1">Approved transactions are grouped by bank approval date.</p></div><div className="flex gap-2"><input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border rounded-lg px-3 py-2 bg-white"/><button disabled={!month||working} onClick={create} className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold disabled:opacity-50">Create Period</button></div></div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left px-5 py-3">Period</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Action</th></tr></thead><tbody>
        {loading?<tr><td colSpan={3} className="p-8 text-center text-slate-500">Loading...</td></tr>:periods.length===0?<tr><td colSpan={3} className="p-8 text-center text-slate-500">No payout periods yet.</td></tr>:periods.map(p=><tr key={p.id} className="border-t"><td className="px-5 py-4 font-medium">{monthLabel(p.periodMonth)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{p.status}</span></td><td className="px-5 py-4"><Link href={`/payout/${p.id}`} className="text-blue-600 font-medium">View</Link></td></tr>)}
        </tbody></table></div><div className="mt-5"><Link href="/payout/rules" className="text-sm text-blue-600 font-medium">Manage payout rules →</Link></div>
    </main></div>;
}
