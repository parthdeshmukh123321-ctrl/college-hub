"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS, type Resource, type Subject, type SortKey } from "@/lib/types";
import { getDeviceId, cx } from "@/lib/utils";
import { ResourceCard, ResourceSkeleton, SearchEmpty, ErrorBox, Pagination, useLocalState } from "./ui";

interface Props {
  baseType?: string; // lock a resource type (notes/pyq hubs)
  showSearchInput?: boolean;
  pageSize?: number;
  title?: string;
  hideTypeFilter?: boolean;
}

const SORTS: { v: SortKey; label: string }[] = [
  { v: "relevance", label: "Relevance" }, { v: "newest", label: "Newest" }, { v: "oldest", label: "Oldest" },
  { v: "updated", label: "Recently updated" }, { v: "viewed", label: "Most viewed" },
];

export function useSavedIds() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(()=>{
    const d = getDeviceId();
    fetch(`/api/bookmarks?deviceId=${d}`).then(r=>r.json()).then(j=>setIds(j.ids||[])).catch(()=>{});
  },[]);
  const toggle = useCallback(async (id: string, next: boolean): Promise<boolean> => {
    const d = getDeviceId();
    setIds(prev => next ? [...new Set([...prev, id])] : prev.filter(x=>x!==id));
    try {
      const res = next
        ? await fetch("/api/bookmarks", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ deviceId: d, resourceId: id }) })
        : await fetch(`/api/bookmarks?deviceId=${d}&resourceId=${id}`, { method:"DELETE" });
      if (!res.ok) throw new Error("toggle failed");
      return true;
    } catch {
      // roll back the optimistic update so the UI never lies about saved state
      setIds(prev => next ? prev.filter(x=>x!==id) : [...new Set([...prev, id])]);
      return false;
    }
  },[]);
  return { ids: new Set(ids), toggle };
}

