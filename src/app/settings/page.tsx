"use client";
import { useState } from "react";
import { Download, Upload, Trash2, ShieldCheck, Sun, Moon, Monitor } from "lucide-react";
import { Breadcrumbs, useStoredValue } from "@/components/ui";
import { getDeviceId, adminHeaders, safeDel } from "@/lib/utils";
import { APP_VERSION, SCHEMA_VERSION } from "@/lib/types";

export default function SettingsPage() {
  const [theme, setThemeStored] = useStoredValue("crh_theme", "system");
  const [viewRaw, setViewStored] = useStoredValue("crh_view", '"grid"');
  const [adminKey, setAdminKey] = useStoredValue("crh_admin_key", "");
  const [adminFlag, setAdminFlag] = useStoredValue("crh_admin", "");
  const isAdmin = adminFlag === "1";
  let view = "grid";
  try { view = JSON.parse(viewRaw) || "grid"; } catch { view = "grid"; }
  const [msg, setMsg] = useState("");

  const applyTheme = (t: string) => {
    setThemeStored(t);
    const dark = t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };
  const applyView = (v: string) => setViewStored(JSON.stringify(v));

  const doExport = async () => {
    setMsg("");
    try {
      const res = await fetch(`/api/data?deviceId=${getDeviceId()}`);
      const j = await res.json();
      if (!res.ok) { setMsg(j.error || "Export failed. Please try again."); return; }
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `crh-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg("Export downloaded.");
    } catch { setMsg("Export failed. Please try again."); }
  };

  const doImport = async (f: File|null) => {
    if (!f) return;
    setMsg("");
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/data?mode=merge", { method:"POST", headers:{ "Content-Type":"application/json", ...adminHeaders() }, body: JSON.stringify(data) });
      const j = await res.json();
      if (!res.ok) { setMsg(j.error + (j.errors?`: ${j.errors.slice(0,3).join("; ")}`:"")); return; }
      const c = j.imported || {};
      const parts = ["resources","subjects","topics","timetable","calendar","exams","notices"].map(k=>`${c[k]||0} ${k}`);
      setMsg(`Import complete: ${parts.join(", ")}.`);
    } catch { setMsg("Invalid JSON file."); }
  };

  const unlockAdmin = async () => {
    const res = await fetch("/api/admin", { headers: { "x-admin-key": adminKey } });
    if (res.ok) { setAdminFlag("1"); setMsg("Admin unlocked."); }
    else { setAdminFlag(""); setMsg("Invalid admin key."); }
  };
  const lockAdmin = () => { setAdminFlag(""); setAdminKey(""); setMsg("Admin locked."); };

  const resetLocal = () => {
    if (!confirm("Reset local preferences (theme, view, device bookmarks cache)? Server data is kept.")) return;
    safeDel("crh_theme"); safeDel("crh_view");
    applyTheme("system"); applyView("grid"); setMsg("Local preferences reset.");
  };

  return (
    <div>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Settings"}]} />
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>
      {msg && <p role="status" className="surface hairline mt-3 rounded-xl border p-3 text-sm">{msg}</p>}

      <section className="surface hairline mt-4 rounded-xl border p-4" aria-labelledby="s-appear">
        <h2 id="s-appear" className="text-sm font-bold">Appearance</h2>
        <div className="mt-2.5 flex gap-2" role="radiogroup" aria-label="Theme">
          {[{v:"light",l:"Light",Icon:Sun},{v:"dark",l:"Dark",Icon:Moon},{v:"system",l:"System",Icon:Monitor}].map(({v,l,Icon})=>(
            <button key={v} role="radio" aria-checked={theme===v} onClick={()=>applyTheme(v)}
              className={theme===v?"flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-gray-900":"surface hairline flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium"}>
              <Icon size={15}/>{l}</button>
          ))}
        </div>
      </section>

      <section className="surface hairline mt-3 rounded-xl border p-4" aria-labelledby="s-pref">
        <h2 id="s-pref" className="text-sm font-bold">Resource preferences</h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <label className="text-sm">Default view
            <select value={view} onChange={e=>applyView(e.target.value)} className="focus-ring surface hairline ml-2 rounded-lg border px-2.5 py-2 text-sm">
              <option value="grid">Grid</option><option value="list">List</option>
            </select></label>
        </div>
      </section>

      <section className="surface hairline mt-3 rounded-xl border p-4" aria-labelledby="s-data">
        <h2 id="s-data" className="text-sm font-bold">Data</h2>
        <p className="muted mt-1 text-[13px]">Export includes subjects, topics, resources and your saved/history on this device (schema v{SCHEMA_VERSION}).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={doExport} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"><Download size={15}/>Export data</button>
          <label className="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-lg border hairline px-4 py-2 text-sm font-medium surface">
            <Upload size={15}/>Import (admin)<input type="file" accept="application/json" className="sr-only" onChange={e=>doImport(e.target.files?.[0]||null)} />
          </label>
          <button onClick={resetLocal} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border hairline px-4 py-2 text-sm font-medium surface"><Trash2 size={15}/>Reset local prefs</button>
        </div>
      </section>

      <section className="surface hairline mt-3 rounded-xl border p-4" aria-labelledby="s-admin">
        <h2 id="s-admin" className="flex items-center gap-1.5 text-sm font-bold"><ShieldCheck size={15}/>Admin access</h2>
        <p className="muted mt-1 text-[13px]">Admins moderate resources, resolve reports and manage academic data. The admin key is set by the site owner via the ADMIN_KEY environment variable.</p>
        {isAdmin ? (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Unlocked</span>
            <button onClick={lockAdmin} className="focus-ring rounded-lg border hairline px-3 py-2 text-sm">Lock</button>
          </div>
        ) : (
          <div className="mt-2.5 flex gap-2">
            <label htmlFor="adm-key" className="sr-only">Admin key</label>
            <input id="adm-key" type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="Enter admin key" className="focus-ring surface hairline min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button onClick={unlockAdmin} className="focus-ring rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Unlock</button>
          </div>
        )}
      </section>

      <section className="surface hairline mt-3 rounded-xl border p-4" aria-labelledby="s-about">
        <h2 id="s-about" className="text-sm font-bold">About</h2>
        <dl className="mt-1 text-sm">
          <div className="flex justify-between border-b hairline py-2"><dt className="muted">Version</dt><dd className="font-medium">{APP_VERSION}</dd></div>
          <div className="flex justify-between border-b hairline py-2"><dt className="muted">Schema</dt><dd className="font-medium">v{SCHEMA_VERSION}</dd></div>
          <div className="flex justify-between border-b hairline py-2"><dt className="muted">Device ID</dt><dd className="font-mono text-xs" suppressHydrationWarning>{typeof window!=="undefined"?getDeviceId():"—"}</dd></div>
          <div className="flex justify-between py-2"><dt className="muted">Privacy</dt><dd className="max-w-[60%] text-right text-[13px]">Bookmarks & history are stored per-device. No location or personal files are collected.</dd></div>
        </dl>
      </section>
    </div>
  );
}
