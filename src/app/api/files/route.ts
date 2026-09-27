import { NextResponse } from "next/server";
import { db, files } from "@/lib/repo";
import { validateFileUpload, sanitizeFilename } from "@/lib/validation";
import { uid } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const id = u.searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
    const rows = await db.select().from(files).where(eq(files.id, id)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "File not found." }, { status: 404 });
    return NextResponse.json({ file: rows[0], url: `/uploads/${rows[0].storagePath}` });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load this file." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (!f || !(f instanceof Blob)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    const origName = (form.get("filename") as string) || (f as unknown as { name?: string }).name || "upload";
    const mime = f.type || "application/octet-stream";
    const ext = (sanitizeFilename(origName).split(".").pop() || "").toLowerCase();
    const err = validateFileUpload(mime, ext, f.size);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const buf = Buffer.from(await f.arrayBuffer());
    const hash = createHash("sha256").update(buf).digest("hex").slice(0,32);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const id = uid("file");
    const safe = sanitizeFilename(origName);
    const stored = `${id}_${safe}`;
    await fs.writeFile(path.join(UPLOAD_DIR, stored), buf);
    await db.insert(files).values({ id, fileName: safe.slice(0,200), mime, size: buf.length, storagePath: stored, hash }).onConflictDoNothing();
    return NextResponse.json({ id, fileName: safe, fileMime: mime, fileSize: buf.length, url: `/uploads/${stored}` }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 }); }
}
