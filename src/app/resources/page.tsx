"use client";
import { Suspense } from "react";
import { ResourceBrowser } from "@/components/browser";
import { Breadcrumbs } from "@/components/ui";

export default function ResourcesPage() {
  return (
    <Suspense fallback={<p className="muted text-sm">Loading…</p>}>
      <Breadcrumbs items={[{label:"Home",href:"/"},{label:"All Resources"}]} />
      <ResourceBrowser title="All Resources" showSearchInput />
    </Suspense>
  );
}
