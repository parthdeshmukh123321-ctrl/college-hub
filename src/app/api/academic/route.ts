import { NextResponse } from "next/server";
import { db, timetableEntries, calendarEvents, exams, notices, adminKeyOk, ensureSeeded } from "@/lib/repo";
import { uid } from "@/lib/utils";
import { eq } from "drizzle-orm";

const TABLES = { timetable: timetableEntries, calendar: calendarEvents, exams, notices } as const;

export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const u = new URL(req.url);
    const kind = u.searchParams.get("kind") || "all";
    if (kind === "all" || !kind) {
      const [tt, cal, ex, nt] = await Promise.all([
        db.select().from(timetableEntries).limit(200),
        db.select().from(calendarEvents).limit(200),
        db.select().from(exams).limit(200),
        db.select().from(notices).limit(200),
      ]);
      return NextResponse.json({ timetable: tt, calendar: cal, exams: ex, notices: nt.map(n=>({ ...n, createdAt: n.createdAt.toISOString() })) });
    }
    if (!(kind in TABLES)) return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
    // @ts-expect-error union table
    const rows = await db.select().from(TABLES[kind]).limit(300);
    return NextResponse.json({ items: rows });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load academic data." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const u = new URL(req.url);
    const kind = u.searchParams.get("kind") || "";
    const body = await req.json().catch(()=>({}));
    const id = uid("ac");
    if (kind === "timetable") {
      if (!body.day || !body.startTime || !body.endTime || !body.subject) return NextResponse.json({ error: "Day, time and subject are required." }, { status: 400 });
      await db.insert(timetableEntries).values({ id, day: String(body.day).slice(0,20), startTime: String(body.startTime).slice(0,10), endTime: String(body.endTime).slice(0,10), subject: String(body.subject).slice(0,200), subjectId: String(body.subjectId||""), faculty: String(body.faculty||"").slice(0,200), room: String(body.room||"").slice(0,40), type: String(body.type||"Lecture").slice(0,40), semester: Number(body.semester)||1 }).onConflictDoNothing();
    } else if (kind === "calendar") {
      if (!body.title || !body.date) return NextResponse.json({ error: "Title and date are required." }, { status: 400 });
      await db.insert(calendarEvents).values({ id, title: String(body.title).slice(0,200), date: String(body.date).slice(0,20), endDate: String(body.endDate||"").slice(0,20), type: String(body.type||"General").slice(0,40), description: String(body.description||"").slice(0,2000), isOfficial: !!body.isOfficial, sourceName: String(body.sourceName||"").slice(0,200), sourceUrl: String(body.sourceUrl||"").slice(0,500) }).onConflictDoNothing();
    } else if (kind === "exams") {
      if (!body.subject || !body.date) return NextResponse.json({ error: "Subject and date are required." }, { status: 400 });
      await db.insert(exams).values({ id, subject: String(body.subject).slice(0,200), subjectId: String(body.subjectId||""), date: String(body.date).slice(0,20), time: String(body.time||"").slice(0,40), location: String(body.location||"").slice(0,120), examType: String(body.examType||"End Semester").slice(0,40), semester: Number(body.semester)||1, isOfficial: !!body.isOfficial, sourceName: String(body.sourceName||"").slice(0,200), sourceUrl: String(body.sourceUrl||"").slice(0,500) }).onConflictDoNothing();
    } else if (kind === "notices") {
      if (!body.title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
      await db.insert(notices).values({ id, title: String(body.title).slice(0,200), date: String(body.date||new Date().toISOString().slice(0,10)).slice(0,20), category: String(body.category||"General").slice(0,60), content: String(body.content||"").slice(0,5000), source: String(body.source||"").slice(0,200), isOfficial: !!body.isOfficial, sourceUrl: String(body.sourceUrl||"").slice(0,500) }).onConflictDoNothing();
    } else return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't save this entry." }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const u = new URL(req.url);
    const kind = u.searchParams.get("kind") || "";
    const id = u.searchParams.get("id") || "";
    if (!id || !(kind in TABLES)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    // @ts-expect-error union table
    await db.delete(TABLES[kind]).where(eq(TABLES[kind].id, id));
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't delete this entry." }, { status: 500 }); }
}
