"use client";
import { useEffect, useState } from "react";
import { Breadcrumbs, ErrorBox } from "@/components/ui";
import { adminHeaders } from "@/lib/utils";

export default function AdminAcademic() {
  const [kind, setKind] = useState("notices");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [items, setItems] = useState<Record<string, string>[]>([]);
  const [f, setF] = useState<Record<string,string>>({});

  const load = () => {
    fetch(`/api/academic?kind=${kind}`).then(r=>r.json()).then(j=>setItems(j.items||[])).catch(()=>{});
  };
  useEffect(load,[kind]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setError("");
    const res = await fetch(`/api/academic?kind=${kind}`, { method:"POST", headers:{ "Content-Type":"application/json", ...adminHeaders() }, body: JSON.stringify({ ...f, isOfficial: f.isOfficial==="1" }) });
    const j = await res.json().catch(()=>({}));
    if (!res.ok) { setError(j.error||"Save failed. Admin key required."); return; }
    setMsg("Entry added."); setF({}); load();
  };
  const del = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/academic?kind=${kind}&id=${id}`, { method:"DELETE", headers: adminHeaders() });
    load();
  };

  const inputCls = "focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm";
  const set = (k:string,v:string)=>setF(prev=>({...prev,[k]:v}));

  return (
    <div>
      <Breadcrumbs items={[{label:"Admin",href:"/admin"},{label:"Academic data"}]} />
      <h1 className="text-xl font-bold tracking-tight">Academic data</h1>
      <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Kind">
        {[["timetable","Timetable"],["calendar","Calendar"],["exams","Exams"],["notices","Notices"]].map(([v,l])=>(
          <button key={v} role="tab" aria-selected={kind===v} onClick={()=>setKind(v)} className={kind===v?"rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900":"surface hairline rounded-lg border px-3.5 py-2 text-sm"}>{l}</button>
        ))}
      </div>
      {msg && <p role="status" className="surface hairline mt-3 rounded-xl border p-2.5 text-sm">{msg}</p>}
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}

      <form onSubmit={submit} className="surface hairline mt-3 rounded-xl border p-4">
        <h2 className="text-sm font-bold">Add {kind} entry</h2>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          {kind==="timetable" && <>
            <select value={f.day||""} onChange={e=>set("day",e.target.value)} required className={inputCls} aria-label="Day"><option value="">Day…</option>{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d=><option key={d} value={d}>{d}</option>)}</select>
            <input value={f.subject||""} onChange={e=>set("subject",e.target.value)} placeholder="Subject *" required className={inputCls} aria-label="Subject" />
            <input value={f.startTime||""} onChange={e=>set("startTime",e.target.value)} placeholder="Start 09:00 *" required className={inputCls} aria-label="Start time" />
            <input value={f.endTime||""} onChange={e=>set("endTime",e.target.value)} placeholder="End 10:00 *" required className={inputCls} aria-label="End time" />
            <input value={f.faculty||""} onChange={e=>set("faculty",e.target.value)} placeholder="Faculty" className={inputCls} aria-label="Faculty" />
            <input value={f.room||""} onChange={e=>set("room",e.target.value)} placeholder="Room" className={inputCls} aria-label="Room" />
          </>}
          {kind==="calendar" && <>
            <input value={f.title||""} onChange={e=>set("title",e.target.value)} placeholder="Title *" required className={inputCls} aria-label="Title" />
            <input value={f.date||""} onChange={e=>set("date",e.target.value)} placeholder="Date YYYY-MM-DD *" required className={inputCls} aria-label="Date" />
            <input value={f.type||""} onChange={e=>set("type",e.target.value)} placeholder="Type (Exam/Holiday/General)" className={inputCls} aria-label="Type" />
            <input value={f.endDate||""} onChange={e=>set("endDate",e.target.value)} placeholder="End date (optional)" className={inputCls} aria-label="End date" />
            <input value={f.description||""} onChange={e=>set("description",e.target.value)} placeholder="Description" className={`${inputCls} sm:col-span-2`} aria-label="Description" />
          </>}
          {kind==="exams" && <>
            <input value={f.subject||""} onChange={e=>set("subject",e.target.value)} placeholder="Subject *" required className={inputCls} aria-label="Subject" />
            <input value={f.date||""} onChange={e=>set("date",e.target.value)} placeholder="Date YYYY-MM-DD *" required className={inputCls} aria-label="Date" />
            <input value={f.time||""} onChange={e=>set("time",e.target.value)} placeholder="Time" className={inputCls} aria-label="Time" />
            <input value={f.location||""} onChange={e=>set("location",e.target.value)} placeholder="Venue" className={inputCls} aria-label="Venue" />
            <input value={f.examType||""} onChange={e=>set("examType",e.target.value)} placeholder="Exam type" className={inputCls} aria-label="Exam type" />
          </>}
          {kind==="notices" && <>
            <input value={f.title||""} onChange={e=>set("title",e.target.value)} placeholder="Title *" required className={`${inputCls} sm:col-span-2`} aria-label="Title" />
            <input value={f.category||""} onChange={e=>set("category",e.target.value)} placeholder="Category" className={inputCls} aria-label="Category" />
            <input value={f.date||""} onChange={e=>set("date",e.target.value)} placeholder="Date YYYY-MM-DD" className={inputCls} aria-label="Date" />
            <input value={f.source||""} onChange={e=>set("source",e.target.value)} placeholder="Source" className={inputCls} aria-label="Source" />
            <input value={f.content||""} onChange={e=>set("content",e.target.value)} placeholder="Content" className={inputCls} aria-label="Content" />
          </>}
          {(kind==="calendar"||kind==="exams"||kind==="notices") && (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isOfficial==="1"} onChange={e=>set("isOfficial",e.target.checked?"1":"")} /> Official (only if from college/university source)</label>
          )}
        </div>
        <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add entry</button>
      </form>

      <div className="surface hairline mt-3 rounded-xl border p-4">
        <h2 className="text-sm font-bold">Entries ({items.length})</h2>
        <ul className="mt-2 divide-y hairline">
          {items.map((it,i)=>(
            <li key={String(it.id||i)} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="truncate">{String(it.title||it.subject||it.day||it.id)} <span className="muted">· {String(it.date||it.startTime||"")}</span></span>
              <button onClick={()=>del(String(it.id))} className="focus-ring shrink-0 rounded-lg border hairline px-2.5 py-1 text-xs text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
