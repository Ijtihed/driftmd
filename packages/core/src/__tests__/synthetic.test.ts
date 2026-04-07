import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { analyzeDrift } from '../index.js';
import type { Finding } from '../types.js';

const SYNTHETIC = path.resolve(import.meta.dirname, '../../../../test/fixtures/synthetic');

function findingsOfType(findings: Finding[], type: string) {
  return findings.filter((f) => f.type === type);
}

function hasMessage(findings: Finding[], substring: string) {
  return findings.some((f) => f.message.includes(substring));
}

describe('synthetic fixture — file references', () => {
  let findings: Finding[];

  it('setup', async () => {
    const report = await analyzeDrift(SYNTHETIC, {
      checks: { fileReferences: true, dirTree: false, internalLinks: false, cliFlags: false, envVars: false, badges: false },
    });
    findings = findingsOfType(report.findings, 'file-reference');
  });

  it('catches src/config.yaml (does not exist)', () => {
    expect(hasMessage(findings, 'src/config.yaml')).toBe(true);
  });

  it('catches src/database.ts (does not exist)', () => {
    expect(hasMessage(findings, 'src/database.ts')).toBe(true);
  });

  it('catches templates/email.html (does not exist)', () => {
    expect(hasMessage(findings, 'templates/email.html')).toBe(true);
  });

  it('does NOT false-positive on src/index.ts (exists)', () => {
    expect(hasMessage(findings, 'src/index.ts')).toBe(false);
  });

  it('does NOT false-positive on src/cli.ts (exists)', () => {
    expect(hasMessage(findings, 'src/cli.ts')).toBe(false);
  });

  it('does NOT false-positive on config/default.yaml (exists)', () => {
    expect(hasMessage(findings, 'config/default.yaml')).toBe(false);
  });

  it('does NOT false-positive on docs/guide.md (exists)', () => {
    expect(hasMessage(findings, 'docs/guide.md')).toBe(false);
  });

  it('does NOT false-positive on src/utils.ts (exists)', () => {
    expect(hasMessage(findings, 'src/utils.ts')).toBe(false);
  });

  it('has exactly 3 file-reference errors', () => {
    expect(findings.length).toBe(3);
  });
});

describe('synthetic fixture — internal links', () => {
  let findings: Finding[];

  it('setup', async () => {
    const report = await analyzeDrift(SYNTHETIC, {
      checks: { fileReferences: false, dirTree: false, internalLinks: true, cliFlags: false, envVars: false, badges: false },
    });
    findings = findingsOfType(report.findings, 'internal-link');
  });

  it('catches ./CONTRIBUTING.md (broken)', () => {
    expect(hasMessage(findings, 'CONTRIBUTING.md')).toBe(true);
  });

  it('catches ./CHANGELOG.md (broken)', () => {
    expect(hasMessage(findings, 'CHANGELOG.md')).toBe(true);
  });

  it('catches ./examples/basic.js (broken)', () => {
    expect(hasMessage(findings, 'examples/basic.js')).toBe(true);
  });

  it('does NOT false-positive on ./docs/guide.md (exists)', () => {
    expect(hasMessage(findings, 'docs/guide.md')).toBe(false);
  });

  it('does NOT false-positive on ./docs/api.md (exists)', () => {
    expect(hasMessage(findings, 'docs/api.md')).toBe(false);
  });

  it('does NOT false-positive on ./LICENSE (exists)', () => {
    expect(hasMessage(findings, 'LICENSE')).toBe(false);
  });

  it('has exactly 3 broken links', () => {
    expect(findings.length).toBe(3);
  });
});

describe('synthetic fixture — dir tree', () => {
  let findings: Finding[];

  it('setup', async () => {
    const report = await analyzeDrift(SYNTHETIC, {
      checks: { fileReferences: false, dirTree: true, internalLinks: false, cliFlags: false, envVars: false, badges: false },
    });
    findings = findingsOfType(report.findings, 'dir-tree');
  });

  it('catches deleted-file.ts', () => {
    expect(hasMessage(findings, 'deleted-file.ts')).toBe(true);
  });

  it('catches old-module directory', () => {
    expect(hasMessage(findings, 'old-module')).toBe(true);
  });

  it('catches docs/changelog.md', () => {
    expect(hasMessage(findings, 'docs/changelog.md')).toBe(true);
  });

  it('catches config/production.yaml', () => {
    expect(hasMessage(findings, 'config/production.yaml')).toBe(true);
  });

  it('catches templates dir', () => {
    expect(hasMessage(findings, 'templates')).toBe(true);
  });

  it('catches lib dir (does not exist)', () => {
    expect(hasMessage(findings, '`lib`')).toBe(true);
  });

  it('catches lib/helpers.ts', () => {
    expect(hasMessage(findings, 'lib/helpers.ts')).toBe(true);
  });

  it('does NOT flag root label synthetic-app', () => {
    const fp = findings.filter((f) => f.message.includes('synthetic-app'));
    expect(fp.length).toBe(0);
  });

  it('does NOT false-positive on src/index.ts (exists)', () => {
    const fp = findings.filter(
      (f) => f.message.includes('src/index.ts') || f.message.includes('src/cli.ts'),
    );
    expect(fp.length).toBe(0);
  });
});

