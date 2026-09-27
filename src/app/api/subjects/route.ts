import { NextResponse } from "next/server";
import { db, subjects, listSubjectsWithCounts, ensureSeeded, adminKeyOk } from "@/lib/repo";
import { uid } from "@/lib/utils";

export async function GET() {
  try { await ensureSeeded(); const items = await listSubjectsWithCounts(); return NextResponse.json({ items }); }
  catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load subjects." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const body = await req.json().catch(()=>({}));
    const name = String(body.name||"").trim();
    const code = String(body.code||"").trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });
    const id = String(body.id||"").trim() || uid("sub");
    await db.insert(subjects).values({
      id, name: name.slice(0,200), code: code.slice(0,40),
      semester: body.semester ? Number(body.semester) : null,
      department: String(body.department||"Engineering").slice(0,120),
      academicYear: String(body.academicYear||"").slice(0,20),
      description: String(body.description||"").slice(0,2000),
      icon: String(body.icon||"book").slice(0,40),
    } as never).onConflictDoNothing();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't save this subject." }, { status: 500 }); }
}
