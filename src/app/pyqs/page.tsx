"use client";
import { Suspense } from "react";
import { ResourceBrowser } from "@/components/browser";
import { Breadcrumbs } from "@/components/ui";
export default function PyqPage() {
  return <Suspense fallback={<p className="muted text-sm">Loading…</p>}>
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"PYQs"}]} />
    <p className="muted -mt-2 mb-3 text-sm">Previous year question papers by subject, year and exam type. Only papers that exist are listed.</p>
    <ResourceBrowser title="Previous Year Questions" baseType="PYQ" hideTypeFilter showSearchInput />
  </Suspense>;
}
