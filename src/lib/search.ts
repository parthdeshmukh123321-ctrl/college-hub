import { normalizeText } from "./types";

export function tokenize(q: string): string[] {
  return normalizeText(q).split(" ").filter(t => t.length > 0).slice(0,12);
}

// Deterministic relevance score. Higher = better.
export function scoreResource(
  r: { title: string; description: string; tags: string[]; topic: string; author: string; year: number|null; examType: string; resourceType: string; subjectName?: string; subjectCode?: string; academicYear: string },
  tokens: string[]
): number {
  if (tokens.length === 0) return 0;
  const title = normalizeText(r.title);
  const desc = normalizeText(r.description||"");
  const subj = normalizeText(`${r.subjectName||""} ${r.subjectCode||""}`);
  const subjNospace = subj.replace(/\s+/g,"");
  const tags = (r.tags||[]).map(t=>normalizeText(t)).join(" ");
  const topic = normalizeText(r.topic||"");
  const author = normalizeText(r.author||"");
  const type = normalizeText((r.resourceType||"").replace(/_/g," "));
  const yearS = r.year ? String(r.year) : "";
  const exam = normalizeText(r.examType||"");
  let score = 0;
  for (const tok of tokens) {
    const tns = tok.replace(/\s+/g,"");
    if (!tok) continue;
    if (title === tok) score += 50;
    else if (title.startsWith(tok)) score += 30;
    else if (title.includes(tok)) score += 18;
    if (subj === tok || subjNospace === tns) score += 40;
    else if (subj.includes(tok) || (tns.length>=2 && subjNospace.includes(tns))) score += 22;
    if (tags.split(" ").includes(tok) || tags.includes(tok)) score += 14;
    if (topic && topic.includes(tok)) score += 12;
    if (type.includes(tok)) score += 8;
    if (yearS && yearS === tok) score += 25;
    else if (yearS && yearS.includes(tok) && tok.length>=3) score += 8;
    if (exam && exam.includes(tok)) score += 8;
    if (author && author.includes(tok)) score += 6;
    if (desc.includes(tok)) score += 4;
    // alias: maths/math -> mathematics
    if ((tok==="maths"||tok==="math") && (title.includes("mathematic")||subj.includes("mathematic"))) score += 20;
    if (tok==="m1" && (subjNospace.includes("m1")||subj.includes("mathematics"))) score += 15;
    if (tok==="fpl" && (subj.includes("fpl")||title.includes("fpl")||subj.includes("programming"))) score += 15;
  }
  return score;
}

export function sortResources<T extends { createdAt: string; updatedAt: string; viewCount: number }>(
  items: (T & { _score?: number })[], sort: string
): (T & { _score?: number })[] {
  const arr = [...items];
  if (sort === "newest") arr.sort((a,b)=> +new Date(b.createdAt)-+new Date(a.createdAt) || 0);
  else if (sort === "oldest") arr.sort((a,b)=> +new Date(a.createdAt)-+new Date(b.createdAt));
  else if (sort === "updated") arr.sort((a,b)=> +new Date(b.updatedAt)-+new Date(a.updatedAt));
  else if (sort === "viewed") arr.sort((a,b)=> (b.viewCount||0)-(a.viewCount||0) || +new Date(b.createdAt)-+new Date(a.createdAt));
  else arr.sort((a,b)=> (b._score||0)-(a._score||0) || +new Date(b.createdAt)-+new Date(a.createdAt));
  return arr;
}
