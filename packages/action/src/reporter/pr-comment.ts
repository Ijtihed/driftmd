import type { DriftReport, Finding } from 'driftmd-core';

export function formatPRComment(report: DriftReport): string {
  if (report.findings.length === 0) {
    return '## ✅ driftmd — README is in sync\n\nNo drift detected between your README and codebase.';
  }

  const lines: string[] = [];
  const errorCount = report.summary.errors;
  const warnCount = report.summary.warnings;
  const infoCount = report.summary.info;

  lines.push(`## 🔍 driftmd found ${report.summary.total} issue${report.summary.total > 1 ? 's' : ''} in your README\n`);

  // Errors and warnings table
  const actionable = report.findings.filter((f) => f.severity !== 'info');
  if (actionable.length > 0) {
    lines.push('| Line | Check | Finding |');
    lines.push('|------|-------|---------|');

    for (const finding of actionable) {
      const line = finding.line > 0 ? String(finding.line) : '—';
      const escapedMsg = finding.message.replace(/\|/g, '\\|');
      lines.push(`| ${line} | ${finding.type} | ${escapedMsg} |`);
    }
    lines.push('');
  }

  // Info items (undocumented stuff) as a collapsible section
  const infoItems = report.findings.filter((f) => f.severity === 'info');
  if (infoItems.length > 0) {
    lines.push('<details>');
    lines.push(`<summary>ℹ️ ${infoItems.length} undocumented item${infoItems.length > 1 ? 's' : ''} found in codebase</summary>\n`);
    for (const item of infoItems) {
      lines.push(`- ${item.message}`);
    }
    lines.push('\n</details>\n');
  }

  lines.push('> Run `npx driftmd` locally to see suggestions.');

  return lines.join('\n');
}
