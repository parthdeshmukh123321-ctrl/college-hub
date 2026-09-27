"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Report } from "@/lib/types";
import { Breadcrumbs, ErrorBox, EmptyState } from "@/components/ui";
import { adminHeaders } from "@/lib/utils";

export default function AdminReports() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(()=>{
    fetch("/api/reports", { headers: adminHeaders() }).then(async r=>{
      if (r.status===403) throw new Error("Admin access required. Unlock in Settings.");
      if (!r.ok) throw new Error("load");
      const j = await r.json(); setItems(j.items||[]); setError("");
    }).catch((e)=>setError(e.message||"We couldn't load reports.")).finally(()=>setLoading(false));
  },[tick]);
  const load = () => { setLoading(true); setError(""); setTick(t=>t+1); };
  const resolve = async (rep: Report, status: string, clearBroken = false) => {
    const res = await fetch(`/api/reports?id=${rep.id}`, { method:"PATCH", headers:{ "Content-Type":"application/json", ...adminHeaders() }, body: JSON.stringify({ status, clearBroken, resourceId: rep.resourceId }) });
    if (res.ok) { setMsg(`Report ${status.toLowerCase()}.`); load(); } else setMsg("Action failed.");
  };
  const open = items.filter(i=>i.status==="OPEN");
  const done = items.filter(i=>i.status!=="OPEN");
  return (
    <div>
      <Breadcrumbs items={[{label:"Admin",href:"/admin"},{label:"Reports"}]} />
      <h1 className="text-xl font-bold tracking-tight">Reports ({open.length} open)</h1>
      {msg && <p role="status" className="surface hairline mt-3 rounded-xl border p-2.5 text-sm">{msg}</p>}
      <div className="mt-3">
        {error ? <ErrorBox message={error} onRetry={load} /> : loading ? <div className="skeleton h-40 rounded-xl" />
        : items.length===0 ? <EmptyState title="No reports" body="Nobody has reported a resource yet." />
        : <div className="space-y-2.5">
            {[...open, ...done].map(rep=>(
              <article key={rep.id} className="surface hairline rounded-xl border p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={rep.status==="OPEN"?"rounded-md bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300":"rounded-md bg-gray-100 px-1.5 py-0.5 font-semibold muted dark:bg-white/10"}>{rep.status}</span>
                  <span className="font-semibold">{rep.reason}</span>
                  <span className="muted">{new Date(rep.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1.5 text-sm font-semibold"><Link href={`/resources/${rep.resourceId}`} className="hover:underline">{rep.resourceTitle}</Link></p>
                {rep.description ? <p className="muted mt-0.5 text-[13px]">{rep.description}</p> : null}
                {rep.status==="OPEN" && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <button onClick={()=>resolve(rep,"RESOLVED")} className="focus-ring rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Resolve</button>
                    {rep.reason==="Broken resource" && <button onClick={()=>resolve(rep,"RESOLVED",true)} className="focus-ring rounded-lg border hairline px-3 py-1.5 text-xs font-medium">Resolve + clear broken flag</button>}
                    <button onClick={()=>resolve(rep,"DISMISSED")} className="focus-ring rounded-lg border hairline px-3 py-1.5 text-xs font-medium">Dismiss</button>
                  </div>
                )}
              </article>
            ))}
          </div>}
      </div>
    </div>
  );
}
