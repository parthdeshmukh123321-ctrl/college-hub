"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, FileWarning, Library, BookOpen, Bookmark, Activity } from "lucide-react";
import { Breadcrumbs, ErrorBox } from "@/components/ui";
import { adminHeaders } from "@/lib/utils";

interface Stats { totals: { resources: number; subjects: number; openReports: number; bookmarks: number }; byType: {label:string;count:number}[]; byStatus: {label:string;count:number}[]; bySubject: {label:string;count:number}[]; recent: {id:string;title:string;status:string;type:string;views:number;createdAt:string}[]; events: {label:string;count:number}[]; health: {db:string;time:string;schemaVersion:number} }

export default function AdminHome() {
  const [stats, setStats] = useState<Stats|null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    fetch("/api/admin", { headers: adminHeaders() }).then(async r=>{
      if (r.status===403) { setError("Admin access required. Unlock in Settings with your admin key."); setLoading(false); return; }
      if (!r.ok) throw new Error();
      setStats(await r.json()); setLoading(false);
    }).catch(()=>{ setError("We couldn't load admin data."); setLoading(false); });
  },[]);
  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Admin"}]} />
      <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"><ShieldCheck size={22}/>Admin</h1>
      <nav className="mt-3 flex flex-wrap gap-1.5" aria-label="Admin sections">
        {[["/admin","Overview"],["/admin/resources","Resources"],["/admin/reports","Reports"],["/admin/subjects","Subjects & Topics"],["/admin/academic","Academic"],["/settings","Settings"]].map(([h,l])=>(
          <Link key={h} href={h} className="surface hairline rounded-lg border px-3 py-2 text-sm font-medium hover:border-gray-400">{l}</Link>
        ))}
      </nav>
      <div className="mt-4">
        {loading ? <div className="grid gap-3 sm:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-24 rounded-xl"/>)}</div>
        : error ? <ErrorBox message={error} />
        : stats && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Library, label: "Resources", v: stats.totals.resources },
                { icon: BookOpen, label: "Subjects", v: stats.totals.subjects },
                { icon: FileWarning, label: "Open reports", v: stats.totals.openReports },
                { icon: Bookmark, label: "Bookmarks", v: stats.totals.bookmarks },
              ].map(c=>(
                <div key={c.label} className="surface hairline rounded-xl border p-4">
                  <p className="muted flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"><c.icon size={13}/>{c.label}</p>
                  <p className="mt-1 text-2xl font-extrabold">{c.v}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface hairline rounded-xl border p-4">
                <h2 className="text-sm font-bold">By status</h2>
                <ul className="mt-2 space-y-1.5">{stats.byStatus.map(b=><li key={b.label} className="flex justify-between text-sm"><span>{b.label}</span><span className="font-bold">{b.count}</span></li>)}</ul>
              </div>
              <div className="surface hairline rounded-xl border p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-bold"><Activity size={14}/>Access events</h2>
                <ul className="mt-2 space-y-1.5">{stats.events.map(b=><li key={b.label} className="flex justify-between text-sm"><span>{b.label}</span><span className="font-bold">{b.count}</span></li>)}{stats.events.length===0&&<li className="muted text-sm">No events tracked yet.</li>}</ul>
              </div>
              <div className="surface hairline rounded-xl border p-4">
                <h2 className="text-sm font-bold">By type</h2>
                <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto">{stats.byType.map(b=><li key={b.label} className="flex justify-between text-sm"><span>{b.label}</span><span className="font-bold">{b.count}</span></li>)}</ul>
              </div>
              <div className="surface hairline rounded-xl border p-4">
                <h2 className="text-sm font-bold">By subject</h2>
                <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto">{stats.bySubject.slice(0,12).map(b=><li key={b.label} className="flex justify-between gap-2 text-sm"><span className="truncate">{b.label}</span><span className="font-bold">{b.count}</span></li>)}</ul>
              </div>
            </div>
            <div className="surface hairline rounded-xl border p-4">
              <h2 className="text-sm font-bold">Recently added</h2>
              <ul className="mt-2 divide-y hairline">
                {stats.recent.map(r=><li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm"><Link href={`/resources/${r.id}`} className="truncate font-medium hover:underline">{r.title}</Link><span className="muted shrink-0 text-xs">{r.status} · {r.views} views</span></li>)}
              </ul>
              <p className="muted mt-2 text-xs">System health: DB {stats.health.db} · schema v{stats.health.schemaVersion} · {new Date(stats.health.time).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
