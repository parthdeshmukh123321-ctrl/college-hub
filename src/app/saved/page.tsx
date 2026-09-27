"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { Resource } from "@/lib/types";
import { getDeviceId } from "@/lib/utils";
import { Breadcrumbs, EmptyState, ErrorBox, ResourceCard, ResourceSkeleton } from "@/components/ui";
import { useSavedIds } from "@/components/browser";
import { RESOURCE_TYPE_LABELS } from "@/lib/types";

export default function SavedPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeF, setTypeF] = useState("");
  const [q, setQ] = useState("");
  const { toggle } = useSavedIds();
  const [refresh, setRefresh] = useState(0);

  useEffect(()=>{
    fetch(`/api/bookmarks?deviceId=${getDeviceId()}`).then(async r=>{ if(!r.ok) throw new Error(); const j=await r.json(); setItems(j.items||[]); setError(""); })
      .catch(()=>setError("We couldn't load saved resources.")).finally(()=>setLoading(false));
  },[refresh]);

  const retry = () => { setLoading(true); setError(""); setRefresh(x=>x+1); };

  const onToggle = async (id: string, next: boolean) => {
    const ok = await toggle(id, next);
    if (ok && !next) setItems(prev=>prev.filter(x=>x.id!==id));
  };

  const types = [...new Set(items.map(i=>i.resourceType))];
  const filtered = items.filter(r=>(!typeF||r.resourceType===typeF)&&(!q||(r.title+r.description).toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Saved"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Saved Resources</h1>
      <p className="muted mt-1 text-sm">Your bookmarks persist across visits on this device.</p>
      {items.length>0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter saved…" aria-label="Filter saved resources" className="focus-ring surface hairline min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm sm:max-w-xs" />
          <select value={typeF} onChange={e=>setTypeF(e.target.value)} aria-label="Filter by type" className="focus-ring surface hairline rounded-lg border px-2.5 py-2 text-sm">
            <option value="">All types</option>{types.map(t=><option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]||t}</option>)}
          </select>
        </div>
      )}
      <div className="mt-4">
        {error ? <ErrorBox message={error} onRetry={retry} />
        : loading ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><ResourceSkeleton key={i}/>)}</div>
        : items.length===0 ? <EmptyState icon={<Bookmark size={28}/>} title="No saved resources yet." body="Save resources here so you can find them quickly later." action={<Link href="/resources" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Browse resources</Link>} />
        : filtered.length===0 ? <EmptyState title="No matches" body="Try a different filter." />
        : <div className="grid gap-3 sm:grid-cols-2">{filtered.map(r=><ResourceCard key={r.id} r={r} saved onToggleSave={onToggle}/>)}</div>}
      </div>
    </div>
  );
}
