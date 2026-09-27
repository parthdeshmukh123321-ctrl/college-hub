"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { Resource } from "@/lib/types";
import { Breadcrumbs, EmptyState, ErrorBox, ResourceCard, ResourceSkeleton } from "@/components/ui";
import { useSavedIds } from "@/components/browser";

export default function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState(id);
  const [subjectId, setSubjectId] = useState("");
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const [tick, setTick] = useState(0);
  const { ids: saved, toggle } = useSavedIds();

  useEffect(()=>{
    const ctrl = new AbortController();
    fetch("/api/topics", { signal: ctrl.signal }).then(async r=>{
      if (!r.ok) throw new Error("topics");
      return r.json();
    }).then((t)=>{
      const found = (t.items||[]).find((x: {id:string;name:string;subjectId:string})=>x.id===id);
      if (!found) { setMissing(true); return null; }
      setName(found.name);
      setSubjectId(found.subjectId);
      const usp = new URLSearchParams({ topic: found.name, pageSize: "50", subjectId: found.subjectId });
      return fetch(`/api/resources?${usp.toString()}`, { signal: ctrl.signal }).then(async r=>{
        if (!r.ok) throw new Error("resources");
        return r.json();
      });
    }).then(j=>{ if (j) { setItems(j.items||[]); setError(""); } }
    ).catch((e)=>{ if (e?.name !== "AbortError") setError("We couldn't load this topic. Please try again."); }
    ).finally(()=>{ if (!ctrl.signal.aborted) setLoading(false); });
    return ()=>ctrl.abort();
  },[id, tick]);

  const retry = () => { setLoading(true); setError(""); setMissing(false); setTick(t=>t+1); };

  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Topics"},{label:name}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{missing ? "Topic not found" : name}</h1>
      {subjectId && !missing && <Link href={`/subjects/${subjectId}`} className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">View subject →</Link>}
      <div className="mt-4">
        {loading ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><ResourceSkeleton key={i}/>)}</div>
        : missing ? <EmptyState title="This topic doesn't exist." body="It may have been removed. Browse subjects to find related topics." action={<Link href="/subjects" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Browse subjects</Link>} />
        : error ? <ErrorBox message={error} onRetry={retry} />
        : items.length===0 ? <EmptyState title="No resources for this topic yet" body="Resources tagged with this topic will appear here." action={<Link href="/add" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add resource</Link>} />
        : <div className="grid gap-3 sm:grid-cols-2">{items.map(r=><ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>}
      </div>
    </div>
  );
}
