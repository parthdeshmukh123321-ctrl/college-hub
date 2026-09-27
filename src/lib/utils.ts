export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
}
export function timeAgo(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = new Date(iso); const now = new Date();
  const s = Math.floor((now.getTime()-d.getTime())/1000);
  if (isNaN(s)) return "—";
  if (s < 60) return "just now";
  const m = Math.floor(s/60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h/24); if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days/30); if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo/12)}y ago`;
}
export function formatDate(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(+d)) return "—";
  return d.toLocaleDateString("en-IN", { year:"numeric", month:"short", day:"numeric" });
}
export function formatBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1024/1024).toFixed(2)} MB`;
}
export function safeGet(key: string): string | null {
  try { return typeof window === "undefined" ? null : localStorage.getItem(key); }
  catch { return null; }
}
export function safeSet(key: string, value: string): void {
  try { if (typeof window !== "undefined") localStorage.setItem(key, value); } catch {}
}
export function safeDel(key: string): void {
  try { if (typeof window !== "undefined") localStorage.removeItem(key); } catch {}
}
let memDeviceId = "";
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = safeGet("crh_device_id");
  if (!id) { id = memDeviceId || (memDeviceId = uid("dev")); safeSet("crh_device_id", id); }
  return id;
}
export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return safeGet("crh_admin") === "1";
}
export function adminHeaders(): Record<string,string> {
  if (typeof window === "undefined") return {};
  const key = safeGet("crh_admin_key") || "";
  return key ? { "x-admin-key": key } : {};
}
export function cx(...parts: (string|false|undefined|null)[]): string {
  return parts.filter(Boolean).join(" ");
}
export function fileIcon(mime: string, ext = ""): string {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("word") || ext==="docx") return "DOC";
  if (mime.includes("presentation") || ext==="pptx") return "PPT";
  if (mime.includes("sheet") || ext==="xlsx") return "XLS";
  if (mime.startsWith("image/")) return "IMG";
  if (mime.includes("zip")) return "ZIP";
  return "FILE";
}
