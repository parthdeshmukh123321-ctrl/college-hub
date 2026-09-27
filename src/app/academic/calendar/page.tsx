"use client";
import { Breadcrumbs } from "@/components/ui";
import { AcademicTabs, OfficialTag, useAcademic, ErrorBox, EmptyState } from "@/components/academic";

export default function CalendarPage() {
  const { data, loading, error } = useAcademic();
  const items = [...data.calendar].sort((a,b)=>a.date.localeCompare(b.date));
  return (
    <div>
      <Breadcrumbs items={[{label:"Academic",href:"/academic"},{label:"Calendar"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Academic Calendar</h1>
      <div className="mt-3"><AcademicTabs active="calendar" /></div>
      <div className="mt-4">
        {error ? <ErrorBox message={error} /> : loading ? <div className="skeleton h-64 rounded-xl" />
        : items.length===0 ? <EmptyState title="No calendar events" body="No academic events have been added yet." />
        : <ol className="relative space-y-3 border-l-2 hairline pl-5" style={{borderColor:"var(--border)"}}>
            {items.map(e=>(
              <li key={e.id} className="surface hairline relative rounded-xl border p-4">
                <span className="absolute -left-[26px] top-4 h-3 w-3 rounded-full bg-blue-600" aria-hidden />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold">{e.title}</p><OfficialTag official={e.isOfficial} source={e.sourceName} />
                </div>
                <p className="muted mt-0.5 text-xs font-medium">{e.date}{e.endDate?` → ${e.endDate}`:""} · {e.type}</p>
                {e.description ? <p className="mt-1.5 text-sm">{e.description}</p> : null}
                {e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-[13px] font-medium text-blue-600 hover:underline dark:text-blue-400">View original source</a> : null}
              </li>
            ))}
          </ol>}
      </div>
    </div>
  );
}
