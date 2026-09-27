import { NextResponse } from "next/server";
import { db, subjects, topics, resources, bookmarks, history, timetableEntries, calendarEvents, exams, notices, adminKeyOk, ensureSeeded } from "@/lib/repo";
import { SCHEMA_VERSION, RESOURCE_TYPES, SOURCE_TYPES, STATUS_VALUES, VISIBILITY_VALUES } from "@/lib/types";
import { isValidHttpUrl } from "@/lib/validation";
import { eq, and, ne } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const u = new URL(req.url);
    const deviceId = u.searchParams.get("deviceId") || "";
    const isAdmin = adminKeyOk(req);
    const resQuery = isAdmin
      ? db.select().from(resources).limit(10000)
      : db.select().from(resources).where(and(eq(resources.status, "PUBLISHED"), ne(resources.visibility, "PRIVATE"))).limit(10000);
    const [subs, tps, res, tt, cal, ex, nt] = await Promise.all([
      db.select().from(subjects).limit(5000), db.select().from(topics).limit(5000),
      resQuery, db.select().from(timetableEntries).limit(1000),
      db.select().from(calendarEvents).limit(1000), db.select().from(exams).limit(1000), db.select().from(notices).limit(1000),
    ]);
    let bms: unknown[] = [], hist: unknown[] = [];
    if (deviceId) {
      bms = await db.select().from(bookmarks).where(eq(bookmarks.deviceId, deviceId)).limit(1000);
      hist = await db.select().from(history).where(eq(history.deviceId, deviceId)).limit(1000);
    }
    return NextResponse.json({
      schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(),
      subjects: subs, topics: tps, resources: res, bookmarks: bms, history: hist,
      timetable: tt, calendar: cal, exams: ex, notices: nt,
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Export failed." }, { status: 500 }); }
}

type DbLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

function mapSubject(s: Record<string, unknown>) {
  return { id: String(s.id), name: String(s.name).slice(0,200), code: String(s.code||"").slice(0,40), semester: (s.semester as number) ?? null, department: String(s.department||"Engineering").slice(0,120), academicYear: String(s.academicYear||"").slice(0,20), description: String(s.description||"").slice(0,2000), icon: String(s.icon||"book").slice(0,40) };
}
function mapTopic(t: Record<string, unknown>) {
  return { id: String(t.id), subjectId: String(t.subjectId), name: String(t.name).slice(0,200), description: String(t.description||"").slice(0,1000) };
}
function mapResource(r: Record<string, unknown>) {
  return {
    id: String(r.id), title: String(r.title).slice(0,300), description: String(r.description||"").slice(0,5000),
    resourceType: String(r.resourceType||"OTHER"), subjectId: (r.subjectId as string)||null, topicId: (r.topicId as string)||null, topic: String(r.topic||"").slice(0,200),
    semester: (r.semester as number) ?? null, academicYear: String(r.academicYear||"").slice(0,20), year: (r.year as number) ?? null, examType: String(r.examType||"").slice(0,40),
    tags: Array.isArray(r.tags)?r.tags.map(String).slice(0,20):[], sourceType: String(r.sourceType||"EXTERNAL_URL"),
    sourceClassification: String(r.sourceClassification||"UNKNOWN"), url: String(r.url||"").slice(0,2000),
    fileId: String(r.fileId||""), fileName: String(r.fileName||""), fileMime: String(r.fileMime||""), fileSize: Number(r.fileSize||0),
    thumbnail: "", author: String(r.author||"").slice(0,200), contributorId: String(r.contributorId||"import").slice(0,80),
    contributorName: String(r.contributorName||"").slice(0,120), status: String(r.status||"PUBLISHED"), visibility: String(r.visibility||"PUBLIC"),
    isFeatured: !!r.isFeatured, isBroken: !!r.isBroken, viewCount: Number(r.viewCount||0), downloadCount: Number(r.downloadCount||0),
  };
}

export async function POST(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required for import." }, { status: 403 });
    const body = await req.json().catch(()=>null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    if (body.schemaVersion !== SCHEMA_VERSION) return NextResponse.json({ error: `Unsupported schema version. Expected ${SCHEMA_VERSION}.` }, { status: 400 });
    const mode = new URL(req.url).searchParams.get("mode") || "merge";
    if (mode !== "merge" && mode !== "replace") return NextResponse.json({ error: "Invalid mode. Use merge or replace." }, { status: 400 });
    const errors: string[] = [];
    const seenIds = new Set<string>();
    const checkId = (id: unknown, label: string) => {
      if (!id || typeof id !== "string" || id.length > 120) { errors.push(`Invalid id for ${label}`); return false; }
      if (seenIds.has(id)) { errors.push(`Duplicate id: ${id}`); return false; }
      seenIds.add(id); return true;
    };
    const mustArray = (v: unknown, name: string) => { if (v !== undefined && !Array.isArray(v)) errors.push(`${name} must be an array`); };
    // Validate subjects
    mustArray(body.subjects, "subjects");
    for (const s of body.subjects || []) {
      if (!checkId(s.id, "subject")) continue;
      if (!s.name || typeof s.name !== "string") errors.push(`Subject ${s.id} missing name`);
    }
    // Validate topics
    mustArray(body.topics, "topics");
    for (const t of body.topics || []) {
      if (!checkId(t.id, "topic")) continue;
      if (!t.subjectId || typeof t.subjectId !== "string") errors.push(`Topic ${t.id} missing subjectId`);
      if (!t.name || typeof t.name !== "string") errors.push(`Topic ${t.id} missing name`);
    }
    // Validate resources
    mustArray(body.resources, "resources");
    for (const r of body.resources || []) {
      if (!checkId(r.id, "resource")) continue;
      if (!r.title || typeof r.title !== "string" || r.title.length > 500) errors.push(`Resource ${r.id} has invalid title`);
      if (r.resourceType && !RESOURCE_TYPES.includes(r.resourceType)) errors.push(`Resource ${r.id} invalid type`);
      if (r.sourceType && !SOURCE_TYPES.includes(r.sourceType)) errors.push(`Resource ${r.id} invalid sourceType`);
      if (r.status && !STATUS_VALUES.includes(r.status)) errors.push(`Resource ${r.id} invalid status`);
      if (r.visibility && !VISIBILITY_VALUES.includes(r.visibility)) errors.push(`Resource ${r.id} invalid visibility`);
      if (r.url && r.url !== "" && !isValidHttpUrl(String(r.url))) errors.push(`Resource ${r.id} has unsafe URL`);
      if (r.createdAt && isNaN(+new Date(r.createdAt))) errors.push(`Resource ${r.id} invalid date`);
    }
    // Validate academic collections (light: id + required fields)
    mustArray(body.timetable, "timetable");
    for (const t of body.timetable || []) {
      if (!checkId(t.id, "timetable entry")) continue;
      if (!t.day || !t.startTime || !t.endTime || !t.subject) errors.push(`Timetable ${t.id} missing required fields`);
    }
    mustArray(body.calendar, "calendar");
    for (const c of body.calendar || []) {
      if (!checkId(c.id, "calendar event")) continue;
      if (!c.title || !c.date) errors.push(`Calendar ${c.id} missing required fields`);
    }
    mustArray(body.exams, "exams");
    for (const e of body.exams || []) {
      if (!checkId(e.id, "exam")) continue;
      if (!e.subject || !e.date) errors.push(`Exam ${e.id} missing required fields`);
    }
    mustArray(body.notices, "notices");
    for (const n of body.notices || []) {
      if (!checkId(n.id, "notice")) continue;
      if (!n.title || !n.date) errors.push(`Notice ${n.id} missing required fields`);
    }
    // Validate device collections (imported only when the resource exists)
    mustArray(body.bookmarks, "bookmarks");
    for (const b of body.bookmarks || []) {
      if (!checkId(b.id, "bookmark")) continue;
      if (!b.deviceId || !b.resourceId) errors.push(`Bookmark ${b.id} missing deviceId/resourceId`);
    }
    mustArray(body.history, "history");
    for (const h of body.history || []) {
      if (!checkId(h.id, "history entry")) continue;
      if (!h.deviceId || !h.resourceId) errors.push(`History ${h.id} missing deviceId/resourceId`);
    }
    if (errors.length) return NextResponse.json({ error: "Import validation failed.", errors: errors.slice(0,20) }, { status: 400 });

    const counts: Record<string, number> = { subjects: 0, topics: 0, resources: 0, timetable: 0, calendar: 0, exams: 0, notices: 0, bookmarks: 0, history: 0 };
    const skipped: Record<string, number> = {};

    const insertAll = async (dbc: DbLike, onConflict: boolean) => {
      for (const s of body.subjects || []) {
        const q = dbc.insert(subjects).values(mapSubject(s) as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: subjects.id }) : await q.returning({ id: subjects.id });
        counts.subjects += res.length;
      }
      for (const t of body.topics || []) {
        const q = dbc.insert(topics).values(mapTopic(t) as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: topics.id }) : await q.returning({ id: topics.id });
        counts.topics += res.length;
      }
      for (const r of body.resources || []) {
        const q = dbc.insert(resources).values(mapResource(r) as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: resources.id }) : await q.returning({ id: resources.id });
        counts.resources += res.length;
      }
      for (const t of body.timetable || []) {
        const row = { id: String(t.id), day: String(t.day).slice(0,20), startTime: String(t.startTime).slice(0,10), endTime: String(t.endTime).slice(0,10), subject: String(t.subject).slice(0,200), subjectId: String(t.subjectId||"").slice(0,120), faculty: String(t.faculty||"").slice(0,200), room: String(t.room||"").slice(0,60), type: String(t.type||"Lecture").slice(0,40), semester: Number(t.semester||1) };
        const q = dbc.insert(timetableEntries).values(row as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: timetableEntries.id }) : await q.returning({ id: timetableEntries.id });
        counts.timetable += res.length;
      }
      for (const c of body.calendar || []) {
        const row = { id: String(c.id), title: String(c.title).slice(0,300), date: String(c.date).slice(0,20), endDate: String(c.endDate||"").slice(0,20), type: String(c.type||"General").slice(0,40), description: String(c.description||"").slice(0,2000), isOfficial: !!c.isOfficial, sourceName: String(c.sourceName||"").slice(0,200), sourceUrl: String(c.sourceUrl||"").slice(0,2000) };
        const q = dbc.insert(calendarEvents).values(row as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: calendarEvents.id }) : await q.returning({ id: calendarEvents.id });
        counts.calendar += res.length;
      }
      for (const e of body.exams || []) {
        const row = { id: String(e.id), subject: String(e.subject).slice(0,200), subjectId: String(e.subjectId||"").slice(0,120), date: String(e.date).slice(0,20), time: String(e.time||"").slice(0,20), location: String(e.location||"").slice(0,200), examType: String(e.examType||"End Semester").slice(0,60), semester: Number(e.semester||1), isOfficial: !!e.isOfficial, sourceName: String(e.sourceName||"").slice(0,200), sourceUrl: String(e.sourceUrl||"").slice(0,2000) };
        const q = dbc.insert(exams).values(row as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: exams.id }) : await q.returning({ id: exams.id });
        counts.exams += res.length;
      }
      for (const n of body.notices || []) {
        const row = { id: String(n.id), title: String(n.title).slice(0,300), date: String(n.date).slice(0,20), category: String(n.category||"General").slice(0,60), content: String(n.content||"").slice(0,5000), source: String(n.source||"").slice(0,200), isOfficial: !!n.isOfficial, sourceUrl: String(n.sourceUrl||"").slice(0,2000) };
        const q = dbc.insert(notices).values(row as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: notices.id }) : await q.returning({ id: notices.id });
        counts.notices += res.length;
      }
      // Device data: only for resources that exist after the inserts above.
      const resRows = await dbc.select({ id: resources.id }).from(resources).limit(20000);
      const resIds = new Set(resRows.map(r=>r.id));
      for (const b of body.bookmarks || []) {
        if (!resIds.has(String(b.resourceId))) { skipped.bookmarksDangling = (skipped.bookmarksDangling||0)+1; continue; }
        const q = dbc.insert(bookmarks).values({ id: String(b.id), deviceId: String(b.deviceId).slice(0,80), resourceId: String(b.resourceId) } as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: bookmarks.id }) : await q.returning({ id: bookmarks.id });
        counts.bookmarks += res.length;
      }
      for (const h of body.history || []) {
        if (!resIds.has(String(h.resourceId))) { skipped.historyDangling = (skipped.historyDangling||0)+1; continue; }
        const q = dbc.insert(history).values({ id: String(h.id), deviceId: String(h.deviceId).slice(0,80), resourceId: String(h.resourceId) } as never);
        const res = onConflict ? await q.onConflictDoNothing().returning({ id: history.id }) : await q.returning({ id: history.id });
        counts.history += res.length;
      }
    };

    if (mode === "replace") {
      if (body.confirm !== "REPLACE_ALL_DATA") return NextResponse.json({ error: "Replace mode requires confirm: REPLACE_ALL_DATA." }, { status: 400 });
      await db.transaction(async (tx) => {
        // FK-safe wipe order; bookmarks/history/reports cascade off resources.
        await tx.delete(bookmarks); await tx.delete(history);
        await tx.delete(resources); await tx.delete(topics); await tx.delete(subjects);
        await tx.delete(timetableEntries); await tx.delete(calendarEvents); await tx.delete(exams); await tx.delete(notices);
        await insertAll(tx, false);
      });
    } else {
      await insertAll(db, true);
    }
    return NextResponse.json({ ok: true, mode, imported: counts, skipped });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Import failed." }, { status: 500 }); }
}
