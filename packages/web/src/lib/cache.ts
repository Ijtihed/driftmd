import type { DriftReport } from 'driftmd-core';

export interface CachedReport {
  id: string;
  repoUrl: string;
  report: DriftReport;
  readmeContent: string;
  createdAt: string;
}

const REPORT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ENTRIES = 200;

const globalStore = globalThis as unknown as { __driftmd_cache?: Map<string, CachedReport> };
if (!globalStore.__driftmd_cache) {
  globalStore.__driftmd_cache = new Map<string, CachedReport>();
}
const store = globalStore.__driftmd_cache;

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - new Date(entry.createdAt).getTime() > REPORT_TTL_MS) {
      store.delete(key);
    }
  }
}

export function setReport(entry: CachedReport): void {
  evictExpired();
  store.set(entry.id, entry);

  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
}

export function getReport(id: string): CachedReport | undefined {
  const entry = store.get(id);
  if (!entry) return undefined;

  if (Date.now() - new Date(entry.createdAt).getTime() > REPORT_TTL_MS) {
    store.delete(id);
    return undefined;
  }

  return entry;
}
