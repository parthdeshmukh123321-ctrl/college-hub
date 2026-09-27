import { NextResponse } from "next/server";
import { db, topics, subjects, adminKeyOk } from "@/lib/repo";
import { uid } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const subjectId = u.searchParams.get("subjectId");
    const rows = subjectId
      ? await db.select().from(topics).where(eq(topics.subjectId, subjectId))
      : await db.select().from(topics).limit(500);
    return NextResponse.json({ items: rows.map(t=>({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })) });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load topics." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const body = await req.json().catch(()=>({}));
    const name = String(body.name||"").trim();
    if (!name || !body.subjectId) return NextResponse.json({ error: "Name and subject are required." }, { status: 400 });
    const sub = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, String(body.subjectId))).limit(1);
    if (!sub.length) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    const id = uid("top");
    await db.insert(topics).values({ id, subjectId: String(body.subjectId), name: name.slice(0,200), description: String(body.description||"").slice(0,1000) }).onConflictDoNothing();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't save this topic." }, { status: 500 }); }
}
