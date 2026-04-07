import pc from 'picocolors';
import type { DriftReport, Finding } from '@driftmd/core';
import { VERSION } from '../version.js';

export function printConsoleReport(report: DriftReport, verifyMode = false): void {
  const mode = verifyMode ? 'verified' : 'quick';

  console.log();
  console.log(
    `  ${pc.bold('driftmd')} ${pc.dim(`v${VERSION}`)} ${pc.dim(`(${mode})`)} scanning ${pc.cyan(report.readme || 'README.md')}`,
  );
  console.log();

  if (report.findings.length === 0) {
    console.log(`  ${pc.green('\u2713')} No drift detected. Your README is in sync.`);
    if (!verifyMode) {
      console.log();
      console.log(`  ${pc.dim('Tip: run with --verify for deep checks (file refs, CLI flags, env vars)')}`);
    }
    console.log();
    return;
  }

  console.log(`  ${pc.bold(report.readme || 'README.md')}`);
  console.log(`  ${pc.dim('\u2501'.repeat(65))}`);
  console.log();

  const grouped = groupByReadme(report.findings);

  for (const [, findings] of grouped) {
    for (const finding of findings) {
      const icon = finding.severity === 'error'
        ? pc.red('\u2717')
        : finding.severity === 'warning'
          ? pc.yellow('\u26A0')
          : pc.blue('\u2139');

      const lineStr = finding.line > 0
        ? pc.dim(`line ${String(finding.line).padStart(3)}`)
        : pc.dim('         ');

      console.log(`  ${icon} ${lineStr}   ${finding.message}`);

      if (finding.suggestion) {
        console.log(`  ${' '.repeat(14)}${pc.dim('\u2192')} ${pc.dim(finding.suggestion)}`);
      }
      if (finding.source) {
        console.log(`  ${' '.repeat(14)}${pc.dim('\u2192')} ${pc.dim(`source: ${finding.source}`)}`);
      }

      console.log();
    }
  }

  console.log(`  ${pc.dim('\u2501'.repeat(65))}`);

  const parts: string[] = [];
  if (report.summary.errors > 0) {
    parts.push(pc.red(`${report.summary.errors} error${report.summary.errors > 1 ? 's' : ''}`));
  }
  if (report.summary.warnings > 0) {
    parts.push(pc.yellow(`${report.summary.warnings} warning${report.summary.warnings > 1 ? 's' : ''}`));
  }
  if (report.summary.info > 0) {
    parts.push(pc.blue(`${report.summary.info} info`));
  }

  console.log(
    `  ${pc.bold(String(report.summary.total))} finding${report.summary.total > 1 ? 's' : ''} (${parts.join(', ')})`,
  );

  const extra = report as unknown as Record<string, unknown>;
  if (verifyMode && typeof extra['verified'] === 'number') {
    console.log(
      `  ${pc.dim(`${extra['verified']} verified, ${extra['filtered']} filtered as examples`)}`,
    );
  }

  if (!verifyMode) {
    console.log();
    console.log(`  ${pc.dim('Tip: run with --verify for deep checks (file refs, CLI flags, env vars)')}`);
  }

  console.log();
}

function groupByReadme(
  findings: Finding[],
): Map<string, Finding[]> {
  const map = new Map<string, Finding[]>();
  for (const f of findings) {
    const key = f.readme || 'README.md';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }
  return map;
}
