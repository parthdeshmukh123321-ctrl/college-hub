import { NextResponse } from "next/server";
import { db, resources, subjects, reports, bookmarks, history, analyticsEvents, adminKeyOk } from "@/lib/repo";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const [resCount] = await db.select({ n: sql<number>`count(*)` }).from(resources);
    const [subCount] = await db.select({ n: sql<number>`count(*)` }).from(subjects);
    const [repOpen] = await db.select({ n: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "OPEN"));
    const [bmCount] = await db.select({ n: sql<number>`count(*)` }).from(bookmarks);
    const byType = await db.select({ t: resources.resourceType, n: sql<number>`count(*)` }).from(resources).groupBy(resources.resourceType);
    const byStatus = await db.select({ t: resources.status, n: sql<number>`count(*)` }).from(resources).groupBy(resources.status);
    const bySubject = await db.select({ t: resources.subjectId, n: sql<number>`count(*)` }).from(resources).groupBy(resources.subjectId).limit(50);
    const recent = await db.select().from(resources).orderBy(desc(resources.createdAt)).limit(10);
    const events = await db.select({ t: analyticsEvents.eventType, n: sql<number>`count(*)` }).from(analyticsEvents).groupBy(analyticsEvents.eventType);
    const subs = await db.select().from(subjects).limit(200);
    const sm = new Map(subs.map(s=>[s.id, `${s.code} — ${s.name}`]));
    return NextResponse.json({
      totals: { resources: Number(resCount.n), subjects: Number(subCount.n), openReports: Number(repOpen.n), bookmarks: Number(bmCount.n) },
      byType: byType.map(b=>({ label: b.t, count: Number(b.n) })),
      byStatus: byStatus.map(b=>({ label: b.t, count: Number(b.n) })),
      bySubject: bySubject.map(b=>({ label: sm.get(b.t||"") || b.t || "No subject", count: Number(b.n) })),
      recent: recent.map(r=>({ id: r.id, title: r.title, status: r.status, type: r.resourceType, views: r.viewCount, createdAt: r.createdAt.toISOString() })),
      events: events.map(e=>({ label: e.t, count: Number(e.n) })),
      health: { db: "ok", time: new Date().toISOString(), schemaVersion: 1 },
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load admin stats." }, { status: 500 }); }
}
