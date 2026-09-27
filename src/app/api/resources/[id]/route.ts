import { NextResponse } from "next/server";
import { db, resources, subjects, topics, getResourceDetail, relatedResources, adminKeyOk, analyticsEvents } from "@/lib/repo";
import { validateResourcePayload } from "@/lib/validation";
import { rateLimitOk } from "@/lib/rateLimit";
import { normalizeTags } from "@/lib/types";
import { uid } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const r = await getResourceDetail(id);
    if (!r) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    if (!adminKeyOk(req) && (r.status !== "PUBLISHED" || r.visibility === "PRIVATE"))
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    const related = await relatedResources(id);
    return NextResponse.json({ resource: r, related });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load this resource." }, { status: 500 }); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(()=>({}));
    const event = String(body.event || "VIEW").toUpperCase();
    if (!["VIEW","DOWNLOAD","OPEN_EXTERNAL"].includes(event)) return NextResponse.json({ ok: true });
    // Admin previews must not inflate public view counts.
    if (event === "VIEW" && !adminKeyOk(req)) await db.update(resources).set({ viewCount: sql`${resources.viewCount} + 1`, lastAccessedAt: new Date() }).where(eq(resources.id, id));
    if (event === "DOWNLOAD") await db.update(resources).set({ downloadCount: sql`${resources.downloadCount} + 1` }).where(eq(resources.id, id));
    await db.insert(analyticsEvents).values({ id: uid("ev"), resourceId: id, eventType: event }).onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ ok: true }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(()=>({}));
    const existing = await getResourceDetail(id);
    if (!existing) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    const isAdmin = adminKeyOk(req);
    if (!isAdmin) {
      // Non-admin edits require a real ownership match: seed/local/import rows are admin-only,
      // and the caller's device id must equal the stored contributor id.
      const stored = String(existing.contributorId || "");
      const caller = String(body.contributorId || "");
      const owned = stored && caller && stored !== "local" && stored !== "seed" && stored !== "import" && stored === caller;
      if (!owned) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    const merged: Record<string, unknown> = { ...existing, ...body, id };
    if (body.tags) merged.tags = normalizeTags(Array.isArray(body.tags) ? body.tags.map(String) : String(body.tags).split(","));
    const { ok, errors } = validateResourcePayload(merged);
    if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    if (!rateLimitOk(req, "resources-patch", 60, 60_000)) return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    if (merged.subjectId) {
      const s = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, String(merged.subjectId))).limit(1);
      if (!s.length) return NextResponse.json({ error: "Validation failed", errors: { subjectId: "Subject not found." } }, { status: 400 });
    }
    if (merged.topicId) {
      const t = await db.select({ id: topics.id }).from(topics).where(eq(topics.id, String(merged.topicId))).limit(1);
      if (!t.length) return NextResponse.json({ error: "Validation failed", errors: { topicId: "Topic not found." } }, { status: 400 });
    }
    const patch: Record<string, unknown> = {
      title: String(merged.title).trim(), description: String(merged.description||""),
      resourceType: String(merged.resourceType), subjectId: (merged.subjectId as string)||null,
      topicId: (merged.topicId as string)||null, topic: String(merged.topic||"").slice(0,200),
      semester: merged.semester ? Number(merged.semester) : null,
      academicYear: String(merged.academicYear||"").slice(0,20), year: merged.year?Number(merged.year):null,
      examType: String(merged.examType||"").slice(0,40), tags: merged.tags as string[],
      sourceType: String(merged.sourceType), sourceClassification: String(merged.sourceClassification||"STUDENT"),
      url: String(merged.url||""), author: String(merged.author||"").slice(0,200),
      contributorName: String(merged.contributorName||"").slice(0,120),
      visibility: String(merged.visibility||"PUBLIC"), updatedAt: new Date(),
    };
    if (isAdmin) {
      if (body.status) patch.status = String(body.status);
      if (body.isFeatured !== undefined) patch.isFeatured = !!body.isFeatured;
      if (body.isBroken !== undefined) patch.isBroken = !!body.isBroken;
      if (body.fileId !== undefined) { patch.fileId = String(body.fileId||""); patch.fileName = String(body.fileName||""); patch.fileMime = String(body.fileMime||""); patch.fileSize = Number(body.fileSize||0); }
    } else {
      patch.status = "PENDING_REVIEW";
      if (body.fileId) { patch.fileId = String(body.fileId); patch.fileName = String(body.fileName||""); patch.fileMime = String(body.fileMime||""); patch.fileSize = Number(body.fileSize||0); }
    }
    await db.update(resources).set(patch as unknown as Partial<typeof resources.$inferInsert>).where(eq(resources.id, id));
    const newStatus = isAdmin ? String(patch.status ?? existing.status) : "PENDING_REVIEW";
    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't update this resource." }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const { id } = await params;
    await db.update(resources).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(resources.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't remove this resource." }, { status: 500 }); }
}
