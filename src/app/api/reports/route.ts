import { NextResponse } from "next/server";
import { db, reports, resources, adminKeyOk } from "@/lib/repo";
import { uid } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";
import { REPORT_REASONS } from "@/lib/types";
import { rateLimitOk } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const rows = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(200);
    const res = await db.select().from(resources).limit(5000);
    const rm = new Map(res.map(r=>[r.id, r.title]));
    return NextResponse.json({ items: rows.map(r=>({ ...r, createdAt:r.createdAt.toISOString(), resolvedAt:r.resolvedAt?r.resolvedAt.toISOString():null, resourceTitle: rm.get(r.resourceId)||r.resourceId })) });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't load reports." }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const resourceId = String(body.resourceId||"");
    const reason = String(body.reason||"");
    if (!resourceId) return NextResponse.json({ error: "Resource is required." }, { status: 400 });
    if (!REPORT_REASONS.includes(reason as never)) return NextResponse.json({ error: "Choose a valid reason." }, { status: 400 });
    if (!rateLimitOk(req, "reports-post", 15, 60_000)) return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
    const target = await db.select({ id: resources.id }).from(resources).where(eq(resources.id, resourceId)).limit(1);
    if (!target.length) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    // rate limit: max 5 open reports per resource per reporter per hour (simple check)
    const existing = await db.select().from(reports).where(eq(reports.resourceId, resourceId)).limit(50);
    const recent = existing.filter(r=>r.reporterId===String(body.reporterId||"local") && (+new Date()-+r.createdAt)<3600_000);
    if (recent.length >= 5) return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
    const id = uid("rep");
    await db.insert(reports).values({ id, resourceId, reason, description: String(body.description||"").slice(0,2000), reporterId: String(body.reporterId||"local").slice(0,80), status: "OPEN" }).onConflictDoNothing();
    if (reason === "Broken resource") await db.update(resources).set({ isBroken: true }).where(eq(resources.id, resourceId));
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't submit this report." }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    if (!adminKeyOk(req)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const u = new URL(req.url);
    const id = u.searchParams.get("id") || "";
    const body = await req.json().catch(()=>({}));
    if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
    const status = String(body.status||"RESOLVED");
    if (!["OPEN","RESOLVED","DISMISSED"].includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    await db.update(reports).set({ status, resolvedAt: status==="OPEN"?null:new Date() } as never).where(eq(reports.id, id));
    if (body.clearBroken && body.resourceId) await db.update(resources).set({ isBroken: false }).where(eq(resources.id, String(body.resourceId)));
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "We couldn't update this report." }, { status: 500 }); }
}
