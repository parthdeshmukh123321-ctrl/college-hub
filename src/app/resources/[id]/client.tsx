"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Download, FileText, Eye, Flag, Pencil, ArrowLeft, AlertTriangle } from "lucide-react";
import type { Resource } from "@/lib/types";
import { getDeviceId, formatBytes, formatDate, timeAgo } from "@/lib/utils";
import { Breadcrumbs, TypeBadge, SourceBadge, BrokenBadge, SaveButton, MetaRow, ErrorBox, ResourceCard, EmptyState } from "@/components/ui";
import { useSavedIds } from "@/components/browser";
import { REPORT_REASONS } from "@/lib/types";

export default function DetailClient({ id }: { id: string }) {
  const [r, setR] = useState<Resource|null>(null);
  const [related, setRelated] = useState<Resource[]>([]);
  const [state, setState] = useState<"loading"|"ok"|"missing"|"error">("loading");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const { ids: saved, toggle } = useSavedIds();

  useEffect(()=>{
    let alive = true;
    fetch(`/api/resources/${id}`).then(async res=>{
      if (res.status === 404) { if (alive) setState("missing"); return; }
      if (!res.ok) throw new Error();
      const j = await res.json();
      if (!alive) return;
      setR(j.resource); setRelated(j.related||[]); setState("ok");
      const d = getDeviceId();
      fetch(`/api/resources/${id}`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ event:"VIEW" }) }).catch(()=>{});
      fetch("/api/history", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ deviceId: d, resourceId: id }) }).catch(()=>{});
    }).catch(()=>{ if (alive) setState("error"); });
    return ()=>{ alive = false; };
  },[id]);

  const submitReport = async () => {
    setReportMsg("");
    const res = await fetch("/api/reports", { method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ resourceId: id, reason, description: reportDesc, reporterId: getDeviceId() }) });
    if (res.ok) { setReportMsg("Thanks — our moderators will review this report."); setReportDesc(""); }
    else { const j = await res.json().catch(()=>({})); setReportMsg(j.error || "Couldn't submit report."); }
  };

  if (state === "loading") return <div className="space-y-3"><div className="skeleton h-8 w-2/3 rounded" /><div className="skeleton h-40 rounded-xl" /><div className="skeleton h-24 rounded-xl" /></div>;
  if (state === "missing") return <EmptyState icon={<FileText size={28}/>} title="Resource not found." body="It may have been removed or the link may be incorrect." action={<Link href="/resources" className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"><ArrowLeft size={14}/>Back to Resources</Link>} />;
  if (state === "error" || !r) return <ErrorBox message="We couldn't load this resource. Please try again." onRetry={()=>location.reload()} />;

  const meta = [r.subjectCode||r.subjectName, r.semester?`Semester ${r.semester}`:"", r.academicYear||"", r.year?String(r.year):""].filter(Boolean).join(" · ");
  const isPdf = r.fileMime === "application/pdf";
  const isImg = r.fileMime.startsWith("image/");
  const fileUrl = r.fileId ? `/api/file-serve?id=${r.fileId}` : "";

  return (
    <div>
      <Breadcrumbs items={[{label:"Resources",href:"/resources"}, ...(r.subjectId?[{label:r.subjectCode||r.subjectName||"Subject",href:`/subjects/${r.subjectId}`}]:[]), {label:r.title.slice(0,40)}]} />
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={r.resourceType} /><SourceBadge c={r.sourceClassification} />
        {r.isBroken && <BrokenBadge />}
        {r.isFeatured && <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">★ Featured</span>}
        {r.status !== "PUBLISHED" && <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Status: {r.status}</span>}
      </div>
      <h1 className="mt-2.5 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{r.title}</h1>
      <p className="muted mt-1 text-sm">{meta || "—"}</p>
      {(r.tags?.length) ? <div className="mt-2.5 flex flex-wrap gap-1.5">{r.tags.map(t=><Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="focus-ring rounded-md bg-gray-100 px-2 py-1 text-xs font-medium hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10">#{t}</Link>)}</div> : null}

      {r.description && (
        <div className="surface hairline mt-4 rounded-xl border p-4">
          <h2 className="text-sm font-bold">About this resource</h2>
          <p className="prose-safe mt-1.5 text-sm leading-relaxed">{r.description}</p>
        </div>
      )}

      <div className="surface hairline mt-3 rounded-xl border p-4">
        <h2 className="text-sm font-bold">Access</h2>
        {r.sourceType === "FILE" ? (
          r.fileId ? (
            <div className="mt-2.5">
              {isPdf ? (
                <div className="overflow-hidden rounded-lg border hairline">
                  <iframe src={fileUrl} title={`Preview of ${r.title}`} className="h-[480px] w-full bg-white" loading="lazy" />
                </div>
              ) : isImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl} alt={`Preview of ${r.title}`} className="max-h-[420px] w-auto rounded-lg border hairline" loading="lazy" />
              ) : (
                <p className="muted flex items-center gap-2 rounded-lg border hairline bg-gray-50 p-3 text-sm dark:bg-white/5"><FileText size={16}/>Preview unavailable for this file type.</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={()=>fetch(`/api/resources/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:"DOWNLOAD"})}).catch(()=>{})}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                  <Download size={15}/>Open / Download{r.fileName?` (${r.fileName})`:""}</a>
                <span className="muted self-center text-xs">{r.fileMime || ""}{r.fileSize?` · ${formatBytes(r.fileSize)}`:""}</span>
              </div>
            </div>
          ) : <p className="mt-2 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><AlertTriangle size={16}/>This resource is currently unavailable. The file is missing.</p>
        ) : r.url ? (
          <div className="mt-2.5">
            <p className="muted break-all text-[13px]">{r.url}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={()=>fetch(`/api/resources/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:"OPEN_EXTERNAL"})}).catch(()=>{})}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><ExternalLink size={15}/>Open Resource</a>
              <button onClick={()=>setReportOpen(v=>!v)} className="focus-ring muted inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm"><Flag size={14}/>Report broken link</button>
            </div>
            <p className="muted mt-2 text-xs">External links open in a new tab. Always verify content before relying on it.</p>
          </div>
        ) : <p className="muted mt-2 text-sm">No file or link attached to this resource.</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t hairline pt-3">
          <SaveButton saved={saved.has(r.id)} onToggle={()=>toggle(r.id, !saved.has(r.id))} />
          <Link href={`/add?id=${r.id}`} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-1.5 text-sm font-medium surface hover:border-gray-400"><Pencil size={14}/>Suggest edit</Link>
          <span className="muted ml-auto inline-flex items-center gap-3 text-xs"><span className="inline-flex items-center gap-1"><Eye size={13}/>{r.viewCount} views</span><span>{r.downloadCount} downloads</span></span>
        </div>
      </div>

      {reportOpen && (
        <div className="surface hairline mt-3 rounded-xl border p-4" role="form" aria-label="Report resource">
          <h2 className="text-sm font-bold">Report this resource</h2>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="rep-reason" className="mb-1 block text-xs font-semibold muted">Reason</label>
              <select id="rep-reason" value={reason} onChange={e=>setReason(e.target.value)} className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm">{REPORT_REASONS.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
            <div><label htmlFor="rep-desc" className="mb-1 block text-xs font-semibold muted">Details (optional)</label>
              <input id="rep-desc" value={reportDesc} onChange={e=>setReportDesc(e.target.value)} placeholder="What's wrong?" className="focus-ring surface hairline w-full rounded-lg border px-2.5 py-2 text-sm" /></div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={submitReport} className="focus-ring rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Submit report</button>
            {reportMsg && <p className="text-sm" role="status">{reportMsg}</p>}
          </div>
        </div>
      )}

      <div className="surface hairline mt-3 rounded-xl border p-4">
        <h2 className="text-sm font-bold">Details</h2>
        <dl className="mt-1">
          <MetaRow label="Uploaded" value={formatDate(r.createdAt)} />
          <MetaRow label="Updated" value={`${formatDate(r.updatedAt)} (${timeAgo(r.updatedAt)})`} />
          <MetaRow label="Contributor" value={r.contributorName || r.author || "—"} />
          <MetaRow label="Source" value={r.sourceClassification} />
          <MetaRow label="Exam type" value={r.examType || "—"} />
          <MetaRow label="Topic" value={r.topic || "—"} />
          {r.sourceType==="FILE" && <><MetaRow label="File type" value={r.fileMime || "—"} /><MetaRow label="File size" value={formatBytes(r.fileSize)} /></>}
        </dl>
      </div>

      {related.length>0 && (
        <section className="mt-6" aria-labelledby="rel">
          <h2 id="rel" className="text-base font-bold">Related resources</h2>
          <p className="muted text-xs">Based on same subject, topic, type and shared tags.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{related.map(x=><ResourceCard key={x.id} r={x} saved={saved.has(x.id)} onToggleSave={toggle}/>)}</div>
        </section>
      )}
    </div>
  );
}
