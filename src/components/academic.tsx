"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { TimetableEntry, CalendarEvent, ExamEntry, Notice } from "@/lib/types";
import { EmptyState, ErrorBox } from "./ui";

export function useAcademic() {
  const [data, setData] = useState<{ timetable: TimetableEntry[]; calendar: CalendarEvent[]; exams: ExamEntry[]; notices: Notice[] }>({ timetable: [], calendar: [], exams: [], notices: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(()=>{
    fetch("/api/academic?kind=all").then(async r=>{ if(!r.ok) throw new Error(); setData(await r.json()); })
      .catch(()=>setError("We couldn't load academic information.")).finally(()=>setLoading(false));
  },[]);
  return { data, loading, error };
}

export function OfficialTag({ official, source }: { official: boolean; source?: string }) {
  if (official) return <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"><BadgeCheck size={11}/>Official</span>;
  return <span className="muted text-[11px]" title={source||""}>Unverified{source?` · ${source}`:""}</span>;
}

export function AcademicTabs({ active }: { active: string }) {
  const tabs = [
    { href: "/academic", label: "Overview", v: "overview" },
    { href: "/academic/timetable", label: "Timetable", v: "timetable" },
    { href: "/academic/calendar", label: "Calendar", v: "calendar" },
    { href: "/academic/exams", label: "Exams", v: "exams" },
    { href: "/academic/notices", label: "Notices", v: "notices" },
  ];
  return (
    <nav className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1" aria-label="Academic sections">
      {tabs.map(t=>(
        <Link key={t.v} href={t.href} aria-current={active===t.v?"page":undefined}
          className={active===t.v?"shrink-0 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900":"surface hairline shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium"}>{t.label}</Link>
      ))}
    </nav>
  );
}

export { EmptyState, ErrorBox };
