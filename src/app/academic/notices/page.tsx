"use client";
import { useState } from "react";
import { Breadcrumbs } from "@/components/ui";
import { AcademicTabs, OfficialTag, useAcademic, ErrorBox, EmptyState } from "@/components/academic";

export default function NoticesPage() {
  const { data, loading, error } = useAcademic();
  const [cat, setCat] = useState("");
  const cats = [...new Set(data.notices.map(n=>n.category))];
  const items = (cat?data.notices.filter(n=>n.category===cat):data.notices).slice().sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <div>
      <Breadcrumbs items={[{label:"Academic",href:"/academic"},{label:"Notices"}]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Notices</h1>
        <select value={cat} onChange={e=>setCat(e.target.value)} aria-label="Filter by category" className="focus-ring surface hairline ml-auto rounded-lg border px-2.5 py-2 text-sm">
          <option value="">All categories</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="mt-3"><AcademicTabs active="notices" /></div>
      <div className="mt-4 space-y-3">
        {error ? <ErrorBox message={error} /> : loading ? <div className="skeleton h-64 rounded-xl" />
        : items.length===0 ? <EmptyState title="No notices" body="No notices have been published yet." />
        : items.map(n=>(
            <article key={n.id} className="surface hairline rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-[15px] font-bold">{n.title}</h2>
                <OfficialTag official={n.isOfficial} source={n.source} />
              </div>
              <p className="muted mt-0.5 text-xs">{n.date} · {n.category}{n.source?` · ${n.source}`:""}</p>
              {n.content ? <p className="prose-safe mt-2 text-sm leading-relaxed">{n.content}</p> : null}
              {n.sourceUrl ? <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[13px] font-medium text-blue-600 hover:underline dark:text-blue-400">View original source</a> : null}
            </article>
          ))}
      </div>
    </div>
  );
}
