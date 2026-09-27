"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Subject } from "@/lib/types";
import { Breadcrumbs, EmptyState, ErrorBox } from "@/components/ui";

export default function SubjectsPage() {
  const [items, setItems] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sem, setSem] = useState("");
  useEffect(()=>{
    fetch("/api/subjects").then(async r=>{ if(!r.ok) throw new Error(); const j=await r.json(); setItems(j.items||[]); })
      .catch(()=>setError("We couldn't load subjects. Please try again.")).finally(()=>setLoading(false));
  },[]);
  const filtered = sem ? items.filter(s=>String(s.semester)===sem) : items;
  const sems = [...new Set(items.map(s=>s.semester).filter(Boolean))].sort((a,b)=>(a||0)-(b||0));
  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Subjects"}]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Subjects</h1>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sem-f" className="muted text-xs font-medium">Semester</label>
          <select id="sem-f" value={sem} onChange={e=>setSem(e.target.value)} className="focus-ring surface hairline rounded-lg border px-2.5 py-2 text-sm">
            <option value="">All</option>{sems.map(s=><option key={s} value={String(s)}>Sem {s}</option>)}
          </select>
        </div>
      </div>
      {error ? <div className="mt-4"><ErrorBox message={error} onRetry={()=>location.reload()} /></div>
      : loading ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton h-28 rounded-xl" />)}</div>
      : filtered.length===0 ? <div className="mt-4"><EmptyState icon={<BookOpen size={28}/>} title="No subjects found" body="No subjects match this filter yet." /></div>
      : <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map(s=>(
            <li key={s.id}>
              <Link href={`/subjects/${s.id}`} className="surface hairline card-hover focus-ring block rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">{s.code}</p>
                  {s.semester ? <span className="muted rounded-md border hairline px-1.5 py-0.5 text-[11px]">Sem {s.semester}</span> : null}
                </div>
                <p className="mt-1 font-bold">{s.name}</p>
                {s.description ? <p className="muted mt-1 text-[13px] line-clamp-2">{s.description}</p> : null}
                <p className="muted mt-2 text-xs font-medium">{s.resourceCount ?? 0} resources{s.department?` · ${s.department}`:""}</p>
              </Link>
            </li>
          ))}
        </ul>}
    </div>
  );
}
