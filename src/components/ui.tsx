"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink, FileText, Eye, Download, Clock, AlertTriangle, BadgeCheck, ChevronRight, SearchX, Inbox } from "lucide-react";
import { RESOURCE_TYPE_LABELS, type Resource } from "@/lib/types";
import { cx, formatDate, timeAgo } from "@/lib/utils";

export const TYPE_COLORS: Record<string,string> = {
  NOTE:"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900",
  PYQ:"bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
  QUESTION_BANK:"bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900",
  LAB_MANUAL:"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
  PRACTICAL:"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
  VIVA:"bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900",
  ASSIGNMENT:"bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900",
  SYLLABUS:"bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  VIDEO:"bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900",
  WEBSITE:"bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-900",
  COURSE:"bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900",
  REFERENCE:"bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-900",
  TEXTBOOK:"bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700",
  PRESENTATION:"bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-900",
  OTHER:"bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700",
};

export function TypeBadge({ type }: { type: string }) {
  return <span className={cx("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase", TYPE_COLORS[type] || TYPE_COLORS.OTHER)}>{RESOURCE_TYPE_LABELS[type] || type}</span>;
}

export function SourceBadge({ c }: { c: string }) {
  if (c === "OFFICIAL") return <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"><BadgeCheck size={12} aria-hidden />Official</span>;
  if (c === "FACULTY") return <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium hairline muted">Faculty</span>;
  if (c === "EXTERNAL") return <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium hairline muted">External</span>;
  if (c === "COMMUNITY") return <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium hairline muted">Community</span>;
  return <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium hairline muted">Student</span>;
}

export function BrokenBadge() {
  return <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"><AlertTriangle size={12} aria-hidden />Broken</span>;
}

