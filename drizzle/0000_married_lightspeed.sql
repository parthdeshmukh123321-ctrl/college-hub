CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"event_type" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"end_date" text DEFAULT '',
	"type" text DEFAULT 'General',
	"description" text DEFAULT '',
	"is_official" boolean DEFAULT false,
	"source_name" text DEFAULT '',
	"source_url" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"subject_id" text DEFAULT '',
	"date" text NOT NULL,
	"time" text DEFAULT '',
	"location" text DEFAULT '',
	"exam_type" text DEFAULT 'End Semester',
	"semester" integer DEFAULT 1,
	"is_official" boolean DEFAULT false,
	"source_name" text DEFAULT '',
	"source_url" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"storage_path" text NOT NULL,
	"hash" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"category" text DEFAULT 'General',
	"content" text DEFAULT '',
	"source" text DEFAULT '',
	"is_official" boolean DEFAULT false,
	"source_url" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"reason" text NOT NULL,
	"description" text DEFAULT '',
	"reporter_id" text DEFAULT 'local',
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"resource_type" text DEFAULT 'NOTE' NOT NULL,
	"subject_id" text,
	"topic_id" text,
	"topic" text DEFAULT '',
	"semester" integer,
	"academic_year" text DEFAULT '',
	"year" integer,
	"exam_type" text DEFAULT '',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"source_type" text DEFAULT 'EXTERNAL_URL' NOT NULL,
	"source_classification" text DEFAULT 'STUDENT' NOT NULL,
	"url" text DEFAULT '',
	"file_id" text DEFAULT '',
	"file_name" text DEFAULT '',
	"file_mime" text DEFAULT '',
	"file_size" integer DEFAULT 0,
	"thumbnail" text DEFAULT '',
	"author" text DEFAULT '',
	"contributor_id" text DEFAULT 'local',
	"contributor_name" text DEFAULT '',
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"visibility" text DEFAULT 'PUBLIC' NOT NULL,
	"is_featured" boolean DEFAULT false,
	"is_broken" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"semester" integer,
	"department" text DEFAULT 'Engineering',
	"academic_year" text,
	"description" text DEFAULT '',
	"icon" text DEFAULT 'book',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"day" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"subject" text NOT NULL,
	"subject_id" text DEFAULT '',
	"faculty" text DEFAULT '',
	"room" text DEFAULT '',
	"type" text DEFAULT 'Lecture',
	"semester" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bm_device" ON "bookmarks" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_bm_resource" ON "bookmarks" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "idx_hist_device" ON "history" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_res_subject" ON "resources" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_res_type" ON "resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_res_status" ON "resources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_res_year" ON "resources" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_res_created" ON "resources" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_subjects_sem" ON "subjects" USING btree ("semester");--> statement-breakpoint
CREATE INDEX "idx_subjects_code" ON "subjects" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_topics_subject" ON "topics" USING btree ("subject_id");