import { NextResponse } from "next/server";
import { db, history, resources, subjects } from "@/lib/repo";
import { uid } from "@/lib/utils";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const d = (u.searchParams.get("deviceId") || req.headers.get("x-device-id") || "local").slice(0,80);
    const rows = await db.select().from(history).where(eq(history.deviceId,d)).orderBy(desc(history.viewedAt)).limit(50);
    if (!rows.length) return NextResponse.json({ items: [] });
    const res = await db.select().from(resources).limit(5000);
    const rm = new Map(res.map(r=>[r.id,r]));
    const subs = await db.select().from(subjects);
    const sm = new Map(subs.map(s=>[s.id,s]));
    const seen = new Set<string>();
    const items: unknown[] = [];
    for (const h of rows) {
      if (seen.has(h.resourceId)) continue;
      seen.add(h.resourceId);
      const r = rm.get(h.resourceId);
      if (!r || r.status !== "PUBLISHED") continue;
      const s = r.subjectId?sm.get(r.subjectId):undefined;
      items.push({ ...r, tags:(r.tags as string[])||[], createdAt:r.createdAt.toISOString(), updatedAt:r.updatedAt.toISOString(), lastAccessedAt:r.lastAccessedAt?r.lastAccessedAt.toISOString():null, subjectName:s?.name||"", subjectCode:s?.code||"", viewedAt: h.viewedAt.toISOString() });
      if (items.length >= 30) break;
    }
    return NextResponse.json({ items });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load history." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const d = String(body.deviceId||req.headers.get("x-device-id")||"local").slice(0,80);
    const resourceId = String(body.resourceId||"");
    if (!resourceId) return NextResponse.json({ error: "resourceId required." }, { status: 400 });
    await db.delete(history).where(and(eq(history.deviceId,d), eq(history.resourceId,resourceId)));
    await db.insert(history).values({ id: uid("h"), deviceId: d, resourceId }).onConflictDoNothing();
    // cap at 50
    const rows = await db.select().from(history).where(eq(history.deviceId,d)).orderBy(desc(history.viewedAt)).limit(100);
    if (rows.length > 50) {
      const extra = rows.slice(50);
      for (const r of extra) await db.delete(history).where(eq(history.id, r.id));
    }
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ ok: true }); }
}

export async function DELETE(req: Request) {
  try {
    const u = new URL(req.url);
    const d = (u.searchParams.get("deviceId") || "local").slice(0,80);
    await db.delete(history).where(eq(history.deviceId, d));
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't clear history." }, { status: 500 }); }
}