export function SaveButton({ saved, onToggle, small }: { saved: boolean; onToggle: () => void; small?: boolean }) {
  return (
    <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();onToggle();}}
      aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save resource"}
      className={cx("focus-ring inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors",
        small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
        saved ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700" : "surface hairline hover:border-gray-400")}>
      {saved ? <BookmarkCheck size={small?13:15} aria-hidden /> : <Bookmark size={small?13:15} aria-hidden />}
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}

export function ResourceCard({ r, saved, onToggleSave, view="grid" }: { r: Resource; saved: boolean; onToggleSave: (id: string, next: boolean) => void; view?: "grid"|"list" }) {
  const meta = [r.subjectCode || r.subjectName, r.semester ? `Sem ${r.semester}` : "", r.year ? String(r.year) : ""].filter(Boolean).join(" · ");
  if (view === "list") {
    return (
      <article className="surface hairline card-hover flex items-center gap-3 rounded-xl border p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border hairline" aria-hidden>
          {r.sourceType === "FILE" ? <FileText size={18} className="muted" /> : <ExternalLink size={18} className="muted" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><TypeBadge type={r.resourceType} /><SourceBadge c={r.sourceClassification} />{r.isBroken && <BrokenBadge />}{r.isFeatured && <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">★ Featured</span>}</div>
          <Link href={`/resources/${r.id}`} className="focus-ring mt-1 block truncate text-[15px] font-semibold hover:underline">{r.title}</Link>
          <p className="muted truncate text-xs">{meta}{r.description ? ` — ${r.description}` : ""}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-3 text-xs muted sm:flex"><span className="inline-flex items-center gap-1"><Eye size={13}/>{r.viewCount}</span><span>{timeAgo(r.updatedAt)}</span></div>
        <SaveButton small saved={saved} onToggle={()=>onToggleSave(r.id, !saved)} />
      </article>
    );
  }
  return (
    <article className="surface hairline card-hover flex flex-col rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-1.5"><TypeBadge type={r.resourceType} /><SourceBadge c={r.sourceClassification} />{r.isBroken && <BrokenBadge />}</div>
      <Link href={`/resources/${r.id}`} className="focus-ring mt-2.5 block text-[15px] font-semibold leading-snug hover:underline line-clamp-2">{r.title}</Link>
      <p className="muted mt-1 text-xs font-medium">{meta || "—"}</p>
      {r.description ? <p className="muted mt-2 text-[13px] leading-relaxed line-clamp-2">{r.description}</p> : null}
      {(r.tags?.length) ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tags">
          {r.tags.slice(0,4).map(t=>(
            <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} onClick={e=>e.stopPropagation()} className="focus-ring rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">#{t}</Link>
          ))}
        </div>
      ) : null}
      <div className="muted mt-3 flex items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1">{r.sourceType==="FILE" ? <FileText size={12}/> : <ExternalLink size={12}/>}{r.sourceType==="FILE" ? (r.fileName || "File") : "Link"}</span>
        <span className="inline-flex items-center gap-1"><Eye size={12}/>{r.viewCount}</span>
        <span className="inline-flex items-center gap-1"><Clock size={12}/>{timeAgo(r.updatedAt)}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t hairline pt-3">
        <Link href={`/resources/${r.id}`} className="focus-ring inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">Open <ChevronRight size={14} aria-hidden /></Link>
        <SaveButton small saved={saved} onToggle={()=>onToggleSave(r.id, !saved)} />
      </div>
    </article>
  );
}

export function ResourceSkeleton({ view="grid" }: { view?: "grid"|"list" }) {
  if (view==="list") return <div className="surface hairline rounded-xl border p-3"><div className="skeleton h-12 rounded-lg" /></div>;
  return <div className="surface hairline rounded-xl border p-4"><div className="skeleton h-5 w-20 rounded" /><div className="skeleton mt-3 h-5 w-full rounded" /><div className="skeleton mt-2 h-4 w-2/3 rounded" /><div className="skeleton mt-3 h-8 w-full rounded-lg" /></div>;
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="surface hairline flex flex-col items-center rounded-xl border px-6 py-12 text-center">
      <div className="muted mb-3">{icon || <Inbox size={28} aria-hidden />}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="muted mt-1 max-w-md text-sm">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
export function SearchEmpty({ onClear }: { onClear?: () => void }) {
  return <EmptyState icon={<SearchX size={28} aria-hidden />} title="No resources found" body="Try another keyword, check spelling, or remove a filter." action={onClear ? <button onClick={onClear} className="focus-ring rounded-lg border hairline px-4 py-2 text-sm font-medium surface hover:border-gray-400">Clear filters</button> : undefined} />;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
      <p className="font-medium">{message}</p>
      {onRetry ? <button onClick={onRetry} className="focus-ring mt-2 rounded-lg border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 dark:hover:bg-red-900/40">Try again</button> : null}
    </div>
  );
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p:number)=>void }) {
  if (totalPages <= 1) return null;
  const nums: number[] = [];
  for (let i=Math.max(1,page-2); i<=Math.min(totalPages,page+2); i++) nums.push(i);
  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button disabled={page<=1} onClick={()=>onPage(page-1)} className="focus-ring rounded-lg border hairline surface px-3 py-1.5 text-sm font-medium disabled:opacity-40">Prev</button>
      {nums[0]>1 && <><button onClick={()=>onPage(1)} className="focus-ring rounded-lg border hairline surface px-3 py-1.5 text-sm">1</button><span className="muted px-1">…</span></>}
      {nums.map(n=><button key={n} onClick={()=>onPage(n)} aria-current={n===page?"page":undefined} className={cx("focus-ring rounded-lg border px-3 py-1.5 text-sm font-medium", n===page?"border-gray-900 bg-gray-900 text-white dark:bg-white dark:text-gray-900 dark:border-white":"hairline surface")}>{n}</button>)}
      {nums[nums.length-1]<totalPages && <><span className="muted px-1">…</span><button onClick={()=>onPage(totalPages)} className="focus-ring rounded-lg border hairline surface px-3 py-1.5 text-sm">{totalPages}</button></>}
      <button disabled={page>=totalPages} onClick={()=>onPage(page+1)} className="focus-ring rounded-lg border hairline surface px-3 py-1.5 text-sm font-medium disabled:opacity-40">Next</button>
    </nav>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-[13px] muted">
      {items.map((it,i)=>(
        <span key={i} className="inline-flex items-center gap-1">
          {i>0 && <ChevronRight size={13} aria-hidden />}
          {it.href ? <Link href={it.href} className="focus-ring hover:underline">{it.label}</Link> : <span className="font-medium text-current" aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b hairline py-2.5 text-sm last:border-0"><dt className="muted shrink-0">{label}</dt><dd className="text-right font-medium break-words">{value}</dd></div>;
}

export function useLocalState<T>(key: string, initial: T): [T, (v:T)=>void] {
  const [val, setVal] = useState<T>(initial);
  useEffect(()=>{ try { const raw = localStorage.getItem(key); if (raw!==null) setVal(JSON.parse(raw)); } catch {} /* eslint-disable-next-line */ },[key]);
  const set = (v: T) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [val, set];
}
export { formatDate };
export { Download };