describe('synthetic fixture — CLI flags', () => {
  let findings: Finding[];

  it('setup', async () => {
    const report = await analyzeDrift(SYNTHETIC, {
      checks: { fileReferences: false, dirTree: false, internalLinks: false, cliFlags: true, envVars: false, badges: false },
    });
    findings = findingsOfType(report.findings, 'cli-flag');
  });

  it('catches --silent (does not exist in any source)', () => {
    const f = findings.find((f) => f.message.includes('--silent') && f.severity === 'error');
    expect(f).toBeDefined();
  });

  it('catches --daemon (does not exist in any source)', () => {
    const f = findings.find((f) => f.message.includes('--daemon') && f.severity === 'error');
    expect(f).toBeDefined();
  });

  it('does NOT false-positive on --output (exists in src/cli.ts)', () => {
    const fp = findings.find((f) => f.message.includes('--output') && f.severity === 'error');
    expect(fp).toBeUndefined();
  });

  it('does NOT false-positive on --dry-run (exists in src/cli.ts)', () => {
    const fp = findings.find((f) => f.message.includes('--dry-run') && f.severity === 'error');
    expect(fp).toBeUndefined();
  });

  it('does NOT false-positive on --verbose (exists in src/parser.py)', () => {
    const fp = findings.find((f) => f.message.includes('--verbose') && f.severity === 'error');
    expect(fp).toBeUndefined();
  });

  it('does NOT false-positive on --host (exists in src/server.py)', () => {
    const fp = findings.find((f) => f.message.includes('--host') && f.severity === 'error');
    expect(fp).toBeUndefined();
  });

  it('does NOT false-positive on --reload (exists in src/server.py)', () => {
    const fp = findings.find((f) => f.message.includes('--reload') && f.severity === 'error');
    expect(fp).toBeUndefined();
  });

  it('reports undocumented --log-level from src/cli.ts', () => {
    const f = findings.find((f) => f.message.includes('--log-level') && f.severity === 'info');
    expect(f).toBeDefined();
  });

  it('reports undocumented --workers from src/server.py', () => {
    const f = findings.find((f) => f.message.includes('--workers') && f.severity === 'info');
    expect(f).toBeDefined();
  });

  it('reports undocumented --threads from src/main.rs', () => {
    const f = findings.find((f) => f.message.includes('--threads') && f.severity === 'info');
    expect(f).toBeDefined();
  });

  it('has exactly 2 error-level flag findings', () => {
    const errors = findings.filter((f) => f.severity === 'error');
    expect(errors.length).toBe(2);
  });
});

describe('synthetic fixture — env vars', () => {
  let findings: Finding[];

  it('setup', async () => {
    const report = await analyzeDrift(SYNTHETIC, {
      checks: { fileReferences: false, dirTree: false, internalLinks: false, cliFlags: false, envVars: true, badges: false },
    });
    findings = findingsOfType(report.findings, 'env-var');
  });

  it('catches REDIS_HOST (documented, never read)', () => {
    const f = findings.find((f) => f.message.includes('REDIS_HOST') && f.severity === 'warning');
    expect(f).toBeDefined();
  });

  it('catches LOG_LEVEL (documented, never read)', () => {
    const f = findings.find((f) => f.message.includes('LOG_LEVEL') && f.severity === 'warning');
    expect(f).toBeDefined();
  });

  it('catches SENTRY_DSN (documented, never read)', () => {
    const f = findings.find((f) => f.message.includes('SENTRY_DSN') && f.severity === 'warning');
    expect(f).toBeDefined();
  });

  it('does NOT false-positive on DATABASE_URL (documented AND read)', () => {
    const fp = findings.find((f) => f.message.includes('DATABASE_URL') && f.severity === 'warning');
    expect(fp).toBeUndefined();
  });

  it('does NOT false-positive on API_KEY (documented AND read)', () => {
    const fp = findings.find((f) => f.message.includes('API_KEY') && f.severity === 'warning');
    expect(fp).toBeUndefined();
  });

  it('does NOT false-positive on REDIS_URL (documented AND read)', () => {
    const fp = findings.find((f) => f.message.includes('REDIS_URL') && f.severity === 'warning');
    expect(fp).toBeUndefined();
  });

  it('reports undocumented SECRET_TOKEN from src/index.ts', () => {
    const f = findings.find((f) => f.message.includes('SECRET_TOKEN') && f.severity === 'info');
    expect(f).toBeDefined();
  });

  it('reports undocumented APP_SECRET from src/app.rb', () => {
    const f = findings.find((f) => f.message.includes('APP_SECRET') && f.severity === 'info');
    expect(f).toBeDefined();
  });

  it('reports undocumented JWT_SECRET from src/service.java', () => {
    const f = findings.find((f) => f.message.includes('JWT_SECRET') && f.severity === 'info');
    expect(f).toBeDefined();
  });

  it('reports undocumented PORT from src/handler.go', () => {
    const f = findings.find((f) => f.message.includes('PORT') && f.message.includes('handler.go'));
    expect(f).toBeDefined();
  });

  it('reports undocumented CACHE_HOST from src/index.ts', () => {
    const f = findings.find((f) => f.message.includes('CACHE_HOST') && f.severity === 'info');
    expect(f).toBeDefined();
  });

  it('has exactly 3 warning-level findings', () => {
    expect(findings.filter((f) => f.severity === 'warning').length).toBe(3);
  });

  it('has exactly 5 info-level findings', () => {
    expect(findings.filter((f) => f.severity === 'info').length).toBe(5);
  });
});

