import { db } from "@/db";
import { subjects, topics, resources, bookmarks, history, reports, timetableEntries, calendarEvents, exams, notices, analyticsEvents, appMeta, files } from "@/db/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { tokenize, scoreResource, sortResources } from "./search";
import { normalizeTags, type ResourceFilters } from "./types";

export function adminKeyOk(req: Request): boolean {
  const expected = process.env.ADMIN_KEY || "admin123";
  return req.headers.get("x-admin-key") === expected;
}

export async function ensureSeeded() {
  try {
    const existing = await db.select({ k: appMeta.key }).from(appMeta).where(eq(appMeta.key, "seeded_v1"));
    if (existing.length > 0) return;
    const { SEED_SUBJECTS, SEED_TOPICS, SEED_RESOURCES, SEED_TIMETABLE, SEED_CALENDAR, SEED_EXAMS, SEED_NOTICES } = await import("./seed");
    const subCount = await db.select({ id: subjects.id }).from(subjects).limit(1);
    if (subCount.length === 0) {
      for (const s of SEED_SUBJECTS) await db.insert(subjects).values({ ...s, semester: s.semester }).onConflictDoNothing();
      for (const t of SEED_TOPICS) await db.insert(topics).values(t).onConflictDoNothing();
      for (const r of SEED_RESOURCES) {
        await db.insert(resources).values({
          ...r, tags: r.tags, fileId: "", fileName: "", fileMime: "", fileSize: 0,
          thumbnail: "", author: r.author, contributorId: "seed", viewCount: Math.floor(Math.random()*40),
          downloadCount: 0, isFeatured: (r as {isFeatured?:boolean}).isFeatured ?? false,
        } as never).onConflictDoNothing();
      }
      for (const t of SEED_TIMETABLE) await db.insert(timetableEntries).values(t).onConflictDoNothing();
      for (const c of SEED_CALENDAR) await db.insert(calendarEvents).values(c as never).onConflictDoNothing();
      for (const e of SEED_EXAMS) await db.insert(exams).values(e as never).onConflictDoNothing();
      for (const n of SEED_NOTICES) await db.insert(notices).values(n as never).onConflictDoNothing();
    }
    await db.insert(appMeta).values({ key: "seeded_v1", value: new Date().toISOString() }).onConflictDoNothing();
    await db.insert(appMeta).values({ key: "schema_version", value: "1" }).onConflictDoNothing();
  } catch (e) { console.error("seed error", e); }
}

export async function listSubjectsWithCounts() {
  const subs = await db.select().from(subjects).orderBy(asc(subjects.semester), asc(subjects.name));
  const counts = await db.select({ subjectId: resources.subjectId, count: sql<number>`count(*)` }).from(resources)
    .where(eq(resources.status, "PUBLISHED")).groupBy(resources.subjectId);
  const map = new Map(counts.map(c=>[c.subjectId, Number(c.count)]));
  return subs.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(), resourceCount: map.get(s.id) ?? 0 }));
}

export interface ListResult { items: Record<string, unknown>[]; total: number; }

