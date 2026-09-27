import { NextResponse } from "next/server";
import { db, subjects, topics, resources, adminKeyOk } from "@/lib/repo";
import { eq, and } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    const s = rows[0];
    const tps = await db.select().from(topics).where(eq(topics.subjectId, id));
    const res = await db.select().from(resources).where(and(eq(resources.subjectId, id), eq(resources.status, "PUBLISHED"))).limit(200);
    const byType: Record<string, number> = {};
    for (const r of res) byType[r.resourceType] = (byType[r.resourceType]||0)+1;
    return NextResponse.json({
      subject: { ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(), resourceCount: res.length },
      topics: tps.map(t=>({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
      byType,
      latest: res.sort((a,b)=>+b.createdAt-+a.createdAt).slice(0,8).map(r=>({ ...r, tags:(r.tags as string[])||[], createdAt:r.createdAt.toISOString(), updatedAt:r.updatedAt.toISOString(), lastAccessedAt: r.lastAccessedAt?r.lastAccessedAt.toISOString():null })),
      popular: [...res].sort((a,b)=>(b.viewCount||0)-(a.viewCount||0)).slice(0,6).map(r=>({ ...r, tags:(r.tags as string[])||[], createdAt:r.createdAt.toISOString(), updatedAt:r.updatedAt.toISOString(), lastAccessedAt: r.lastAccessedAt?r.lastAccessedAt.toISOString():null })),
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load this subject." }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const { id } = await params;
    const body = await req.json().catch(()=>({}));
    await db.update(subjects).set({
      name: String(body.name||"").slice(0,200) || undefined,
      code: String(body.code||"").slice(0,40) || undefined,
      semester: body.semester === null ? null : body.semester ? Number(body.semester) : undefined,
      department: body.department ? String(body.department).slice(0,120) : undefined,
      academicYear: body.academicYear !== undefined ? String(body.academicYear).slice(0,20) : undefined,
      description: body.description !== undefined ? String(body.description).slice(0,2000) : undefined,
      updatedAt: new Date(),
    } as never).where(eq(subjects.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't update this subject." }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const { id } = await params;
    await db.delete(subjects).where(eq(subjects.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't delete this subject." }, { status: 500 }); }
}
