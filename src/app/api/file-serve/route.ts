import { NextResponse } from "next/server";
import { db, files, resources, adminKeyOk } from "@/lib/repo";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const id = u.searchParams.get("id") || "";
    // id may be fileId or resourceId
    let f = (await db.select().from(files).where(eq(files.id, id)).limit(1))[0];
    let downloadName = f?.fileName;
    if (!f) {
      const r = (await db.select().from(resources).where(eq(resources.id, id)).limit(1))[0];
      if (r?.fileId) {
        f = (await db.select().from(files).where(eq(files.id, r.fileId)).limit(1))[0];
        downloadName = r.fileName || f?.fileName;
      }
    }
    if (!f) return NextResponse.json({ error: "File not found." }, { status: 404 });
    if (!adminKeyOk(req)) {
      // Files attached to non-published/private resources stay hidden.
      const linked = await db.select({ status: resources.status, visibility: resources.visibility }).from(resources).where(eq(resources.fileId, f.id)).limit(1);
      if (linked.length && (linked[0].status !== "PUBLISHED" || linked[0].visibility === "PRIVATE"))
        return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    const full = path.join(process.cwd(), "public", "uploads", path.basename(f.storagePath));
    const buf = await fs.readFile(full);
    const ab = new ArrayBuffer(buf.length);
    new Uint8Array(ab).set(buf);
    return new NextResponse(ab, {
      headers: {
        "Content-Type": f.mime,
        "Content-Disposition": `inline; filename="${(downloadName||"file").replace(/"/g,"")}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: "File unavailable." }, { status: 404 }); }
}
