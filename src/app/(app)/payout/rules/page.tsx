"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

interface Rule { id:number; minAmount:number|string; maxAmount:number|string|null; payoutRate:number|string; effectiveFrom:string; status:string; }
const money=(v:number|string|null)=>v===null?"No upper limit":Number(v).toLocaleString("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
export default function RulesPage(){
 const {user}=useAuth(); const [rules,setRules]=useState<Rule[]>([]); const [form,setForm]=useState({minAmount:"",maxAmount:"",payoutRate:""}); const [error,setError]=useState("");
 const load=async()=>{try{const r=await apiFetch<{data:Rule[]}>("/api/payout/rules");setRules(r.data||[]);}catch(e){setError(e instanceof Error?e.message:"Unable to load rules");}};
 useEffect(()=>{load();},[]);
 const add=async()=>{try{setError("");await apiFetch("/api/payout/rules",{method:"POST",body:JSON.stringify({minAmount:Number(form.minAmount),maxAmount:form.maxAmount?Number(form.maxAmount):null,payoutRate:Number(form.payoutRate)})});setForm({minAmount:"",maxAmount:"",payoutRate:""});await load();}catch(e){setError(e instanceof Error?e.message:"Unable to create rule");}};
 if(user?.role!=="ORG_ADMIN") return <div><Header title="Payout Rules" subtitle="Configured payout rates"/><main className="p-8"><div className="rounded-xl bg-white border p-6">Only organization administrators can manage payout rules.</div></main></div>;
 return <div><Header title="Payout Rules" subtitle="Configure the Team Leader payout rate slabs"/><main className="p-8"><p className="text-sm text-slate-500 mb-5">V1 uses the applicable rate on the total approved amount.</p>{error&&<div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>}
 <div className="bg-white border rounded-xl p-5 mb-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-3"><input placeholder="Minimum amount" value={form.minAmount} onChange={e=>setForm({...form,minAmount:e.target.value})} className="border rounded-lg px-3 py-2"/><input placeholder="Maximum amount (optional)" value={form.maxAmount} onChange={e=>setForm({...form,maxAmount:e.target.value})} className="border rounded-lg px-3 py-2"/><input placeholder="Rate %" value={form.payoutRate} onChange={e=>setForm({...form,payoutRate:e.target.value})} className="border rounded-lg px-3 py-2"/><button onClick={add} className="rounded-lg bg-blue-600 text-white font-semibold px-4 py-2">Add Rule</button></div></div>
 <div className="bg-white border rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-4">Range</th><th className="text-left p-4">Rate</th><th className="text-left p-4">Effective From</th><th className="text-left p-4">Status</th></tr></thead><tbody>{rules.map(r=><tr key={r.id} className="border-t"><td className="p-4">{money(r.minAmount)} – {money(r.maxAmount)}</td><td className="p-4 font-semibold">{r.payoutRate}%</td><td className="p-4">{new Date(r.effectiveFrom).toLocaleDateString("en-IN")}</td><td className="p-4">{r.status}</td></tr>)}</tbody></table></div>
 </main></div>;
}
