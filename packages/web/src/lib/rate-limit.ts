const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;

interface RateEntry {
  count: number;
  resetAt: number;
}

const globalRL = globalThis as unknown as { __driftmd_rl?: Map<string, RateEntry> };
if (!globalRL.__driftmd_rl) {
  globalRL.__driftmd_rl = new Map<string, RateEntry>();
}
const limiter = globalRL.__driftmd_rl;

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = limiter.get(ip);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    limiter.set(ip, entry);
  }

  entry.count++;
  const allowed = entry.count <= MAX_REQUESTS;

  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    resetAt: entry.resetAt,
  };
}
