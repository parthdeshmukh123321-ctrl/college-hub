import { RESOURCE_TYPES, SOURCE_TYPES, STATUS_VALUES, VISIBILITY_VALUES, CLASSIFICATIONS } from "./types";

export const MAX_TITLE = 200;
export const MAX_DESC = 5000;
export const MAX_FILE_SIZE = 15 * 1024 * 1024;
export const ALLOWED_MIME: Record<string,string[]> = {
  "application/pdf": ["pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "image/png": ["png"], "image/jpeg": ["jpg","jpeg"], "image/webp": ["webp"],
  "text/plain": ["txt"], "text/markdown": ["md"],
  "application/zip": ["zip"],
};
export const ALLOWED_EXTS = ["pdf","docx","pptx","xlsx","png","jpg","jpeg","webp","txt","md","zip"];

export function isValidHttpUrl(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  const s = raw.trim();
  if (s.length > 2048) return false;
  const lower = s.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:") || lower.startsWith("vbscript:")) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

export function sanitizeFilename(name: string): string {
  return (name||"file").replace(/[^a-zA-Z0-9._-]/g,"_").replace(/\.+/g,".").slice(0,120) || "file";
}

export function validateResourcePayload(p: Record<string, unknown>): { ok: boolean; errors: Record<string,string> } {
  const errors: Record<string,string> = {};
  const title = String(p.title ?? "").trim();
  if (!title) errors.title = "Title is required.";
  else if (title.length > MAX_TITLE) errors.title = `Title must be under ${MAX_TITLE} characters.`;
  const rt = String(p.resourceType ?? "");
  if (!RESOURCE_TYPES.includes(rt as never)) errors.resourceType = "Choose a valid resource type.";
  const st = String(p.sourceType ?? "");
  if (!SOURCE_TYPES.includes(st as never)) errors.sourceType = "Choose a valid source type.";
  if (st === "EXTERNAL_URL") {
    const url = String(p.url ?? "").trim();
    if (!url) errors.url = "URL is required for link resources.";
    else if (!isValidHttpUrl(url)) errors.url = "Enter a valid http(s) URL.";
  }
  if (p.description && String(p.description).length > MAX_DESC) errors.description = "Description is too long.";
  if (p.tags && !Array.isArray(p.tags)) errors.tags = "Tags must be a list.";
  if (p.year !== undefined && p.year !== null && p.year !== "") {
    const y = Number(p.year);
    if (!Number.isInteger(y) || y < 1990 || y > 2100) errors.year = "Year must be between 1990 and 2100.";
  }
  if (p.semester !== undefined && p.semester !== null && p.semester !== "") {
    const s = Number(p.semester);
    if (!Number.isInteger(s) || s < 1 || s > 12) errors.semester = "Semester must be 1–12.";
  }
  if (p.status && !STATUS_VALUES.includes(String(p.status) as never)) errors.status = "Invalid status.";
  if (p.visibility && !VISIBILITY_VALUES.includes(String(p.visibility) as never)) errors.visibility = "Invalid visibility.";
  if (p.sourceClassification && !CLASSIFICATIONS.includes(String(p.sourceClassification) as never)) errors.sourceClassification = "Invalid classification.";
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateFileUpload(mime: string, ext: string, size: number): string | null {
  if (size <= 0) return "File is empty.";
  if (size > MAX_FILE_SIZE) return "File exceeds 15 MB limit.";
  const e = ext.toLowerCase().replace(/^\./,"");
  if (!ALLOWED_EXTS.includes(e)) return `Unsupported file type .${e}. Allowed: ${ALLOWED_EXTS.join(", ")}.`;
  const allowed = ALLOWED_MIME[mime];
  if (!allowed) return `Unsupported MIME type ${mime}.`;
  if (!allowed.includes(e) && !(mime==="image/jpeg" && (e==="jpg"||e==="jpeg"))) return `Extension .${e} does not match MIME ${mime}.`;
  return null;
}

export function escapeHtml(s: string): string {
  return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
