"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Bookmark, Clock, FileText, FlaskConical, GraduationCap, Home, Layers, Library, Menu, Moon, NotebookPen, Plus, Search, Settings, ShieldCheck, Sun, X, CalendarDays, FileQuestion, Microscope, ClipboardList } from "lucide-react";
import { cx, getDeviceId, safeGet } from "@/lib/utils";
import { useStoredValue } from "./ui";

type Theme = "light"|"dark"|"system";
function applyTheme(t: Theme) {
  const root = document.documentElement;
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

export function useTheme() {
  const [stored, setStored] = useStoredValue("crh_theme", "system");
  const theme = (stored === "light" || stored === "dark" ? stored : "system") as Theme;
  useEffect(()=>{
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => { if ((safeGet("crh_theme") || "system") === "system") applyTheme("system"); };
    mq.addEventListener("change", fn); return ()=>mq.removeEventListener("change", fn);
  },[]);
  const set = (t: Theme) => { setStored(t); applyTheme(t); };
  return { theme, set };
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

const NAV = [
  { href:"/", label:"Home", icon: Home },
  { href:"/resources", label:"All Resources", icon: Library },
  { href:"/subjects", label:"Subjects", icon: BookOpen },
  { href:"/notes", label:"Notes", icon: NotebookPen },
  { href:"/pyqs", label:"PYQs", icon: FileQuestion },
  { href:"/lab", label:"Lab / Practical", icon: FlaskConical },
  { href:"/question-banks", label:"Question Banks", icon: Layers },
  { href:"/saved", label:"Saved", icon: Bookmark },
  { href:"/recent", label:"Recent", icon: Clock },
  { href:"/academic", label:"Academic", icon: CalendarDays },
  { href:"/add", label:"Add Resource", icon: Plus, accent:true },
  { href:"/settings", label:"Settings", icon: Settings },
];

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const close = useCallback(()=>{ setQ(""); onClose(); },[onClose]);
  useEffect(()=>{ if (open) { const t = setTimeout(()=>inputRef.current?.focus(), 30); return ()=>clearTimeout(t); } },[open]);
  useEffect(()=>{
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", fn); return ()=>window.removeEventListener("keydown", fn);
  },[open, close]);
  if (!open) return null;
  const cmds = [
    { label:"Search resources", hint:"Go to search", run:()=>router.push(q?`/search?q=${encodeURIComponent(q)}`:"/search") },
    { label:"Open saved", hint:"Saved", run:()=>router.push("/saved") },
    { label:"Open recent", hint:"Recent", run:()=>router.push("/recent") },
    { label:"Add resource", hint:"Contribute", run:()=>router.push("/add") },
    { label:"Open subjects", hint:"Browse", run:()=>router.push("/subjects") },
    { label:"Open PYQs", hint:"Browse", run:()=>router.push("/pyqs") },
    { label:"Open notes", hint:"Browse", run:()=>router.push("/notes") },
    { label:"Open academic", hint:"Timetable & exams", run:()=>router.push("/academic") },
    { label:"Open admin", hint:"Moderation", run:()=>router.push("/admin") },
  ].filter(c=>!q || c.label.toLowerCase().includes(q.toLowerCase()));
  const submit = () => { const first = cmds[0]; close(); if (first) first.run(); else router.push(`/search?q=${encodeURIComponent(q)}`); };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command search" onClick={close}>
      <div className="surface hairline w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b hairline px-4 py-3">
          <Search size={16} className="muted" aria-hidden />
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search resources or jump to…" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            onKeyDown={e=>{ if(e.key==="Enter") submit(); }} aria-label="Command search input" />
          <kbd className="muted hidden rounded border hairline px-1.5 py-0.5 text-[10px] sm:block">ESC</kbd>
        </div>
        <ul className="max-h-72 overflow-auto p-1.5" role="listbox" aria-label="Commands">
          {cmds.map(c=>(
            <li key={c.label}>
              <button onClick={()=>{close(); c.run();}} className="focus-ring flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5">
                <span className="font-medium">{c.label}</span><span className="muted text-xs">{c.hint}</span>
              </button>
            </li>
          ))}
          {cmds.length===0 && <li className="muted px-3 py-6 text-center text-sm">No matches. Press Enter to search resources.</li>}
        </ul>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [headerQ, setHeaderQ] = useState("");
  const { theme, set } = useTheme();
  const [adminFlag] = useStoredValue("crh_admin", "");
  const isAdmin = adminFlag === "1";
  useEffect(()=>{ getDeviceId(); },[]);

  const openSearch = useCallback(()=>{ setMobileOpen(false); setPalette(true); },[]);
  useEffect(()=>{
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable);
      if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="k") { e.preventDefault(); openSearch(); }
      if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="n" && !typing) { e.preventDefault(); router.push("/add"); }
    };
    window.addEventListener("keydown", fn); return ()=>window.removeEventListener("keydown", fn);
  },[openSearch, router]);

  useEffect(()=>{
    if (!mobileOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", fn); return ()=>window.removeEventListener("keydown", fn);
  },[mobileOpen]);

  const cycleTheme = () => set(theme==="light"?"dark":theme==="dark"?"system":"light");

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
      {/* Top bar */}
      <header className="surface sticky top-0 z-40 border-b hairline">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:px-5">
          <button className="focus-ring rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden" onClick={()=>setMobileOpen(v=>!v)} aria-label={mobileOpen?"Close menu":"Open menu"} aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-lg" aria-label="College Resource Hub home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900" aria-hidden><GraduationCap size={18}/></span>
            <span className="hidden text-[15px] font-bold tracking-tight sm:block">College Resource Hub</span>
            <span className="text-[15px] font-bold sm:hidden">CRH</span>
          </Link>
          <div className="mx-2 hidden flex-1 md:block">
            <button onClick={openSearch} className="focus-ring muted flex w-full max-w-xl items-center gap-2 rounded-lg border hairline bg-gray-50 px-3 py-2 text-sm hover:border-gray-400 dark:bg-white/5" aria-label="Search (Ctrl+K)">
              <Search size={15} aria-hidden /><span className="flex-1 text-left">Search notes, PYQs, subjects, topics…</span>
              <kbd className="hidden rounded border hairline px-1.5 py-0.5 text-[10px] lg:block">Ctrl K</kbd>
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={openSearch} className="focus-ring rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5 md:hidden" aria-label="Search"><Search size={19}/></button>
            <button onClick={cycleTheme} suppressHydrationWarning className="focus-ring rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5" aria-label={`Theme: ${theme}. Activate to change.`} title={`Theme: ${theme}`}>
              {theme==="dark" ? <Moon size={19}/> : theme==="light" ? <Sun size={19}/> : <span className="flex items-center gap-1 text-xs font-semibold muted"><Sun size={15}/>Auto</span>}
            </button>
            <Link href="/add" className="focus-ring hidden items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:inline-flex"><Plus size={15} aria-hidden />Add Resource</Link>
            {isAdmin && <Link href="/admin" suppressHydrationWarning className="focus-ring hidden items-center gap-1 rounded-lg border hairline px-2.5 py-2 text-sm font-medium sm:inline-flex" title="Admin"><ShieldCheck size={15} aria-hidden /></Link>}
          </div>
        </div>
        <div className="border-t hairline px-3 py-2 md:hidden">
          <form onSubmit={e=>{e.preventDefault(); router.push(`/search?q=${encodeURIComponent(headerQ)}`);}} role="search">
            <label className="sr-only" htmlFor="m-search">Search resources</label>
            <div className="flex items-center gap-2 rounded-lg border hairline bg-gray-50 px-3 py-2 dark:bg-white/5">
              <Search size={15} className="muted" aria-hidden />
              <input id="m-search" value={headerQ} onChange={e=>setHeaderQ(e.target.value)} placeholder="Search notes, PYQs, subjects…" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        {/* Sidebar desktop */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r hairline p-3 lg:block" aria-label="Primary">
          <nav><ul className="space-y-0.5">
            <li className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider muted">Browse</li>
            {NAV.slice(0,7).map(n=>(
              <li key={n.href}><Link href={n.href} aria-current={isActivePath(pathname,n.href)?"page":undefined}
                className={cx("focus-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", isActivePath(pathname,n.href) ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-100 dark:hover:bg-white/5", (n as {accent?:boolean}).accent && "font-semibold text-blue-700 dark:text-blue-300")}>
                <n.icon size={16} aria-hidden />{n.label}</Link></li>
            ))}
            <li className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider muted">Personal</li>
            {NAV.slice(7,9).map(n=>(
              <li key={n.href}><Link href={n.href} aria-current={isActivePath(pathname,n.href)?"page":undefined}
                className={cx("focus-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", isActivePath(pathname,n.href) ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-100 dark:hover:bg-white/5")}>
                <n.icon size={16} aria-hidden />{n.label}</Link></li>
            ))}
            <li className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider muted">More</li>
            {NAV.slice(9).map(n=>(
              <li key={n.href}><Link href={n.href} aria-current={isActivePath(pathname,n.href)?"page":undefined}
                className={cx("focus-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", isActivePath(pathname,n.href) ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-100 dark:hover:bg-white/5", (n as {accent?:boolean}).accent && "font-semibold text-blue-700 dark:text-blue-300")}>
                <n.icon size={16} aria-hidden />{n.label}</Link></li>
            ))}
            <li><Link href="/admin" aria-current={pathname.startsWith("/admin")?"page":undefined} className={cx("focus-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", pathname.startsWith("/admin") ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-100 dark:hover:bg-white/5")}><ShieldCheck size={16} aria-hidden />Admin</Link></li>
          </ul></nav>
          <div className="surface hairline mt-4 rounded-xl border p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold"><Microscope size={13}/> Contribute</p>
            <p className="muted mt-1 text-xs leading-relaxed">Share notes & PYQs only when you have the right to do so.</p>
            <Link href="/add" className="focus-ring mt-2 inline-flex items-center gap-1 rounded-lg border hairline px-2.5 py-1.5 text-xs font-semibold hover:border-gray-400"><Plus size={12}/> Add resource</Link>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setMobileOpen(false)} />
            <div className="surface absolute left-0 top-0 h-full w-72 overflow-y-auto border-r hairline p-3 pt-16">
              <nav><ul className="space-y-0.5">
                {NAV.map(n=>(
                  <li key={n.href}><Link href={n.href} onClick={()=>setMobileOpen(false)} className={cx("flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px]", isActivePath(pathname,n.href)?"bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900":"hover:bg-gray-100 dark:hover:bg-white/5")}><n.icon size={17} aria-hidden />{n.label}</Link></li>
                ))}
                <li><Link href="/admin" onClick={()=>setMobileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px] hover:bg-gray-100 dark:hover:bg-white/5"><ShieldCheck size={17} aria-hidden />Admin</Link></li>
              </ul></nav>
            </div>
          </div>
        )}

        {/* Main */}
        <main id="main" className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="surface fixed bottom-0 left-0 right-0 z-40 border-t hairline lg:hidden" aria-label="Mobile">
        <ul className="grid grid-cols-5 text-[11px] font-medium">
          {[
            { href:"/", label:"Home", icon: Home },
            { href:"/resources", label:"Browse", icon: Library },
            { href:"/add", label:"Add", icon: Plus },
            { href:"/saved", label:"Saved", icon: Bookmark },
            { href:"/academic", label:"Academic", icon: CalendarDays },
          ].map(n=>(
            <li key={n.href}><Link href={n.href} className={cx("flex flex-col items-center gap-0.5 py-2", isActivePath(pathname,n.href)?"text-blue-600 dark:text-blue-400":"muted")} aria-current={isActivePath(pathname,n.href)?"page":undefined}><n.icon size={19} aria-hidden />{n.label}</Link></li>
          ))}
        </ul>
      </nav>
      <div className="h-14 lg:hidden" aria-hidden />

      <CommandPalette open={palette} onClose={()=>setPalette(false)} />
      <footer className="border-t hairline py-6 text-center text-xs muted">
        <p>College Resource Hub · v1.0.0 · Student-contributed content is unverified unless marked Official.</p>
        <p className="mt-1"><Link href="/settings" className="underline">Settings & Data</Link> · <Link href="/admin" className="underline">Admin</Link> · <Link href="/academic/notices" className="underline">Notices</Link></p>
      </footer>
    </div>
  );
}

export function ClipboardListIcon() { return <ClipboardList size={13}/>; }
export { FileText };
