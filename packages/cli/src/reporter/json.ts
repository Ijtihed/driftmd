import type { DriftReport } from '@driftmd/core';

export function printJsonReport(report: DriftReport): void {
  console.log(JSON.stringify(report, null, 2));
}
