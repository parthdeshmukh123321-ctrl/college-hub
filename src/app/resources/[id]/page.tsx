import type { Metadata } from "next";
import DetailClient from "./client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const r = await fetch(`${base}/api/resources/${id}`, { cache: "no-store" });
    if (!r.ok) return { title: "Resource not found" };
    const j = await r.json();
    const t = j.resource?.title || "Resource";
    const d = (j.resource?.description || "Academic resource on College Resource Hub.").slice(0,160);
    return { title: t, description: d, openGraph: { title: t, description: d, type: "article" }, alternates: { canonical: `/resources/${id}` } };
  } catch { return { title: "Resource" }; }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailClient id={id} />;
}
