import {
  pgTable, text, timestamp, integer, boolean, jsonb, uuid, index,
} from "drizzle-orm/pg-core";

export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  semester: integer("semester"),
  department: text("department").default("Engineering"),
  academicYear: text("academic_year"),
  description: text("description").default(""),
  icon: text("icon").default("book"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("idx_subjects_sem").on(t.semester), index("idx_subjects_code").on(t.code)]);

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("idx_topics_subject").on(t.subjectId)]);

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  resourceType: text("resource_type").notNull().default("NOTE"),
  subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
  topic: text("topic").default(""),
  semester: integer("semester"),
  academicYear: text("academic_year").default(""),
  year: integer("year"),
  examType: text("exam_type").default(""),
  tags: jsonb("tags").$type<string[]>().default([]),
  sourceType: text("source_type").notNull().default("EXTERNAL_URL"),
  sourceClassification: text("source_classification").notNull().default("STUDENT"),
  url: text("url").default(""),
  fileId: text("file_id").default(""),
  fileName: text("file_name").default(""),
  fileMime: text("file_mime").default(""),
  fileSize: integer("file_size").default(0),
  thumbnail: text("thumbnail").default(""),
  author: text("author").default(""),
  contributorId: text("contributor_id").default("local"),
  contributorName: text("contributor_name").default(""),
  status: text("status").notNull().default("PUBLISHED"),
  visibility: text("visibility").notNull().default("PUBLIC"),
  isFeatured: boolean("is_featured").default(false),
  isBroken: boolean("is_broken").default(false),
  viewCount: integer("view_count").default(0),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
}, (t) => [
  index("idx_res_subject").on(t.subjectId),
  index("idx_res_type").on(t.resourceType),
  index("idx_res_status").on(t.status),
  index("idx_res_year").on(t.year),
  index("idx_res_created").on(t.createdAt),
]);

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  fileName: text("file_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull().default(0),
  storagePath: text("storage_path").notNull(),
  hash: text("hash").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("idx_bm_device").on(t.deviceId), index("idx_bm_resource").on(t.resourceId)]);

export const history = pgTable("history", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (t) => [index("idx_hist_device").on(t.deviceId)]);

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description").default(""),
  reporterId: text("reporter_id").default("local"),
  status: text("status").notNull().default("OPEN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const timetableEntries = pgTable("timetable_entries", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  subject: text("subject").notNull(),
  subjectId: text("subject_id").default(""),
  faculty: text("faculty").default(""),
  room: text("room").default(""),
  type: text("type").default("Lecture"),
  semester: integer("semester").default(1),
});

export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  endDate: text("end_date").default(""),
  type: text("type").default("General"),
  description: text("description").default(""),
  isOfficial: boolean("is_official").default(false),
  sourceName: text("source_name").default(""),
  sourceUrl: text("source_url").default(""),
});

export const exams = pgTable("exams", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  subjectId: text("subject_id").default(""),
  date: text("date").notNull(),
  time: text("time").default(""),
  location: text("location").default(""),
  examType: text("exam_type").default("End Semester"),
  semester: integer("semester").default(1),
  isOfficial: boolean("is_official").default(false),
  sourceName: text("source_name").default(""),
  sourceUrl: text("source_url").default(""),
});

export const notices = pgTable("notices", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  category: text("category").default("General"),
  content: text("content").default(""),
  source: text("source").default(""),
  isOfficial: boolean("is_official").default(false),
  sourceUrl: text("source_url").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id").notNull(),
  eventType: text("event_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
