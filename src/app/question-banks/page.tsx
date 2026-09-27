"use client";
import { Suspense } from "react";
import { ResourceBrowser } from "@/components/browser";
import { Breadcrumbs } from "@/components/ui";
export default function QBPage() {
  return <Suspense fallback={<p className="muted text-sm">Loading…</p>}>
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Question Banks"}]} />
    <ResourceBrowser title="Question Banks" baseType="QUESTION_BANK" hideTypeFilter showSearchInput />
  </Suspense>;
}