export async function queryResources(f: ResourceFilters & { page?: number; pageSize?: number; includeNonPublished?: boolean }): Promise<ListResult> {
  const page = Math.max(1, Number(f.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(f.pageSize) || 24));
  const conds: ReturnType<typeof eq>[] = [];
  if (!f.includeNonPublished) conds.push(eq(resources.status, "PUBLISHED"));
  else if (f.status) conds.push(eq(resources.status, f.status));
  if (f.subjectId) conds.push(eq(resources.subjectId, f.subjectId));
  if (f.type) conds.push(eq(resources.resourceType, f.type));
  if (f.semester) conds.push(eq(resources.semester, Number(f.semester)));
  if (f.year) conds.push(eq(resources.year, Number(f.year)));
  if (f.academicYear) conds.push(eq(resources.academicYear, f.academicYear));
  if (f.examType) conds.push(eq(resources.examType, f.examType));
  if (f.source) {
    if (f.source === "FILE") conds.push(eq(resources.sourceType, "FILE"));
    else if (f.source === "LINK") conds.push(eq(resources.sourceType, "EXTERNAL_URL"));
  }
  if (f.featured === "1") conds.push(eq(resources.isFeatured, true));
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db.select().from(resources).where(where).orderBy(desc(resources.createdAt)).limit(5000);
  const subs = await db.select().from(subjects);
  const subMap = new Map(subs.map(s=>[s.id, s]));
  let items = rows.map(r => {
    const s = r.subjectId ? subMap.get(r.subjectId) : undefined;
    return { ...r, tags: (r.tags as string[]) || [], createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
      lastAccessedAt: r.lastAccessedAt ? r.lastAccessedAt.toISOString() : null,
      subjectName: s?.name || "", subjectCode: s?.code || "" };
  });
  // topic + tag filters (post-query for jsonb simplicity)
  if (f.topic) { const t = f.topic.toLowerCase(); items = items.filter(r => String(r.topic||"").toLowerCase().includes(t) || String(r.topicId||"")===f.topic); }
  if (f.tag) { const tg = f.tag.toLowerCase(); items = items.filter(r => ((r.tags as string[])||[]).some(x=>String(x).toLowerCase()===tg || String(x).toLowerCase().includes(tg))); }
  // search scoring
  const tokens = tokenize(f.q || "");
  let scored = items.map(r => ({ ...r, _score: tokens.length ? scoreResource(r as never, tokens) : 0 }));
  if (tokens.length) scored = scored.filter(r => (r._score as number) > 0);
  const sort = f.sort || (tokens.length ? "relevance" : "newest");
  scored = sortResources(scored as never, sort) as never;
  const total = scored.length;
  const paged = scored.slice((page-1)*pageSize, page*pageSize);
  return { items: paged, total };
}

export async function getResourceDetail(id: string) {
  const rows = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  if (!rows.length) return null;
  const r = rows[0];
  const s = r.subjectId ? (await db.select().from(subjects).where(eq(subjects.id, r.subjectId)).limit(1))[0] : undefined;
  return { ...r, tags: (r.tags as string[])||[], createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
    lastAccessedAt: r.lastAccessedAt ? r.lastAccessedAt.toISOString() : null, subjectName: s?.name||"", subjectCode: s?.code||"" };
}

export async function relatedResources(id: string, limit = 6) {
  const cur = await getResourceDetail(id);
  if (!cur) return [];
  const rows = await db.select().from(resources).where(and(eq(resources.status,"PUBLISHED"), sql`${resources.id} != ${id}`)).limit(500);
  const subs = await db.select().from(subjects);
  const subMap = new Map(subs.map(s=>[s.id,s]));
  const scored = rows.map(r => {
    let s = 0;
    if (r.subjectId && r.subjectId === cur.subjectId) s += 50;
    if (r.resourceType === cur.resourceType) s += 20;
    if (r.topic && cur.topic && r.topic === cur.topic) s += 25;
    const a = new Set((r.tags as string[])||[]); const b = new Set(cur.tags||[]);
    for (const t of a) if (b.has(t)) s += 10;
    if (r.semester && r.semester === cur.semester) s += 5;
    return { r, s };
  }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,limit);
  return scored.map(({r}) => { const s = r.subjectId?subMap.get(r.subjectId):undefined;
    return { ...r, tags:(r.tags as string[])||[], createdAt:r.createdAt.toISOString(), updatedAt:r.updatedAt.toISOString(), lastAccessedAt: r.lastAccessedAt?r.lastAccessedAt.toISOString():null, subjectName:s?.name||"", subjectCode:s?.code||"" }; });
}

export async function findDuplicates(title: string, subjectId: string|null, year: number|null, url: string, excludeId?: string) {
  const normTitle = title.trim().toLowerCase();
  const rows = await db.select().from(resources).limit(2000);
  return rows.filter(r => {
    if (excludeId && r.id === excludeId) return false;
    if (url && r.url && r.url.trim().toLowerCase() === url.trim().toLowerCase()) return true;
    if (normTitle && r.title.trim().toLowerCase() === normTitle && (subjectId||"") === (r.subjectId||"") && (year??"") === (r.year??"")) return true;
    return false;
  }).slice(0,5).map(r=>({ id:r.id, title:r.title }));
}

export { db, subjects, topics, resources, bookmarks, history, reports, timetableEntries, calendarEvents, exams, notices, analyticsEvents, appMeta, files, eq, and, desc, asc, sql, inArray, normalizeTags };
