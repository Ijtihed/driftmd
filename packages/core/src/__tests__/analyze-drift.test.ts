import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { analyzeDrift } from '../index.js';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../test/fixtures');

describe('analyzeDrift', () => {
  it('detects file reference drift', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'basic-drift'), {
      checks: {
        fileReferences: true,
        dirTree: false,
        internalLinks: false,
        cliFlags: false,
        envVars: false,
        badges: false,
      },
    });

    const fileRefFindings = report.findings.filter(
      (f) => f.type === 'file-reference',
    );

    // src/config.yaml doesn't exist, lib/utils.py doesn't exist
    expect(fileRefFindings.length).toBeGreaterThanOrEqual(1);

    const configFinding = fileRefFindings.find((f) =>
      f.message.includes('src/config.yaml'),
    );
    expect(configFinding).toBeDefined();
    expect(configFinding!.severity).toBe('error');
  });

  it('detects broken internal links', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'basic-drift'), {
      checks: {
        fileReferences: false,
        dirTree: false,
        internalLinks: true,
        cliFlags: false,
        envVars: false,
        badges: false,
      },
    });

    const linkFindings = report.findings.filter(
      (f) => f.type === 'internal-link',
    );

    // ./examples/basic.py and ./LICENSE don't exist
    expect(linkFindings.length).toBeGreaterThanOrEqual(1);

    const exampleFinding = linkFindings.find((f) =>
      f.message.includes('examples/basic.py'),
    );
    expect(exampleFinding).toBeDefined();
  });

  it('detects directory tree drift', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'basic-drift'), {
      checks: {
        fileReferences: false,
        dirTree: true,
        internalLinks: false,
        cliFlags: false,
        envVars: false,
        badges: false,
      },
    });

    const treeFindings = report.findings.filter(
      (f) => f.type === 'dir-tree',
    );

    // Several dirs/files listed in tree don't exist (lib/, helpers/, etc.)
    expect(treeFindings.length).toBeGreaterThanOrEqual(1);
  });

  it('detects CLI flag drift', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'basic-drift'), {
      checks: {
        fileReferences: false,
        dirTree: false,
        internalLinks: false,
        cliFlags: true,
        envVars: false,
        badges: false,
      },
    });

    const flagFindings = report.findings.filter(
      (f) => f.type === 'cli-flag',
    );

    // --verbose is documented in README but not defined in src/cli.ts
    const verboseFinding = flagFindings.find((f) =>
      f.message.includes('--verbose'),
    );
    expect(verboseFinding).toBeDefined();
  });

  it('detects env var drift', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'basic-drift'), {
      checks: {
        fileReferences: false,
        dirTree: false,
        internalLinks: false,
        cliFlags: false,
        envVars: true,
        badges: false,
      },
    });

    const envFindings = report.findings.filter(
      (f) => f.type === 'env-var',
    );

    // REDIS_HOST is documented but never read
    const redisFinding = envFindings.find((f) =>
      f.message.includes('REDIS_HOST'),
    );
    expect(redisFinding).toBeDefined();

    // SECRET_KEY is read but not documented
    const secretFinding = envFindings.find((f) =>
      f.message.includes('SECRET_KEY'),
    );
    expect(secretFinding).toBeDefined();
  });

  it('detects badge version drift', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'basic-drift'), {
      checks: {
        fileReferences: false,
        dirTree: false,
        internalLinks: false,
        cliFlags: false,
        envVars: false,
        badges: true,
      },
    });

    const badgeFindings = report.findings.filter(
      (f) => f.type === 'badge',
    );

    // Badge says v1.0.0, package.json says 2.0.0
    expect(badgeFindings.length).toBeGreaterThanOrEqual(1);
    expect(badgeFindings[0].message).toContain('1.0.0');
    expect(badgeFindings[0].message).toContain('2.0.0');
  });

  it('reports clean repo with no findings', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'clean-repo'), {
      checks: {
        fileReferences: true,
        dirTree: true,
        internalLinks: true,
        cliFlags: false,
        envVars: false,
        badges: false,
      },
    });

    expect(report.findings.length).toBe(0);
    expect(report.hasErrors).toBe(false);
  });

  it('includes timing and summary', async () => {
    const report = await analyzeDrift(path.join(FIXTURES, 'clean-repo'));

    expect(report.duration).toBeGreaterThan(0);
    expect(report.checkedAt).toBeTruthy();
    expect(report.summary).toBeDefined();
    expect(typeof report.summary.total).toBe('number');
  });
});
