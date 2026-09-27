"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText, FileQuestion, FlaskConical, Layers, ClipboardList, BookOpen, Video, Globe, ChevronRight, Clock, Sparkles } from "lucide-react";
import type { Resource, Subject } from "@/lib/types";
import { getDeviceId } from "@/lib/utils";
import { ResourceCard, ResourceSkeleton } from "@/components/ui";
import { useSavedIds } from "@/components/browser";

const QUICK = [
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "PYQs", href: "/pyqs", icon: FileQuestion },
  { label: "Lab Manuals", href: "/lab", icon: FlaskConical },
  { label: "Question Banks", href: "/question-banks", icon: Layers },
  { label: "Assignments", href: "/resources?type=ASSIGNMENT", icon: ClipboardList },
  { label: "Syllabus", href: "/resources?type=SYLLABUS", icon: BookOpen },
  { label: "Videos", href: "/resources?type=VIDEO", icon: Video },
  { label: "Websites", href: "/resources?type=WEBSITE", icon: Globe },
];

function HomeInner() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [viewed, setViewed] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids: saved, toggle } = useSavedIds();

  useEffect(()=>{
    Promise.all([
      fetch("/api/resources?pageSize=6&sort=newest").then(r=>r.json()).catch(()=>({items:[]})),
      fetch("/api/subjects").then(r=>r.json()).catch(()=>({items:[]})),
      fetch(`/api/history?deviceId=${getDeviceId()}`).then(r=>r.json()).catch(()=>({items:[]})),
    ]).then(([r, s, h])=>{
      setRecent(r.items||[]); setSubjects((s.items||[]).slice(0,8)); setViewed((h.items||[]).slice(0,4));
    }).finally(()=>setLoading(false));
  },[]);

  return (
    <div>
      <section className="pb-2 pt-4 text-center sm:pt-8" aria-labelledby="home-title">
        <h1 id="home-title" className="text-2xl font-extrabold tracking-tight sm:text-4xl">College Resource Hub</h1>
        <p className="muted mx-auto mt-2 max-w-xl text-sm sm:text-base">Find the notes, PYQs, lab manuals and academic resources you need.</p>
        <form role="search" className="mx-auto mt-5 max-w-2xl" onSubmit={e=>{e.preventDefault(); router.push(`/search?q=${encodeURIComponent(q.trim())}`);}}>
          <label htmlFor="home-q" className="sr-only">Search resources</label>
          <div className="surface hairline flex items-center gap-2 rounded-2xl border p-2 pl-4 shadow-sm focus-within:border-blue-500">
            <Search size={18} className="muted shrink-0" aria-hidden />
            <input id="home-q" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search notes, PYQs, subjects, topics…" className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:text-gray-400" autoComplete="off" />
            <button type="submit" className="focus-ring shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:px-6">Search</button>
          </div>
          <p className="muted mt-2 text-xs">Try “m1 pyq”, “fpl practical”, “chemistry notes” · Press <kbd className="rounded border hairline px-1">Ctrl K</kbd> anywhere</p>
        </form>
      </section>

      <section className="mt-6" aria-labelledby="quick-cat">
        <h2 id="quick-cat" className="text-sm font-bold uppercase tracking-wide muted">Quick categories</h2>
        <ul className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {QUICK.map(c=>(
            <li key={c.label}>
              <Link href={c.href} className="surface hairline card-hover focus-ring flex items-center gap-2.5 rounded-xl border p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10" aria-hidden><c.icon size={17}/></span>
                <span className="text-sm font-semibold">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="recent-res">
        <div className="flex items-center justify-between">
          <h2 id="recent-res" className="flex items-center gap-1.5 text-base font-bold"><Sparkles size={16} aria-hidden />Recent resources</h2>
          <Link href="/resources?sort=newest" className="focus-ring inline-flex items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View all <ChevronRight size={14}/></Link>
        </div>
        {loading ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><ResourceSkeleton key={i}/>)}</div>
        : recent.length===0 ? <p className="muted surface hairline mt-3 rounded-xl border p-6 text-center text-sm">No resources yet. <Link href="/add" className="text-blue-600 underline dark:text-blue-400">Add the first one</Link>.</p>
        : <div className="mt-3 grid gap-3 sm:grid-cols-2">{recent.map(r=><ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>}
      </section>

      <section className="mt-8" aria-labelledby="pop-sub">
        <div className="flex items-center justify-between">
          <h2 id="pop-sub" className="text-base font-bold">Popular subjects</h2>
          <Link href="/subjects" className="focus-ring inline-flex items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">All subjects <ChevronRight size={14}/></Link>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {subjects.map(s=>(
            <li key={s.id}>
              <Link href={`/subjects/${s.id}`} className="surface hairline card-hover focus-ring block rounded-xl border p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">{s.code}</p>
                <p className="mt-0.5 truncate text-sm font-semibold">{s.name}</p>
                <p className="muted mt-1 text-xs">{s.resourceCount ?? 0} resources{s.semester?` · Sem ${s.semester}`:""}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {viewed.length>0 && (
        <section className="mt-8" aria-labelledby="recently-viewed">
          <div className="flex items-center justify-between">
            <h2 id="recently-viewed" className="flex items-center gap-1.5 text-base font-bold"><Clock size={16} aria-hidden />Recently viewed</h2>
            <Link href="/recent" className="focus-ring inline-flex items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View all <ChevronRight size={14}/></Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{viewed.map(r=><ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={toggle}/>)}</div>
        </section>
      )}
    </div>
  );
}

export default function HomePage() {
  return <Suspense fallback={<div className="grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><ResourceSkeleton key={i}/>)}</div>}><HomeInner /></Suspense>;
}
