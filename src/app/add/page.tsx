"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Upload, Link2, CheckCircle2 } from "lucide-react";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS, CLASSIFICATIONS, type Subject, type Topic } from "@/lib/types";
import { adminHeaders, getDeviceId } from "@/lib/utils";
import { Breadcrumbs, ErrorBox } from "@/components/ui";

const YEARS = (()=>{ const y=new Date().getFullYear(); const arr:number[]=[]; for (let i=y;i>=1990;i--) arr.push(i); return arr; })();

function AddInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get("id") || "";
  const presetSubject = sp.get("subjectId") || "";
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState({ title:"", resourceType:"NOTE", subjectId:presetSubject, topic:"", topicId:"", description:"", semester:"", academicYear:"FE", year:String(new Date().getFullYear()), examType:"", tags:"", sourceType:"EXTERNAL_URL", sourceClassification:"STUDENT", url:"", author:"", contributorName:"" });
  const [file, setFile] = useState<{id:string;fileName:string;fileMime:string;fileSize:number}|null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [notice, setNotice] = useState("");
  const [globalErr, setGlobalErr] = useState("");

  const [prevSub, setPrevSub] = useState(form.subjectId);
  if (form.subjectId !== prevSub) { setPrevSub(form.subjectId); if (!form.subjectId) setTopics([]); }
  useEffect(()=>{ fetch("/api/subjects").then(r=>r.json()).then(j=>setSubjects(j.items||[])).catch(()=>{}); },[]);
  useEffect(()=>{
    if (!form.subjectId) return;
    fetch(`/api/topics?subjectId=${form.subjectId}`).then(r=>r.json()).then(j=>setTopics(j.items||[])).catch(()=>{});
  },[form.subjectId]);
  useEffect(()=>{
    if (!editId) return;
    fetch(`/api/resources/${editId}`).then(async r=>{
      if (r.status===404) { setGlobalErr("The resource you're editing no longer exists."); return; }
      if(!r.ok) return;
      const j=await r.json(); const x=j.resource;
      if (x) {
        setForm({ title:x.title||"", resourceType:x.resourceType||"NOTE", subjectId:x.subjectId||"", topic:x.topic||"", topicId:x.topicId||"", description:x.description||"", semester:x.semester?String(x.semester):"", academicYear:x.academicYear||"FE", year:x.year?String(x.year):"", examType:x.examType||"", tags:(x.tags||[]).join(", "), sourceType:x.sourceType||"EXTERNAL_URL", sourceClassification:x.sourceClassification||"STUDENT", url:x.url||"", author:x.author||"", contributorName:x.contributorName||"" });
        if (x.fileId) setFile({ id:x.fileId, fileName:x.fileName||"file", fileMime:x.fileMime||"", fileSize:x.fileSize||0 });
      }
    }).catch(()=>{});
  },[editId]);

  const set = (k: string, v: string) => setForm(f=>({...f,[k]:v}));

  const onFile = async (f: File|null) => {
    if (!f) return;
    setUploading(true); setGlobalErr("");
    try {
      const fd = new FormData();
      fd.append("file", f, f.name);
      const res = await fetch("/api/files", { method:"POST", body: fd });
      const j = await res.json();
      if (!res.ok) { setGlobalErr(j.error || "Upload failed."); return; }
      setFile({ id: j.id, fileName: j.fileName, fileMime: j.fileMime, fileSize: j.fileSize });
    } catch { setGlobalErr("Upload failed. Please try again."); }
    finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || uploading) return;
    setSubmitting(true); setErrors({}); setGlobalErr(""); setNotice("");
    try {
      const payload = {
        title: form.title.trim(), resourceType: form.resourceType, subjectId: form.subjectId||null, topicId: form.topicId||null,
        topic: form.topicId ? (topics.find(t=>t.id===form.topicId)?.name||form.topic) : form.topic,
        description: form.description.trim(), semester: form.semester||null, academicYear: form.academicYear, year: form.year||null,
        examType: form.resourceType==="PYQ"?form.examType:"", tags: form.tags.split(",").map(s=>s.trim()).filter(Boolean),
        sourceType: form.sourceType, sourceClassification: form.sourceType==="EXTERNAL_URL"&&form.sourceClassification==="OFFICIAL"?"EXTERNAL":form.sourceClassification,
        url: form.sourceType==="EXTERNAL_URL"?form.url.trim():"",
        fileId: form.sourceType==="FILE"?file?.id||"":"", fileName: form.sourceType==="FILE"?file?.fileName||"":"", fileMime: form.sourceType==="FILE"?file?.fileMime||"":"", fileSize: form.sourceType==="FILE"?file?.fileSize||0:0,
        author: form.author, contributorName: form.contributorName, contributorId: getDeviceId(),
      };
      const url = editId ? `/api/resources/${editId}` : "/api/resources";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type":"application/json", ...adminHeaders() }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) { setErrors(j.errors||{}); setGlobalErr(j.error || "Couldn't save. Check the form."); return; }
      if (j.warning) setNotice(j.warning);
      if (editId) {
        if (j.status === "PENDING_REVIEW") {
          setNotice("Your edit was saved and sent for review. It will reappear publicly once an admin approves it.");
          return;
        }
        router.push(`/resources/${editId}`); return;
      }
      if (j.status === "PENDING_REVIEW") {
        setNotice("Submitted for review. An admin will approve it before it appears publicly.");
        setForm(f=>({ ...f, title:"", description:"", url:"", tags:"", topic:"" })); setFile(null);
      } else router.push(`/resources/${j.id}`);
    } catch { setGlobalErr("We couldn't save this resource. Please try again."); }
    finally { setSubmitting(false); }
  };

  const inputCls = "focus-ring surface hairline w-full rounded-lg border px-3 py-2.5 text-sm";
  const labelCls = "mb-1 block text-[13px] font-semibold";
  const errCls = "mt-1 text-xs text-red-600 dark:text-red-400";

  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label: editId?"Edit Resource":"Add Resource"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{editId?"Edit Resource":"Add Resource"}</h1>
      <p className="muted mt-1 text-sm">Upload or share material only when you have the right or permission to do so. Never present student uploads as official college documents.</p>

      {globalErr && <div className="mt-3"><ErrorBox message={globalErr} /></div>}
      {notice && <p role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><CheckCircle2 size={16} className="mt-0.5 shrink-0"/>{notice}</p>}

      <form onSubmit={submit} className="surface hairline mt-4 rounded-xl border p-4 sm:p-6" noValidate>
        <div className="grid gap-4">
          <div><label htmlFor="a-title" className={labelCls}>Title *</label>
            <input id="a-title" value={form.title} onChange={e=>set("title",e.target.value)} className={inputCls} maxLength={200} placeholder="e.g. Engineering Mathematics I — 2025 PYQ" required />
            {errors.title && <p className={errCls}>{errors.title}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="a-type" className={labelCls}>Resource type *</label>
              <select id="a-type" value={form.resourceType} onChange={e=>set("resourceType",e.target.value)} className={inputCls}>
                {RESOURCE_TYPES.map(t=><option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>)}
              </select>{errors.resourceType && <p className={errCls}>{errors.resourceType}</p>}</div>
            <div><label htmlFor="a-sub" className={labelCls}>Subject</label>
              <select id="a-sub" value={form.subjectId} onChange={e=>set("subjectId",e.target.value)} className={inputCls}>
                <option value="">No subject (uncategorized)</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
              </select>
              <p className="muted mt-1 text-[11px]">Optional — picking a subject helps others find this.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="a-topic" className={labelCls}>Topic</label>
              {topics.length>0 ? (
                <select id="a-topic" value={form.topicId} onChange={e=>{set("topicId",e.target.value);}} className={inputCls}>
                  <option value="">— Custom / none —</option>{topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              ) : <input id="a-topic" value={form.topic} onChange={e=>set("topic",e.target.value)} className={inputCls} placeholder="e.g. Matrices" maxLength={200} />}
              {form.topicId==="" && topics.length>0 && <input aria-label="Custom topic" value={form.topic} onChange={e=>set("topic",e.target.value)} className={`${inputCls} mt-2`} placeholder="Or type a custom topic" maxLength={200} />}
            </div>
            <div><label htmlFor="a-class" className={labelCls}>Source classification</label>
              <select id="a-class" value={form.sourceClassification} onChange={e=>set("sourceClassification",e.target.value)} className={inputCls}>
                {CLASSIFICATIONS.map(c=><option key={c} value={c}>{c.charAt(0)+c.slice(1).toLowerCase()}</option>)}
              </select>
              <p className="muted mt-1 text-[11px]">Choose honestly. Only mark Official if sourced from the college/university.</p></div>
          </div>
          <div><label htmlFor="a-desc" className={labelCls}>Description</label>
            <textarea id="a-desc" value={form.description} onChange={e=>set("description",e.target.value)} className={`${inputCls} min-h-24`} rows={3} maxLength={5000} placeholder="What does this cover? Which units, chapters, exam?" />
            {errors.description && <p className={errCls}>{errors.description}</p>}</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><label htmlFor="a-sem" className={labelCls}>Semester</label>
              <select id="a-sem" value={form.semester} onChange={e=>set("semester",e.target.value)} className={inputCls}><option value="">—</option>{[1,2,3,4,5,6,7,8,9,10,11,12].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
            <div><label htmlFor="a-year" className={labelCls}>Year</label>
              <select id="a-year" value={form.year} onChange={e=>set("year",e.target.value)} className={inputCls}><option value="">—</option>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
              {errors.year && <p className={errCls}>{errors.year}</p>}</div>
            <div><label htmlFor="a-ay" className={labelCls}>Acad. year</label>
              <select id="a-ay" value={form.academicYear} onChange={e=>set("academicYear",e.target.value)} className={inputCls}>{["FE","SE","TE","BE","FY","SY","TY","LY",""].map(a=><option key={a} value={a}>{a||"—"}</option>)}</select></div>
            {form.resourceType==="PYQ" && <div><label htmlFor="a-exam" className={labelCls}>Exam type</label>
              <select id="a-exam" value={form.examType} onChange={e=>set("examType",e.target.value)} className={inputCls}><option value="">—</option>{["Unit Test","Mid Semester","End Semester","University","Practical","Other"].map(t=><option key={t} value={t}>{t}</option>)}</select></div>}
          </div>
          <div><label htmlFor="a-tags" className={labelCls}>Tags (comma-separated)</label>
            <input id="a-tags" value={form.tags} onChange={e=>set("tags",e.target.value)} className={inputCls} placeholder="matrices, calculus, important" /></div>
          <fieldset className="rounded-xl border hairline p-4">
            <legend className="px-1 text-[13px] font-semibold">Source *</legend>
            <div className="flex gap-2" role="radiogroup" aria-label="Source type">
              <button type="button" role="radio" aria-checked={form.sourceType==="EXTERNAL_URL"} onClick={()=>set("sourceType","EXTERNAL_URL")}
                className={form.sourceType==="EXTERNAL_URL"?"flex-1 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-gray-900":"surface hairline flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium"}>
                <Link2 size={14} className="mr-1.5 inline"/>External link</button>
              <button type="button" role="radio" aria-checked={form.sourceType==="FILE"} onClick={()=>set("sourceType","FILE")}
                className={form.sourceType==="FILE"?"flex-1 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-gray-900":"surface hairline flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium"}>
                <Upload size={14} className="mr-1.5 inline"/>Upload file</button>
            </div>
            {form.sourceType==="EXTERNAL_URL" ? (
              <div className="mt-3"><label htmlFor="a-url" className={labelCls}>URL (https://) *</label>
                <input id="a-url" type="url" value={form.url} onChange={e=>set("url",e.target.value)} className={inputCls} placeholder="https://…" inputMode="url" />
                {errors.url && <p className={errCls}>{errors.url}</p>}</div>
            ) : (
              <div className="mt-3">
                <label htmlFor="a-file" className={labelCls}>File (PDF, DOCX, PPTX, XLSX, PNG, JPG, TXT, MD, ZIP · max 15 MB)</label>
                <input id="a-file" type="file" accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.md,.zip" onChange={e=>onFile(e.target.files?.[0]||null)}
                  className="focus-ring surface hairline w-full rounded-lg border px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white dark:file:bg-white dark:file:text-gray-900" />
                {uploading && <p className="muted mt-1 text-sm" role="status">Uploading…</p>}
                {file && <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={15}/> {file.fileName} ({(file.fileSize/1024).toFixed(1)} KB)</p>}
                {errors.file && <p className={errCls}>{errors.file}</p>}
              </div>
            )}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="a-author" className={labelCls}>Author (optional)</label>
              <input id="a-author" value={form.author} onChange={e=>set("author",e.target.value)} className={inputCls} placeholder="Original author, if known" maxLength={200} /></div>
            <div><label htmlFor="a-cname" className={labelCls}>Your name (optional)</label>
              <input id="a-cname" value={form.contributorName} onChange={e=>set("contributorName",e.target.value)} className={inputCls} placeholder="Shown as contributor" maxLength={120} /></div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t hairline pt-4">
          <button type="submit" disabled={submitting||uploading} className="focus-ring rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting?"Saving…":editId?"Save changes":"Submit resource"}</button>
          <Link href="/resources" className="focus-ring rounded-xl border hairline px-4 py-2.5 text-sm font-medium surface">Cancel</Link>
          {!editId && <p className="muted w-full text-xs">New submissions go to Pending Review and appear after admin approval.</p>}
        </div>
      </form>
    </div>
  );
}

export default function AddPage() {
  return <Suspense fallback={<p className="muted text-sm">Loading…</p>}><AddInner /></Suspense>;
}
