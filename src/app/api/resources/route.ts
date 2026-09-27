import { NextResponse } from "next/server";
import { db, resources, subjects, topics, files, ensureSeeded, queryResources, findDuplicates, adminKeyOk } from "@/lib/repo";
import { validateResourcePayload, isValidHttpUrl } from "@/lib/validation";
import { normalizeTags, RESOURCE_TYPES, STATUS_VALUES } from "@/lib/types";
import { rateLimitOk } from "@/lib/rateLimit";
import { uid } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const u = new URL(req.url);
    const sp = u.searchParams;
    const isAdmin = adminKeyOk(req);
    // Non-admins always see published-only; the status filter is admin-only.
    const rawStatus = sp.get("status") || "";
    const status = isAdmin && (STATUS_VALUES as readonly string[]).includes(rawStatus) ? rawStatus : "";
    const rawTypes = (sp.get("types") || "").split(",").map(s=>s.trim().toUpperCase())
      .filter(s=>(RESOURCE_TYPES as readonly string[]).includes(s));
    const data = await queryResources({
      q: sp.get("q") || "", subjectId: sp.get("subjectId") || "", type: sp.get("type") || "",
      semester: sp.get("semester") || "", year: sp.get("year") || "", academicYear: sp.get("academicYear") || "",
      topic: sp.get("topic") || "", tag: sp.get("tag") || "", source: sp.get("source") || "",
      examType: sp.get("examType") || "", sort: (sp.get("sort") as never) || undefined,
      status, types: rawTypes.length ? rawTypes : undefined, featured: sp.get("featured") || "",
      page: Number(sp.get("page")) || 1, pageSize: Number(sp.get("pageSize")) || 24,
      includeNonPublished: isAdmin, excludePrivate: !isAdmin,
    });
    return NextResponse.json({ ...data, page: Number(sp.get("page"))||1, pageSize: Number(sp.get("pageSize"))||24 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load resources. Please try again." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json().catch(()=> ({}));
    const payload: Record<string, unknown> = { ...body };
    payload.title = String(payload.title ?? "").trim();
    payload.description = String(payload.description ?? "").trim().slice(0, 5000);
    payload.tags = normalizeTags(Array.isArray(payload.tags) ? payload.tags.map(String) : String(payload.tags||"").split(","));
    if (payload.url) payload.url = String(payload.url).trim();
    const { ok, errors } = validateResourcePayload(payload);
    if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    if (!rateLimitOk(req, "resources-post", 60, 60_000)) return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    if (payload.sourceType === "FILE" && !payload.fileId) return NextResponse.json({ error: "Validation failed", errors: { file: "Upload a file first." } }, { status: 400 });
    if (payload.subjectId) {
      const s = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, String(payload.subjectId))).limit(1);
      if (!s.length) return NextResponse.json({ error: "Validation failed", errors: { subjectId: "Subject not found." } }, { status: 400 });
    }
    if (payload.topicId) {
      const t = await db.select({ id: topics.id }).from(topics).where(eq(topics.id, String(payload.topicId))).limit(1);
      if (!t.length) return NextResponse.json({ error: "Validation failed", errors: { topicId: "Topic not found." } }, { status: 400 });
    }
    if (payload.sourceType === "FILE" && payload.fileId) {
      const fl = await db.select({ id: files.id }).from(files).where(eq(files.id, String(payload.fileId))).limit(1);
      if (!fl.length) return NextResponse.json({ error: "Validation failed", errors: { file: "Upload a file first." } }, { status: 400 });
    }
    const dups = await findDuplicates(String(payload.title), (payload.subjectId as string)||null, payload.year?Number(payload.year):null, String(payload.url||""));
    const isAdmin = adminKeyOk(req);
    const id = uid("res");
    const now = new Date();
    const row = {
      id, title: String(payload.title), description: String(payload.description||""),
      resourceType: String(payload.resourceType), subjectId: (payload.subjectId as string)||null,
      topicId: (payload.topicId as string)||null, topic: String(payload.topic||"").slice(0,200),
      semester: payload.semester ? Number(payload.semester) : null,
      academicYear: String(payload.academicYear||"").slice(0,20), year: payload.year?Number(payload.year):null,
      examType: String(payload.examType||"").slice(0,40), tags: payload.tags as string[],
      sourceType: String(payload.sourceType), sourceClassification: String(payload.sourceClassification||"STUDENT"),
      url: String(payload.url||""), fileId: String(payload.fileId||""), fileName: String(payload.fileName||""),
      fileMime: String(payload.fileMime||""), fileSize: Number(payload.fileSize||0),
      thumbnail: "", author: String(payload.author||"").slice(0,200),
      contributorId: String(payload.contributorId||"local").slice(0,60),
      contributorName: String(payload.contributorName||"").slice(0,120),
      status: isAdmin ? String(payload.status||"PUBLISHED") : "PENDING_REVIEW",
      visibility: String(payload.visibility||"PUBLIC"),
      isFeatured: false, isBroken: false, viewCount: 0, downloadCount: 0,
      createdAt: now, updatedAt: now, lastAccessedAt: null,
    };
    await db.insert(resources).values(row as never);
    // verify file linkage
    return NextResponse.json({ id, warning: dups.length ? `Possible duplicate detected: ${dups.map(d=>d.title).join("; ")}` : undefined, status: row.status }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't save this resource. Please try again." }, { status: 500 }); }
}
export async function PATCH(req: Request) { return NextResponse.json({ error: "Use /api/resources/[id]" }, { status: 400 }); }
