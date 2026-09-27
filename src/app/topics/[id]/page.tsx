"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { Resource } from "@/lib/types";
import { Breadcrumbs, EmptyState, ResourceCard, ResourceSkeleton } from "@/components/ui";
import { useSavedIds } from "@/components/browser";

export default function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState(id);
  const [subjectId, setSubjectId] = useState("");
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids: saved, toggle } = useSavedIds();

  useEffect(()=>{
    Promise.all([
      fetch("/api/topics").then(r=>r.json()).catch(()=>({items:[]})),
    ]).then(([t])=>{
      const found = (t.items||[]).find((x: {id:string;name:string;subjectId:string})=>x.id===id);
      const topicName = found?.name || id;
      setName(topicName);
      if (found) setSubjectId(found.subjectId);
      const usp = new URLSearchParams({ topic: topicName, pageSize: "50" });
      if (found) usp.set("subjectId", found.subjectId);
      return fetch(`/api/resources?${usp.toString()}`).then(r=>r.json());
    }).then(j=>setItems(j.items||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[id]);

  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Topics"},{label:name}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
      {subjectId && <Link href={`/subjects/${subjectId}`} className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">View subject →</Link>}
      <div className="mt-4">
        {loading ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><ResourceSkeleton key={i}/>)}</div>
        : items.length===0 ? <EmptyState title="No resources for this topic yet" body="Resources tagged with this topic will appear here." action={<Link href="/add" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add resource</Link>} />
        : <div className="grid gap-3 sm:grid-cols-2">{items.map(r=><ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>}
      </div>
    </div>
  );
}
