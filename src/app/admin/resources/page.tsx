"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Archive, Star, Pencil, ExternalLink } from "lucide-react";
import type { Resource } from "@/lib/types";
import { Breadcrumbs, ErrorBox, EmptyState, TypeBadge } from "@/components/ui";
import { adminHeaders } from "@/lib/utils";

export default function AdminResources() {
  const [items, setItems] = useState<Resource[]>([]);
  const [status, setStatus] = useState("PENDING_REVIEW");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true); setError("");
    fetch(`/api/resources?status=${status}&pageSize=50`, { headers: adminHeaders() }).then(async r=>{
      if (r.status===403) throw new Error("Admin access required. Unlock in Settings.");
      if (!r.ok) throw new Error("load");
      const j = await r.json(); setItems(j.items||[]);
    }).catch((e)=>setError(e.message||"We couldn't load resources.")).finally(()=>setLoading(false));
  };
  useEffect(load,[status]);

  const act = async (id: string, patch: Record<string, unknown>, label: string) => {
    if (patch.status==="ARCHIVED" && !confirm("Archive this resource?")) return;
    const res = await fetch(`/api/resources/${id}`, { method:"PATCH", headers:{ "Content-Type":"application/json", ...adminHeaders() }, body: JSON.stringify(patch) });
    if (res.ok) { setMsg(`${label} done.`); load(); } else setMsg("Action failed.");
  };

  return (
    <div>
      <Breadcrumbs items={[{label:"Admin",href:"/admin"},{label:"Resource moderation"}]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">Resource moderation</h1>
        <select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Filter by status" className="focus-ring surface hairline ml-auto rounded-lg border px-2.5 py-2 text-sm">
          {["PENDING_REVIEW","PUBLISHED","DRAFT","ARCHIVED","REJECTED"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {msg && <p role="status" className="surface hairline mt-3 rounded-xl border p-2.5 text-sm">{msg}</p>}
      <div className="mt-3 space-y-2.5">
        {error ? <ErrorBox message={error} onRetry={load} />
        : loading ? <div className="skeleton h-40 rounded-xl" />
        : items.length===0 ? <EmptyState title={`No ${status.toLowerCase().replace("_"," ")} resources`} body="Nothing needs attention in this queue right now." />
        : items.map(r=>(
            <article key={r.id} className="surface hairline rounded-xl border p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={r.resourceType} />
                <span className="muted text-xs">{r.subjectCode} · {r.year||"—"} · {r.contributorName||r.contributorId}</span>
                {r.isFeatured && <span className="text-[11px] font-bold text-blue-600">★ Featured</span>}
              </div>
              <p className="mt-1.5 text-[15px] font-semibold">{r.title}</p>
              {r.description ? <p className="muted mt-0.5 text-[13px] line-clamp-2">{r.description}</p> : null}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Link href={`/resources/${r.id}`} className="focus-ring inline-flex items-center gap-1 rounded-lg border hairline px-2.5 py-1.5 text-xs font-medium"><ExternalLink size={12}/>View</Link>
                <Link href={`/add?id=${r.id}`} className="focus-ring inline-flex items-center gap-1 rounded-lg border hairline px-2.5 py-1.5 text-xs font-medium"><Pencil size={12}/>Edit</Link>
                {status!=="PUBLISHED" && <button onClick={()=>act(r.id,{status:"PUBLISHED"},"Approved")} className="focus-ring inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white"><Check size={12}/>Approve</button>}
                {status!=="REJECTED" && <button onClick={()=>act(r.id,{status:"REJECTED"},"Rejected")} className="focus-ring inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700"><X size={12}/>Reject</button>}
                {status!=="ARCHIVED" && <button onClick={()=>act(r.id,{status:"ARCHIVED"},"Archived")} className="focus-ring inline-flex items-center gap-1 rounded-lg border hairline px-2.5 py-1.5 text-xs font-medium"><Archive size={12}/>Archive</button>}
                <button onClick={()=>act(r.id,{isFeatured:!r.isFeatured},r.isFeatured?"Unfeatured":"Featured")} aria-pressed={r.isFeatured} className="focus-ring inline-flex items-center gap-1 rounded-lg border hairline px-2.5 py-1.5 text-xs font-medium"><Star size={12}/>{r.isFeatured?"Unfeature":"Feature"}</button>
                {r.isBroken && <button onClick={()=>act(r.id,{isBroken:false},"Marked fixed")} className="focus-ring rounded-lg border hairline px-2.5 py-1.5 text-xs font-medium">Clear broken flag</button>}
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
