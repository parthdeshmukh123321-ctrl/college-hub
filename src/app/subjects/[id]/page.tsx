"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { Resource, Subject, Topic } from "@/lib/types";
import { RESOURCE_TYPE_LABELS } from "@/lib/types";
import { Breadcrumbs, EmptyState, ErrorBox, ResourceCard } from "@/components/ui";
import { useSavedIds } from "@/components/browser";

export default function SubjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [subject, setSubject] = useState<Subject|null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [byType, setByType] = useState<Record<string,number>>({});
  const [latest, setLatest] = useState<Resource[]>([]);
  const [popular, setPopular] = useState<Resource[]>([]);
  const [state, setState] = useState<"loading"|"ok"|"missing"|"error">("loading");
  const { ids: saved, toggle } = useSavedIds();

  useEffect(()=>{
    fetch(`/api/subjects/${id}`).then(async r=>{
      if (r.status===404) { setState("missing"); return; }
      if (!r.ok) throw new Error();
      const j = await r.json();
      setSubject(j.subject); setTopics(j.topics||[]); setByType(j.byType||{}); setLatest(j.latest||[]); setPopular(j.popular||[]);
      setState("ok");
    }).catch(()=>setState("error"));
  },[id]);

  if (state==="loading") return <div className="space-y-3"><div className="skeleton h-8 w-1/2 rounded"/><div className="skeleton h-32 rounded-xl"/><div className="skeleton h-40 rounded-xl"/></div>;
  if (state==="missing") return <EmptyState icon={<BookOpen size={28}/>} title="Subject not found." body="It may have been removed." action={<Link href="/subjects" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Back to Subjects</Link>} />;
  if (state==="error"||!subject) return <ErrorBox message="We couldn't load this subject. Please try again." onRetry={()=>location.reload()} />;

  return (
    <div>
      <Breadcrumbs items={[{label:"Subjects",href:"/subjects"},{label:subject.name}]} />
      <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">{subject.code}{subject.semester?` · Semester ${subject.semester}`:""}{subject.department?` · ${subject.department}`:""}</p>
      <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">{subject.name}</h1>
      {subject.description ? <p className="muted mt-1.5 max-w-2xl text-sm">{subject.description}</p> : null}
      <p className="muted mt-2 text-sm font-medium" role="status">{subject.resourceCount ?? 0} resources</p>

      <div className="surface hairline mt-4 rounded-xl border p-4">
        <h2 className="text-sm font-bold">Browse by type</h2>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([t,c])=>(
            <Link key={t} href={`/resources?subjectId=${subject.id}&type=${t}`} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border hairline px-2.5 py-1.5 text-[13px] font-medium hover:border-gray-400">
              {RESOURCE_TYPE_LABELS[t]||t}<span className="muted rounded-full bg-gray-100 px-1.5 text-[11px] font-bold dark:bg-white/10">{c}</span>
            </Link>
          ))}
          {Object.keys(byType).length===0 && <p className="muted text-sm">No resources have been added for this subject yet.</p>}
        </div>
        <Link href={`/resources?subjectId=${subject.id}`} className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View all resources for {subject.code} →</Link>
      </div>

      {topics.length>0 && (
        <div className="surface hairline mt-3 rounded-xl border p-4">
          <h2 className="text-sm font-bold">Topics</h2>
          <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {topics.map(t=>(
              <li key={t.id}>
                <Link href={`/resources?subjectId=${subject.id}&topic=${encodeURIComponent(t.name)}`} className="focus-ring block rounded-lg border hairline p-3 hover:border-gray-400">
                  <p className="text-sm font-semibold">{t.name}</p>
                  {t.description ? <p className="muted mt-0.5 text-xs line-clamp-2">{t.description}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {latest.length>0 && (
        <section className="mt-6" aria-labelledby="lat"><h2 id="lat" className="text-base font-bold">Latest resources</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{latest.map(r=><ResourceCard key={r.id} r={{...r,subjectName:subject.name,subjectCode:subject.code}} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>
        </section>
      )}
      {popular.length>0 && (
        <section className="mt-6" aria-labelledby="pop"><h2 id="pop" className="text-base font-bold">Most viewed</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{popular.map(r=><ResourceCard key={r.id} r={{...r,subjectName:subject.name,subjectCode:subject.code}} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>
        </section>
      )}
      {latest.length===0 && <div className="mt-4"><EmptyState title={`No resources for ${subject.code} yet`} body="Be the first to contribute notes, PYQs or lab material for this subject." action={<Link href={`/add?subjectId=${subject.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add resource</Link>} /></div>}
      <Link href="/subjects" className="muted mt-6 inline-flex items-center gap-1 text-sm hover:underline"><ArrowLeft size={14}/>All subjects</Link>
    </div>
  );
}
