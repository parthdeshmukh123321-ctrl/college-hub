"use client";
import { Suspense } from "react";
import { ResourceBrowser } from "@/components/browser";
import { Breadcrumbs } from "@/components/ui";
export default function NotesPage() {
  return <Suspense fallback={<p className="muted text-sm">Loading…</p>}>
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Notes"}]} />
    <p className="muted -mt-2 mb-3 text-sm">Clean, readable study notes organized by subject and topic.</p>
    <ResourceBrowser title="Notes" baseType="NOTE" hideTypeFilter showSearchInput />
  </Suspense>;
}
