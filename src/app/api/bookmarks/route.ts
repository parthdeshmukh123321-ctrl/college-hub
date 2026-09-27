import { NextResponse } from "next/server";
import { db, bookmarks, resources, subjects } from "@/lib/repo";
import { uid } from "@/lib/utils";
import { eq, and } from "drizzle-orm";

function device(req: Request, body?: Record<string,string>): string {
  const u = new URL(req.url);
  return (body?.deviceId || u.searchParams.get("deviceId") || req.headers.get("x-device-id") || "local").slice(0,80);
}

export async function GET(req: Request) {
  try {
    const d = device(req);
    const bms = await db.select().from(bookmarks).where(eq(bookmarks.deviceId, d)).limit(500);
    if (!bms.length) return NextResponse.json({ items: [], ids: [] });
    const ids = bms.map(b=>b.resourceId);
    const res = await db.select().from(resources).where(eq(resources.status, "PUBLISHED")).limit(5000);
    const filtered = res.filter(r=>ids.includes(r.id));
    const subs = await db.select().from(subjects);
    const sm = new Map(subs.map(s=>[s.id,s]));
    const bmDate = new Map(bms.map(b=>[b.resourceId, b.createdAt]));
    const items = filtered.map(r=>{ const s=r.subjectId?sm.get(r.subjectId):undefined;
      return { ...r, tags:(r.tags as string[])||[], createdAt:r.createdAt.toISOString(), updatedAt:r.updatedAt.toISOString(), lastAccessedAt:r.lastAccessedAt?r.lastAccessedAt.toISOString():null, subjectName:s?.name||"", subjectCode:s?.code||"", savedAt: (bmDate.get(r.id)?.toISOString?.()||"") }; })
      .sort((a,b)=>+new Date(b.savedAt)-+new Date(a.savedAt));
    return NextResponse.json({ items, ids });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load saved resources." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const d = device(req, body);
    const resourceId = String(body.resourceId||"");
    if (!resourceId) return NextResponse.json({ error: "resourceId required." }, { status: 400 });
    const ex = await db.select().from(bookmarks).where(and(eq(bookmarks.deviceId,d), eq(bookmarks.resourceId,resourceId))).limit(1);
    if (!ex.length) await db.insert(bookmarks).values({ id: uid("bm"), deviceId: d, resourceId }).onConflictDoNothing();
    return NextResponse.json({ ok: true, saved: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't save this resource." }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const u = new URL(req.url);
    const d = (u.searchParams.get("deviceId") || req.headers.get("x-device-id") || "local").slice(0,80);
    const resourceId = u.searchParams.get("resourceId") || "";
    if (!resourceId) return NextResponse.json({ error: "resourceId required." }, { status: 400 });
    await db.delete(bookmarks).where(and(eq(bookmarks.deviceId,d), eq(bookmarks.resourceId,resourceId)));
    return NextResponse.json({ ok: true, saved: false });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't remove this bookmark." }, { status: 500 }); }
}
