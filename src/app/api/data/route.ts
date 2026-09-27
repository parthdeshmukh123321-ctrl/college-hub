import { NextResponse } from "next/server";
import { db, subjects, topics, resources, bookmarks, history, timetableEntries, calendarEvents, exams, notices, adminKeyOk, ensureSeeded } from "@/lib/repo";
import { SCHEMA_VERSION, RESOURCE_TYPES, SOURCE_TYPES, STATUS_VALUES, VISIBILITY_VALUES } from "@/lib/types";
import { isValidHttpUrl } from "@/lib/validation";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const u = new URL(req.url);
    const deviceId = u.searchParams.get("deviceId") || "";
    const [subs, tps, res, tt, cal, ex, nt] = await Promise.all([
      db.select().from(subjects).limit(5000), db.select().from(topics).limit(5000),
      db.select().from(resources).limit(10000), db.select().from(timetableEntries).limit(1000),
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

export async function POST(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required for import." }, { status: 403 });
    const body = await req.json().catch(()=>null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    if (body.schemaVersion !== SCHEMA_VERSION) return NextResponse.json({ error: `Unsupported schema version. Expected ${SCHEMA_VERSION}.` }, { status: 400 });
    const mode = new URL(req.url).searchParams.get("mode") || "merge";
    const errors: string[] = [];
    const seenIds = new Set<string>();
    const checkId = (id: unknown, label: string) => {
      if (!id || typeof id !== "string" || id.length > 120) { errors.push(`Invalid id for ${label}`); return false; }
      if (seenIds.has(id)) { errors.push(`Duplicate id: ${id}`); return false; }
      seenIds.add(id); return true;
    };
    // Validate subjects
    if (body.subjects && !Array.isArray(body.subjects)) errors.push("subjects must be an array");
    for (const s of body.subjects || []) {
      if (!checkId(s.id, "subject")) continue;
      if (!s.name || typeof s.name !== "string") errors.push(`Subject ${s.id} missing name`);
    }
    // Validate resources
    if (body.resources && !Array.isArray(body.resources)) errors.push("resources must be an array");
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
    if (errors.length) return NextResponse.json({ error: "Import validation failed.", errors: errors.slice(0,20) }, { status: 400 });
    if (mode === "replace") {
      // Replace is destructive — require explicit confirm flag
      if (body.confirm !== "REPLACE_ALL_DATA") return NextResponse.json({ error: "Replace mode requires confirm: REPLACE_ALL_DATA." }, { status: 400 });
      // Only replace subjects/topics/resources to avoid wiping academic unintentionally? Replace all listed.
      for (const s of body.subjects || []) {
        await db.insert(subjects).values({ id: s.id, name: String(s.name).slice(0,200), code: String(s.code||"").slice(0,40), semester: s.semester ?? null, department: String(s.department||"Engineering").slice(0,120), academicYear: String(s.academicYear||"").slice(0,20), description: String(s.description||"").slice(0,2000), icon: String(s.icon||"book").slice(0,40) } as never).onConflictDoNothing();
      }
    } else {
      for (const s of body.subjects || []) {
        await db.insert(subjects).values({ id: s.id, name: String(s.name).slice(0,200), code: String(s.code||"").slice(0,40), semester: s.semester ?? null, department: String(s.department||"Engineering").slice(0,120), academicYear: String(s.academicYear||"").slice(0,20), description: String(s.description||"").slice(0,2000), icon: String(s.icon||"book").slice(0,40) } as never).onConflictDoNothing();
      }
      for (const t of body.topics || []) {
        if (!t.id || !t.subjectId || !t.name) continue;
        await db.insert(topics).values({ id: String(t.id), subjectId: String(t.subjectId), name: String(t.name).slice(0,200), description: String(t.description||"").slice(0,1000) } as never).onConflictDoNothing();
      }
      for (const r of body.resources || []) {
        await db.insert(resources).values({
          id: String(r.id), title: String(r.title).slice(0,300), description: String(r.description||"").slice(0,5000),
          resourceType: String(r.resourceType||"OTHER"), subjectId: r.subjectId||null, topicId: r.topicId||null, topic: String(r.topic||"").slice(0,200),
          semester: r.semester ?? null, academicYear: String(r.academicYear||"").slice(0,20), year: r.year ?? null, examType: String(r.examType||"").slice(0,40),
          tags: Array.isArray(r.tags)?r.tags.map(String).slice(0,20):[], sourceType: String(r.sourceType||"EXTERNAL_URL"),
          sourceClassification: String(r.sourceClassification||"UNKNOWN"), url: String(r.url||"").slice(0,2000),
          fileId: String(r.fileId||""), fileName: String(r.fileName||""), fileMime: String(r.fileMime||""), fileSize: Number(r.fileSize||0),
          thumbnail: "", author: String(r.author||"").slice(0,200), contributorId: String(r.contributorId||"import").slice(0,80),
          contributorName: String(r.contributorName||"").slice(0,120), status: String(r.status||"PUBLISHED"), visibility: String(r.visibility||"PUBLIC"),
          isFeatured: !!r.isFeatured, isBroken: !!r.isBroken, viewCount: Number(r.viewCount||0), downloadCount: Number(r.downloadCount||0),
        } as never).onConflictDoNothing();
      }
    }
    return NextResponse.json({ ok: true, imported: { subjects: (body.subjects||[]).length, topics: (body.topics||[]).length, resources: (body.resources||[]).length } });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Import failed." }, { status: 500 }); }
}
