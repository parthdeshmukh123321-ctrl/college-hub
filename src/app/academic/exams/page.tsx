"use client";
import { Breadcrumbs } from "@/components/ui";
import { AcademicTabs, OfficialTag, useAcademic, ErrorBox, EmptyState } from "@/components/academic";

export default function ExamsPage() {
  const { data, loading, error } = useAcademic();
  const items = [...data.exams].sort((a,b)=>a.date.localeCompare(b.date));
  return (
    <div>
      <Breadcrumbs items={[{label:"Academic",href:"/academic"},{label:"Exam Schedule"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Exam Schedule</h1>
      <p className="muted mt-1 text-sm">Always confirm dates against the official university notice.</p>
      <div className="mt-3"><AcademicTabs active="exams" /></div>
      <div className="mt-4">
        {error ? <ErrorBox message={error} /> : loading ? <div className="skeleton h-64 rounded-xl" />
        : items.length===0 ? <EmptyState title="No exams scheduled" body="No exam entries have been added yet." />
        : <div className="surface hairline overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="muted border-b hairline bg-gray-50 text-left text-xs uppercase tracking-wide dark:bg-white/5">
                  <th className="px-4 py-2.5 font-semibold">Date</th><th className="px-4 py-2.5 font-semibold">Subject</th><th className="px-4 py-2.5 font-semibold">Time</th><th className="px-4 py-2.5 font-semibold">Venue</th><th className="px-4 py-2.5 font-semibold">Type</th><th className="px-4 py-2.5 font-semibold">Source</th>
                </tr></thead>
                <tbody className="divide-y hairline">
                  {items.map(e=><tr key={e.id}><td className="whitespace-nowrap px-4 py-3 font-semibold">{e.date}</td><td className="px-4 py-3">{e.subject}</td><td className="muted px-4 py-3">{e.time||"—"}</td><td className="muted px-4 py-3">{e.location||"—"}</td><td className="px-4 py-3">{e.examType}</td><td className="px-4 py-3"><OfficialTag official={e.isOfficial} source={e.sourceName} /></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>}
      </div>
    </div>
  );
}
