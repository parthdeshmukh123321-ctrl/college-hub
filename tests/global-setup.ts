import { Client } from "pg";

// Fresh deterministic DB for every E2E run: wipe everything, then let the
// app's own seeder repopulate on first API hit.
export default async function setup() {
  const url = process.env.DATABASE_URL || "postgres://app:app@localhost:5432/app_db";
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("TRUNCATE subjects, topics, resources, bookmarks, history, reports, files, timetable_entries, calendar_events, exams, notices, analytics_events, app_meta CASCADE;");
  await client.end();
  const res = await fetch("http://localhost:3200/api/subjects");
  if (!res.ok) throw new Error(`seed trigger failed: ${res.status}`);
  const j = await res.json();
  if (!j.items || j.items.length < 5) throw new Error("seed did not populate subjects");
}
