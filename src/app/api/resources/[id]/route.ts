import { NextResponse } from "next/server";
import { db, resources, getResourceDetail, relatedResources, adminKeyOk, analyticsEvents } from "@/lib/repo";
import { validateResourcePayload } from "@/lib/validation";
import { normalizeTags } from "@/lib/types";
import { uid } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const r = await getResourceDetail(id);
    if (!r) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
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
    if (event === "VIEW") await db.update(resources).set({ viewCount: sql`${resources.viewCount} + 1`, lastAccessedAt: new Date() }).where(eq(resources.id, id));
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
    const owner = String(body.contributorId||"") && String(body.contributorId) === existing.contributorId;
    if (!isAdmin && !owner) {
      // allow owner-less local edit only if contributorId matches "local" default? require admin otherwise
      if (existing.contributorId !== "local" && existing.contributorId !== "seed") return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    const merged: Record<string, unknown> = { ...existing, ...body, id };
    if (body.tags) merged.tags = normalizeTags(Array.isArray(body.tags) ? body.tags.map(String) : String(body.tags).split(","));
    const { ok, errors } = validateResourcePayload(merged);
    if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
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
    return NextResponse.json({ ok: true });
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
