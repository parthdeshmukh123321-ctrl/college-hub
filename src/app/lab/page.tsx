"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import type { Resource } from "@/lib/types";
import { Breadcrumbs, ResourceCard, ResourceSkeleton } from "@/components/ui";
import { useSavedIds } from "@/components/browser";

const TABS = [
  { v: "LAB_MANUAL", label: "Lab Manuals" }, { v: "PRACTICAL", label: "Practicals" },
  { v: "VIVA", label: "Viva" }, { v: "", label: "All Lab" },
];

export default function LabPage() {
  return <Suspense fallback={<p className="muted text-sm">Loading…</p>}><LabInner /></Suspense>;
}
function LabInner() {
  const [tab, setTab] = useState("");
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids: saved, toggle } = useSavedIds();
  useEffect(()=>{
    setLoading(true);
    const types = tab ? `&type=${tab}` : "";
    // fetch lab-related types; when "all", fetch without type then filter client-side
    fetch(`/api/resources?pageSize=50${types}`).then(r=>r.json()).then(j=>{
      let list: Resource[] = j.items||[];
      if (!tab) list = list.filter(r=>["LAB_MANUAL","PRACTICAL","VIVA"].includes(r.resourceType));
      setItems(list);
    }).finally(()=>setLoading(false));
  },[tab]);
  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Lab / Practical"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Lab & Practical Hub</h1>
      <p className="muted mt-1 text-sm">Manuals, experiments, programs and viva questions. Student-contributed material is marked as such — verify against your official faculty manual.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Lab categories">
        {TABS.map(t=>(
          <button key={t.label} role="tab" aria-selected={tab===t.v} onClick={()=>setTab(t.v)}
            className={tab===t.v?"rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900":"surface hairline rounded-lg border px-3.5 py-2 text-sm font-medium"}>{t.label}</button>
        ))}
      </div>
      {loading ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><ResourceSkeleton key={i}/>)}</div>
      : items.length===0 ? <p className="muted surface hairline mt-4 rounded-xl border p-6 text-center text-sm">No lab resources yet. <Link href="/add" className="text-blue-600 underline">Contribute one</Link>.</p>
      : <div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map(r=><ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>}
    </div>
  );
}
