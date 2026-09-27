"use client";
import { useEffect, useState } from "react";
import type { Subject, Topic } from "@/lib/types";
import { Breadcrumbs, ErrorBox } from "@/components/ui";
import { adminHeaders } from "@/lib/utils";

export default function AdminSubjects() {
  const [items, setItems] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name:"", code:"", semester:"", department:"Engineering", academicYear:"FE", description:"" });
  const [topicForm, setTopicForm] = useState({ subjectId:"", name:"", description:"" });

  const load = () => {
    fetch("/api/subjects").then(r=>r.json()).then(j=>setItems(j.items||[])).catch(()=>setError("Couldn't load subjects."));
    fetch("/api/topics").then(r=>r.json()).then(j=>setTopics(j.items||[])).catch(()=>{});
  };
  useEffect(load,[]);

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setError("");
    const res = await fetch("/api/subjects", { method:"POST", headers:{ "Content-Type":"application/json", ...adminHeaders() },
      body: JSON.stringify({ ...form, semester: form.semester?Number(form.semester):null }) });
    const j = await res.json().catch(()=>({}));
    if (!res.ok) { setError(j.error||"Save failed. Admin key required (see Settings)."); return; }
    setMsg("Subject added."); setForm({ name:"", code:"", semester:"", department:"Engineering", academicYear:"FE", description:"" }); load();
  };
  const delSubject = async (id: string) => {
    if (!confirm("Delete this subject? Its resources will be kept but unlinked.")) return;
    const res = await fetch(`/api/subjects/${id}`, { method:"DELETE", headers: adminHeaders() });
    if (res.ok) { setMsg("Subject deleted."); load(); } else setError("Delete failed.");
  };
  const addTopic = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    const res = await fetch("/api/topics", { method:"POST", headers:{ "Content-Type":"application/json", ...adminHeaders() }, body: JSON.stringify(topicForm) });
    if (!res.ok) { setError("Topic save failed. Check admin key."); return; }
    setMsg("Topic added."); setTopicForm({ subjectId:"", name:"", description:"" });
    fetch("/api/topics").then(r=>r.json()).then(j=>setTopics(j.items||[]));
  };

  const inputCls = "focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm";
  return (
    <div>
      <Breadcrumbs items={[{label:"Admin",href:"/admin"},{label:"Subjects & Topics"}]} />
      <h1 className="text-xl font-bold tracking-tight">Subjects & Topics</h1>
      {msg && <p role="status" className="surface hairline mt-3 rounded-xl border p-2.5 text-sm">{msg}</p>}
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <form onSubmit={addSubject} className="surface hairline rounded-xl border p-4">
          <h2 className="text-sm font-bold">Add subject</h2>
          <div className="mt-2.5 grid gap-2.5">
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name *" required className={inputCls} aria-label="Subject name" />
            <div className="grid grid-cols-2 gap-2.5">
              <input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="Code * e.g. M-1" required className={inputCls} aria-label="Subject code" />
              <input value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} placeholder="Sem" inputMode="numeric" className={inputCls} aria-label="Semester" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="Department" className={inputCls} aria-label="Department" />
              <input value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})} placeholder="FE/SE/TE/BE" className={inputCls} aria-label="Academic year" />
            </div>
            <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description" className={inputCls} aria-label="Description" />
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add subject</button>
          </div>
        </form>
        <form onSubmit={addTopic} className="surface hairline rounded-xl border p-4">
          <h2 className="text-sm font-bold">Add topic</h2>
          <div className="mt-2.5 grid gap-2.5">
            <select value={topicForm.subjectId} onChange={e=>setTopicForm({...topicForm,subjectId:e.target.value})} required className={inputCls} aria-label="Topic subject">
              <option value="">Choose subject…</option>{items.map(s=><option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
            </select>
            <input value={topicForm.name} onChange={e=>setTopicForm({...topicForm,name:e.target.value})} placeholder="Topic name *" required className={inputCls} aria-label="Topic name" />
            <input value={topicForm.description} onChange={e=>setTopicForm({...topicForm,description:e.target.value})} placeholder="Description" className={inputCls} aria-label="Topic description" />
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Add topic</button>
          </div>
        </form>
      </div>

      <div className="surface hairline mt-3 rounded-xl border p-4">
        <h2 className="text-sm font-bold">All subjects ({items.length})</h2>
        <ul className="mt-2 divide-y hairline">
          {items.map(s=>(
            <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span><span className="font-bold">{s.code}</span> — {s.name} <span className="muted">({s.resourceCount} · {topics.filter(t=>t.subjectId===s.id).length} topics)</span></span>
              <button onClick={()=>delSubject(s.id)} className="focus-ring rounded-lg border hairline px-2.5 py-1 text-xs text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
