// Best-effort per-instance rate limiter for anonymous write endpoints.
// (On serverless, each instance keeps its own buckets; limits are generous so
// normal use — including automated tests — never trips them.)
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimitOk(req: Request, key: string, limit: number, windowMs: number): boolean {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || now >= b.reset) {
    buckets.set(k, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [kk, vv] of buckets) if (vv.reset < now) buckets.delete(kk);
    }
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