describe('synthetic fixture — badge versions', () => {
  it('catches version mismatch (badge says 2.0.0, package.json says 3.2.1)', async () => {
    const report = await analyzeDrift(SYNTHETIC, {
      checks: { fileReferences: false, dirTree: false, internalLinks: false, cliFlags: false, envVars: false, badges: true },
    });
    const badge = findingsOfType(report.findings, 'badge');
    expect(badge.length).toBeGreaterThanOrEqual(1);
    expect(badge[0].message).toContain('2.0.0');
    expect(badge[0].message).toContain('3.2.1');
    expect(badge[0].severity).toBe('warning');
  });
});

describe('synthetic fixture — signature checker', () => {
  let findings: Finding[];

  it('setup', async () => {
    const report = await analyzeDrift(SYNTHETIC, {
      checks: { fileReferences: false, dirTree: false, internalLinks: false, cliFlags: false, envVars: false, badges: false, signatures: true },
    });
    findings = findingsOfType(report.findings, 'signature');
  });

  it('catches compression=True (does not exist in connect())', () => {
    const f = findings.find((f) => f.message.includes('compression'));
    expect(f).toBeDefined();
    expect(f!.severity).toBe('error');
  });

  it('catches timeout=60 wrong default (actual default is 30)', () => {
    const f = findings.find((f) => f.message.includes('timeout'));
    expect(f).toBeDefined();
  });

  it('catches y=20 wrong default (actual default is 10)', () => {
    const f = findings.find((f) => f.message.includes('y') && f.message.includes('20'));
    expect(f).toBeDefined();
  });

  it('does NOT false-positive on retries=5 (param exists, value 5 vs default 3 — that is intentional usage)', () => {
    const f = findings.find((f) => f.message.includes('retries') && f.severity === 'error');
    expect(f).toBeUndefined();
  });
});

describe('synthetic fixture — full run (all checks)', () => {
  it('produces correct summary counts', async () => {
    const report = await analyzeDrift(SYNTHETIC);
    expect(report.hasErrors).toBe(true);
    expect(report.hasWarnings).toBe(true);
    expect(report.summary.errors).toBeGreaterThanOrEqual(15);
    expect(report.summary.warnings).toBeGreaterThanOrEqual(3);
    expect(report.summary.info).toBeGreaterThanOrEqual(10);
    expect(report.duration).toBeGreaterThan(0);
    expect(report.checkedAt).toBeTruthy();
  });

  it('has zero false positives on existing files/links/flags/vars', async () => {
    const report = await analyzeDrift(SYNTHETIC);
    const falsePositives = report.findings.filter((f) => {
      if (f.type === 'file-reference' && f.severity === 'error') {
        return (
          f.message.includes('src/index.ts') ||
          f.message.includes('src/cli.ts') ||
          f.message.includes('src/utils.ts') ||
          f.message.includes('config/default.yaml') ||
          f.message.includes('docs/guide.md')
        );
      }
      if (f.type === 'internal-link' && f.severity === 'error') {
        return (
          f.message.includes('docs/guide.md') ||
          f.message.includes('docs/api.md') ||
          f.message.includes('LICENSE')
        );
      }
      if (f.type === 'env-var' && f.severity === 'warning') {
        return (
          f.message.includes('DATABASE_URL') ||
          f.message.includes('API_KEY') ||
          f.message.includes('REDIS_URL')
        );
      }
      if (f.type === 'cli-flag' && f.severity === 'error') {
        return (
          f.message.includes('--output') ||
          f.message.includes('--dry-run') ||
          f.message.includes('--verbose') ||
          f.message.includes('--host') ||
          f.message.includes('--reload') ||
          f.message.includes('--format') ||
          f.message.includes('--quiet') ||
          f.message.includes('--port') ||
          f.message.includes('--input')
        );
      }
      return false;
    });
    expect(falsePositives).toEqual([]);
  });
});
