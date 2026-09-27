"use client";
import { Breadcrumbs } from "@/components/ui";
import { AcademicTabs, useAcademic, ErrorBox, EmptyState } from "@/components/academic";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function TimetablePage() {
  const { data, loading, error } = useAcademic();
  return (
    <div>
      <Breadcrumbs items={[{label:"Academic",href:"/academic"},{label:"Timetable"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Timetable</h1>
      <div className="mt-3"><AcademicTabs active="timetable" /></div>
      <div className="mt-4">
        {error ? <ErrorBox message={error} /> : loading ? <div className="skeleton h-64 rounded-xl" />
        : data.timetable.length===0 ? <EmptyState title="No timetable entries" body="The timetable hasn't been added yet. Check back later." />
        : <div className="space-y-4">
            {DAYS.map(d=>{
              const rows = data.timetable.filter(t=>t.day===d).sort((a,b)=>a.startTime.localeCompare(b.startTime));
              if (!rows.length) return null;
              return (
                <section key={d} aria-label={d} className="surface hairline overflow-hidden rounded-xl border">
                  <h2 className="border-b hairline bg-gray-50 px-4 py-2 text-sm font-bold dark:bg-white/5">{d}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead><tr className="muted text-left text-xs uppercase tracking-wide"><th className="px-4 py-2 font-semibold">Time</th><th className="px-4 py-2 font-semibold">Subject</th><th className="px-4 py-2 font-semibold">Faculty</th><th className="px-4 py-2 font-semibold">Room</th><th className="px-4 py-2 font-semibold">Type</th></tr></thead>
                      <tbody className="divide-y hairline">
                        {rows.map(r=><tr key={r.id}><td className="whitespace-nowrap px-4 py-2.5 font-medium">{r.startTime}–{r.endTime}</td><td className="px-4 py-2.5">{r.subject}</td><td className="muted px-4 py-2.5">{r.faculty||"—"}</td><td className="muted px-4 py-2.5">{r.room||"—"}</td><td className="px-4 py-2.5"><span className="rounded-md border hairline px-1.5 py-0.5 text-[11px]">{r.type}</span></td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>}
      </div>
    </div>
  );
}
