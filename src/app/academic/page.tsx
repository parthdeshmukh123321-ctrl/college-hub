"use client";
import Link from "next/link";
import { CalendarDays, Clock3, FileText, Megaphone } from "lucide-react";
import { Breadcrumbs } from "@/components/ui";
import { AcademicTabs, OfficialTag, useAcademic, ErrorBox } from "@/components/academic";

export default function AcademicHome() {
  const { data, loading, error } = useAcademic();
  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Academic"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Academic</h1>
      <p className="muted mt-1 text-sm">Timetable, calendar, exams and notices. Items are marked Official only when sourced from the college/university.</p>
      <div className="mt-3"><AcademicTabs active="overview" /></div>
      {error ? <div className="mt-4"><ErrorBox message={error} /></div>
      : loading ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-36 rounded-xl"/>)}</div>
      : <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="surface hairline rounded-xl border p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold"><Clock3 size={15}/>Timetable <span className="muted font-medium">({data.timetable.length})</span></h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {data.timetable.slice(0,4).map(t=><li key={t.id} className="flex justify-between gap-2 text-[13px]"><span className="font-medium">{t.day} · {t.startTime}–{t.endTime}</span><span className="muted truncate">{t.subject}</span></li>)}
              {data.timetable.length===0 && <li className="muted text-[13px]">No timetable entries yet.</li>}
            </ul>
            <Link href="/academic/timetable" className="mt-2 inline-block text-[13px] font-medium text-blue-600 hover:underline dark:text-blue-400">Open timetable →</Link>
          </div>
          <div className="surface hairline rounded-xl border p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold"><CalendarDays size={15}/>Upcoming <span className="muted font-medium">({data.calendar.length + data.exams.length})</span></h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {[...data.exams.map(e=>({t:e.subject,d:e.date})),...data.calendar.map(c=>({t:c.title,d:c.date}))].slice(0,4).map((x,i)=><li key={i} className="flex justify-between gap-2 text-[13px]"><span className="truncate font-medium">{x.t}</span><span className="muted shrink-0">{x.d}</span></li>)}
              {(data.calendar.length+data.exams.length)===0 && <li className="muted text-[13px]">Nothing scheduled.</li>}
            </ul>
            <Link href="/academic/exams" className="mt-2 inline-block text-[13px] font-medium text-blue-600 hover:underline dark:text-blue-400">Open exam schedule →</Link>
          </div>
          <div className="surface hairline rounded-xl border p-4 sm:col-span-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold"><Megaphone size={15}/>Latest notices</h2>
            <ul className="mt-2 divide-y hairline">
              {data.notices.slice(0,4).map(n=>(
                <li key={n.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{n.title}</p><p className="muted text-xs">{n.date} · {n.category}</p></div>
                  <OfficialTag official={n.isOfficial} source={n.source} />
                </li>
              ))}
              {data.notices.length===0 && <li className="muted py-2 text-sm">No notices yet.</li>}
            </ul>
            <Link href="/academic/notices" className="mt-1 inline-block text-[13px] font-medium text-blue-600 hover:underline dark:text-blue-400">All notices →</Link>
          </div>
          <p className="muted flex items-center gap-1.5 text-xs sm:col-span-2"><FileText size={12}/>Seed entries shown are unverified demo data. Admins can replace them with official information.</p>
        </div>}
    </div>
  );
}