export function ResourceBrowser({ baseType, showSearchInput, pageSize = 24, title, hideTypeFilter }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [items, setItems] = useState<Resource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [view, setView] = useLocalState<"grid"|"list">("crh_view", "grid");
  const { ids: saved, toggle } = useSavedIds();
  const debounceRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const tagDebRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const q = sp.get("q") || "";
  const [localQ, setLocalQ] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) { setPrevQ(q); setLocalQ(q); }

  const params = useMemo(()=>({
    q, subjectId: sp.get("subjectId")||"", type: baseType || sp.get("type")||"",
    semester: sp.get("semester")||"", year: sp.get("year")||"", academicYear: sp.get("academicYear")||"",
    tag: sp.get("tag")||"", topic: sp.get("topic")||"", source: sp.get("source")||"",
    examType: sp.get("examType")||"", sort: (sp.get("sort")||"") as SortKey, page: Number(sp.get("page"))||1,
  }),[sp, q, baseType]);

  const [localTag, setLocalTag] = useState(params.tag);
  const [prevTag, setPrevTag] = useState(params.tag);
  if (params.tag !== prevTag) { setPrevTag(params.tag); setLocalTag(params.tag); }

  useEffect(()=>{ fetch("/api/subjects").then(r=>r.json()).then(j=>setSubjects(j.items||[])).catch(()=>{}); },[]);

  useEffect(()=>{
    const ctrl = new AbortController();
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.subjectId) usp.set("subjectId", params.subjectId);
    if (params.type) usp.set("type", params.type);
    if (params.semester) usp.set("semester", params.semester);
    if (params.year) usp.set("year", params.year);
    if (params.academicYear) usp.set("academicYear", params.academicYear);
    if (params.tag) usp.set("tag", params.tag);
    if (params.topic) usp.set("topic", params.topic);
    if (params.source) usp.set("source", params.source);
    if (params.examType) usp.set("examType", params.examType);
    if (params.sort) usp.set("sort", params.sort);
    usp.set("page", String(params.page)); usp.set("pageSize", String(pageSize));
    fetch(`/api/resources?${usp.toString()}`, { signal: ctrl.signal }).then(async r=>{
      if (!r.ok) throw new Error("load");
      const j = await r.json();
      setItems(j.items||[]); setTotal(j.total||0); setError("");
    }).catch((e)=>{ if (e?.name !== "AbortError") setError("We couldn't load resources. Please try again."); }
    ).finally(()=>{ if (!ctrl.signal.aborted) setLoading(false); });
    return ()=>ctrl.abort();
  },[params, pageSize, retryTick]);

  useEffect(()=>{
    if (!filtersOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    window.addEventListener("keydown", fn); return ()=>window.removeEventListener("keydown", fn);
  },[filtersOpen]);

  const navigate = (usp: URLSearchParams) => {
    setLoading(true); setError("");
    router.push(`?${usp.toString()}`, { scroll: false });
  };
  const setParam = (k: string, v: string) => {
    const usp = new URLSearchParams(sp.toString());
    if (v) usp.set(k, v); else usp.delete(k);
    if (k !== "page") usp.delete("page");
    navigate(usp);
  };
  const clearAll = () => {
    const usp = new URLSearchParams();
    if (baseType) usp.set("type", baseType);
    setLocalQ(""); setLocalTag("");
    navigate(usp);
  };
  const retry = () => { setLoading(true); setError(""); setRetryTick(t=>t+1); };
  const activeCount = [params.subjectId,params.type&&!baseType?params.type:"",params.semester,params.year,params.tag,params.source,params.examType,params.topic].filter(Boolean).length + (params.q?1:0);

  const onSearchChange = (v: string) => {
    setLocalQ(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(()=>setParam("q", v.trim()), 350);
  };
  const onTagChange = (v: string) => {
    setLocalTag(v);
    if (tagDebRef.current) clearTimeout(tagDebRef.current);
    tagDebRef.current = setTimeout(()=>setParam("tag", v.trim()), 350);
  };

  const years = useMemo(()=>{ const y = new Date().getFullYear(); return Array.from({length:8},(_,i)=>y-i); },[]);

  const filterPanel = (
    <div className="space-y-4">
      {!hideTypeFilter && !baseType && (
        <div><label htmlFor="f-type" className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Type</label>
          <select id="f-type" value={params.type} onChange={e=>setParam("type", e.target.value)} className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm">
            <option value="">All types</option>{RESOURCE_TYPES.map(t=><option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>)}
          </select></div>
      )}
      <div><label htmlFor="f-sub" className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Subject</label>
        <select id="f-sub" value={params.subjectId} onChange={e=>setParam("subjectId", e.target.value)} className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm">
          <option value="">All subjects</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
        </select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor="f-sem" className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Sem</label>
          <select id="f-sem" value={params.semester} onChange={e=>setParam("semester", e.target.value)} className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm">
            <option value="">All</option>{[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}
          </select></div>
        <div><label htmlFor="f-year" className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Year</label>
          <select id="f-year" value={params.year} onChange={e=>setParam("year", e.target.value)} className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm">
            <option value="">All</option>{years.map(y=><option key={y} value={y}>{y}</option>)}
          </select></div>
      </div>
      <div><label htmlFor="f-src" className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Source</label>
        <select id="f-src" value={params.source} onChange={e=>setParam("source", e.target.value)} className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm">
          <option value="">All sources</option><option value="FILE">Uploaded file</option><option value="LINK">External link</option>
        </select></div>
      {(baseType==="PYQ"||params.type==="PYQ") && (
        <div><label htmlFor="f-exam" className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Exam type</label>
          <select id="f-exam" value={params.examType} onChange={e=>setParam("examType", e.target.value)} className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm">
            <option value="">All</option>{["Unit Test","Mid Semester","End Semester","University","Practical","Other"].map(t=><option key={t} value={t}>{t}</option>)}
          </select></div>
      )}
      <div><label htmlFor="f-tag" className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Tag</label>
        <input id="f-tag" value={localTag} onChange={e=>onTagChange(e.target.value)} placeholder="e.g. matrices" className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm" /></div>
      {activeCount>0 && <button onClick={clearAll} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm font-medium surface hover:border-gray-400"><X size={14}/>Clear filters ({activeCount})</button>}
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      {title && <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>}
      {showSearchInput && (
        <form className="mt-3" role="search" onSubmit={e=>e.preventDefault()}>
          <label htmlFor="br-q" className="sr-only">Search resources</label>
          <input id="br-q" value={localQ} onChange={e=>onSearchChange(e.target.value)} placeholder="Search notes, PYQs, subjects, topics…" className="focus-ring surface hairline w-full rounded-xl border px-4 py-3 text-[15px]" autoComplete="off" />
        </form>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={()=>setFiltersOpen(true)} className="focus-ring surface hairline inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium lg:hidden" aria-haspopup="dialog">
          <SlidersHorizontal size={15}/>Filters{activeCount>0 && <span className="rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">{activeCount}</span>}
        </button>
        <p className="muted text-sm" role="status" aria-live="polite">{loading ? "Searching…" : `${total} result${total===1?"":"s"}${params.q?` for “${params.q}”`:""}`}</p>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="br-sort" className="muted text-xs font-medium">Sort</label>
          <select id="br-sort" value={params.sort} onChange={e=>setParam("sort", e.target.value)} className="focus-ring surface hairline rounded-lg border px-2 py-1.5 text-sm">
            <option value="">Relevance</option>{SORTS.filter(s=>s.v!=="relevance").map(s=><option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          <div className="surface hairline hidden overflow-hidden rounded-lg border sm:flex" role="group" aria-label="View mode" suppressHydrationWarning>
            <button onClick={()=>setView("grid")} aria-pressed={view==="grid"} aria-label="Grid view" className={cx("focus-ring p-2", view==="grid"?"bg-gray-900 text-white dark:bg-white dark:text-gray-900":"muted")}><LayoutGrid size={15}/></button>
            <button onClick={()=>setView("list")} aria-pressed={view==="list"} aria-label="List view" className={cx("focus-ring p-2", view==="list"?"bg-gray-900 text-white dark:bg-white dark:text-gray-900":"muted")}><List size={15}/></button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-6">
        <aside className="surface hairline hidden w-60 shrink-0 self-start rounded-xl border p-4 lg:block" aria-label="Filters">{filterPanel}</aside>
        <div className="min-w-0 flex-1">
          {error ? <ErrorBox message={error} onRetry={retry} />
          : loading ? <div className={view==="grid"?"grid gap-3 sm:grid-cols-2":"space-y-2.5"}>{Array.from({length:6}).map((_,i)=><ResourceSkeleton key={i} view={view}/>)}</div>
          : items.length===0 ? <SearchEmpty onClear={clearAll} />
          : <div className={view==="grid"?"grid gap-3 sm:grid-cols-2":"space-y-2.5"}>
              {items.map(r=><ResourceCard key={r.id} r={r} view={view} saved={saved.has(r.id)} onToggleSave={toggle} />)}
            </div>}
          {!loading && !error && <Pagination page={params.page} totalPages={totalPages} onPage={p=>{setParam("page", String(p)); window.scrollTo({top:0,behavior:"smooth"});}} />}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setFiltersOpen(false)} />
          <div className="surface absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t hairline p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Filters</h2>
              <button onClick={()=>setFiltersOpen(false)} className="focus-ring rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Close filters"><X size={18}/></button></div>
            {filterPanel}
            <button onClick={()=>setFiltersOpen(false)} className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white">Show {total} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
