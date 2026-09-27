import type { Metadata } from "next";
import DetailClient from "./client";
import { getResourceDetail } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const r = await getResourceDetail(id);
    if (!r || r.status !== "PUBLISHED") return { title: "Resource not found" };
    const t = r.title || "Resource";
    const d = (r.description || "Academic resource on College Resource Hub.").slice(0,160);
    return { title: t, description: d, openGraph: { title: t, description: d, type: "article" }, alternates: { canonical: `/resources/${id}` } };
  } catch { return { title: "Resource" }; }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailClient id={id} />;
}
