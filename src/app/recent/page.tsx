"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Resource } from "@/lib/types";
import { getDeviceId } from "@/lib/utils";
import { Breadcrumbs, EmptyState, ErrorBox, ResourceCard, ResourceSkeleton } from "@/components/ui";
import { useSavedIds } from "@/components/browser";

export default function RecentPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { ids: saved, toggle } = useSavedIds();

  useEffect(()=>{
    fetch(`/api/history?deviceId=${getDeviceId()}`).then(async r=>{ if(!r.ok) throw new Error(); const j=await r.json(); setItems(j.items||[]); setError(""); })
      .catch(()=>setError("We couldn't load recent history.")).finally(()=>setLoading(false));
  },[refresh]);

  const load = () => { setLoading(true); setError(""); setNotice(""); setRefresh(x=>x+1); };

  const clear = async () => {
    if (!confirm("Clear your recently viewed history on this device?")) return;
    setNotice("");
    try {
      const res = await fetch(`/api/history?deviceId=${getDeviceId()}`, { method:"DELETE" });
      if (!res.ok) throw new Error();
      setItems([]);
    } catch { setNotice("Couldn't clear history. Please try again."); }
  };

  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Recent"}]} />
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Recently Viewed</h1>
        {items.length>0 && <button onClick={clear} className="focus-ring muted ml-auto rounded-lg border hairline px-3 py-1.5 text-sm surface hover:border-gray-400">Clear history</button>}
      </div>
      {notice && <p role="status" className="surface hairline mt-3 rounded-xl border p-3 text-sm">{notice}</p>}
      <div className="mt-4">
        {error ? <ErrorBox message={error} onRetry={load} />
        : loading ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><ResourceSkeleton key={i}/>)}</div>
        : items.length===0 ? <EmptyState icon={<Clock size={28}/>} title="You haven't opened any resources yet." body="Resources you open will appear here for quick access." action={<Link href="/resources" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Browse resources</Link>} />
        : <div className="grid gap-3 sm:grid-cols-2">{items.map(r=><ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>}
      </div>
    </div>
  );
}
