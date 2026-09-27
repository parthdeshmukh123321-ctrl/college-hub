"use client";
import { Suspense } from "react";
import { ResourceBrowser } from "@/components/browser";
import { Breadcrumbs } from "@/components/ui";
export default function SearchPage() {
  return <Suspense fallback={<p className="muted text-sm">Loading…</p>}>
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Search"}]} />
    <ResourceBrowser title="Search" showSearchInput />
  </Suspense>;
}
