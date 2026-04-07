import { describe, it, expect } from 'vitest';
import { formatPRComment } from '../reporter/pr-comment.js';
import { formatSarif } from '../reporter/sarif.js';
import type { DriftReport } from 'driftmd-core';

const mockReport: DriftReport = {
  readme: 'README.md',
  findings: [
    {
      type: 'file-reference',
      severity: 'error',
      line: 23,
      message: 'References `src/config.yaml` — file does not exist',
      suggestion: 'Did you mean `config/settings.yaml`?',
      readme: 'README.md',
    },
    {
      type: 'cli-flag',
      severity: 'warning',
      line: 67,
      message: 'Documents `--verbose` flag — not found in CLI definition',
      readme: 'README.md',
    },
    {
      type: 'env-var',
      severity: 'info',
      line: 0,
      message: 'Env var `SECRET_KEY` read in `src/index.ts:4` — not documented in README',
      source: 'src/index.ts:4',
      readme: 'README.md',
    },
  ],
  checkedAt: '2024-01-01T00:00:00.000Z',
  duration: 150,
  hasErrors: true,
  hasWarnings: true,
  summary: { total: 3, errors: 1, warnings: 1, info: 1 },
};

describe('PR comment reporter', () => {
  it('formats findings as markdown table', () => {
    const comment = formatPRComment(mockReport);
    expect(comment).toContain('driftmd found 3 issues');
    expect(comment).toContain('src/config.yaml');
    expect(comment).toContain('file-reference');
    expect(comment).toContain('npx driftmd');
  });

  it('shows clean message when no findings', () => {
    const clean: DriftReport = {
      ...mockReport,
      findings: [],
      hasErrors: false,
      hasWarnings: false,
      summary: { total: 0, errors: 0, warnings: 0, info: 0 },
    };
    const comment = formatPRComment(clean);
    expect(comment).toContain('README is in sync');
  });
});

describe('SARIF reporter', () => {
  it('produces valid SARIF structure', () => {
    const sarif = formatSarif(mockReport);
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].results).toHaveLength(3);
    expect(sarif.runs[0].tool.driver.name).toBe('driftmd');
  });
});
