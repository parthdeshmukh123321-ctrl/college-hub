export const SCHEMA_VERSION = 1;
export const APP_VERSION = "1.0.0";

export const RESOURCE_TYPES = ["NOTE","PYQ","QUESTION_BANK","LAB_MANUAL","ASSIGNMENT","SYLLABUS","REFERENCE","VIDEO","WEBSITE","COURSE","TEXTBOOK","PRESENTATION","PRACTICAL","VIVA","OTHER"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<string,string> = {
  NOTE: "Notes", PYQ: "PYQ", QUESTION_BANK: "Question Bank", LAB_MANUAL: "Lab Manual",
  ASSIGNMENT: "Assignment", SYLLABUS: "Syllabus", REFERENCE: "Reference",
  VIDEO: "Video", WEBSITE: "Website", COURSE: "Course", TEXTBOOK: "Textbook",
  PRESENTATION: "Presentation", PRACTICAL: "Practical", VIVA: "Viva", OTHER: "Other",
};

export const SOURCE_TYPES = ["FILE","EXTERNAL_URL","INTERNAL_PAGE"] as const;
export const STATUS_VALUES = ["DRAFT","PENDING_REVIEW","PUBLISHED","ARCHIVED","REJECTED"] as const;
export const VISIBILITY_VALUES = ["PRIVATE","COLLEGE","PUBLIC"] as const;
export const CLASSIFICATIONS = ["OFFICIAL","STUDENT","FACULTY","COMMUNITY","EXTERNAL","UNKNOWN"] as const;
export const EXAM_TYPES = ["Unit Test","Mid Semester","End Semester","University","Practical","Other"] as const;
export const REPORT_REASONS = ["Broken resource","Wrong information","Duplicate","Wrong subject","Copyright concern","Inappropriate","Other"] as const;

export interface Subject { id: string; name: string; code: string; semester: number|null; department: string|null; academicYear: string|null; description: string|null; icon: string|null; createdAt: string; updatedAt: string; resourceCount?: number; }
export interface Topic { id: string; subjectId: string; name: string; description: string|null; createdAt: string; updatedAt: string; }
export interface Resource {
  id: string; title: string; description: string; resourceType: string; subjectId: string|null;
  topicId: string|null; topic: string; semester: number|null; academicYear: string; year: number|null;
  examType: string; tags: string[]; sourceType: string; sourceClassification: string; url: string;
  fileId: string; fileName: string; fileMime: string; fileSize: number; thumbnail: string;
  author: string; contributorId: string; contributorName: string; status: string; visibility: string;
  isFeatured: boolean; isBroken: boolean; viewCount: number; downloadCount: number;
  createdAt: string; updatedAt: string; lastAccessedAt: string|null;
  subjectName?: string; subjectCode?: string;
}
export interface TimetableEntry { id: string; day: string; startTime: string; endTime: string; subject: string; subjectId: string; faculty: string; room: string; type: string; semester: number; }
export interface CalendarEvent { id: string; title: string; date: string; endDate: string; type: string; description: string; isOfficial: boolean; sourceName: string; sourceUrl: string; }
export interface ExamEntry { id: string; subject: string; subjectId: string; date: string; time: string; location: string; examType: string; semester: number; isOfficial: boolean; sourceName: string; sourceUrl: string; }
export interface Notice { id: string; title: string; date: string; category: string; content: string; source: string; isOfficial: boolean; sourceUrl: string; createdAt: string; }
export interface Report { id: string; resourceId: string; reason: string; description: string; reporterId: string; status: string; createdAt: string; resolvedAt: string|null; resourceTitle?: string; }

export type SortKey = "relevance"|"newest"|"oldest"|"updated"|"viewed";

export interface ResourceFilters {
  q?: string; subjectId?: string; type?: string; semester?: string; year?: string;
  academicYear?: string; topic?: string; tag?: string; source?: string; examType?: string;
  sort?: SortKey; status?: string; featured?: string; types?: string[];
}

export function normalizeText(s: string): string {
  return (s||"").toLowerCase().trim().replace(/[_-]+/g," ").replace(/[^\p{L}\p{N}\s+.#]/gu," ").replace(/\s+/g," ").trim();
}
export function normalizeTag(s: string): string {
  return (s||"").toLowerCase().trim().replace(/\s+/g,"-").replace(/[^a-z0-9+\-.#]/g,"").slice(0,40);
}
export function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags||[]) { const n = normalizeTag(t); if (n && !out.includes(n)) out.push(n); }
  return out.slice(0,20);
}
