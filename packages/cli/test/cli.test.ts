import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

const CLI = path.resolve(import.meta.dirname, '../dist/bin/driftmd.js');
const SYNTHETIC = path.resolve(import.meta.dirname, '../../../test/fixtures/synthetic');
const CLEAN = path.resolve(import.meta.dirname, '../../../test/fixtures/clean-repo');

function run(args: string[]): { stdout: string; exitCode: number } {
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      encoding: 'utf-8',
      timeout: 20000,
    });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; status?: number };
    return {
      stdout: e.stdout ?? '',
      exitCode: e.status ?? 1,
    };
  }
}

describe('driftmd CLI', () => {
  it('--help exits 0 and shows usage', () => {
    const { stdout, exitCode } = run(['--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('driftmd');
    expect(stdout).toContain('Usage');
    expect(stdout).toContain('--json');
  });

  it('--version exits 0', () => {
    const { stdout, exitCode } = run(['--version']);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('--json against synthetic fixture outputs valid JSON with findings', () => {
    const { stdout, exitCode } = run(['--json', SYNTHETIC]);
    expect(exitCode).toBe(1);

    const report = JSON.parse(stdout);
    expect(report.findings).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.summary.errors).toBeGreaterThan(0);
    expect(report.hasErrors).toBe(true);
  });

  it('clean repo exits 0 with no errors', () => {
    const { stdout, exitCode } = run([CLEAN]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('No drift detected');
  });

  it('clean repo --json shows zero findings', () => {
    const { stdout, exitCode } = run(['--json', CLEAN]);
    expect(exitCode).toBe(0);

    const report = JSON.parse(stdout);
    expect(report.findings).toHaveLength(0);
    expect(report.hasErrors).toBe(false);
  });

  it('temp dir with trivially correct README exits 0', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'driftmd-test-'));
    try {
      fs.writeFileSync(path.join(tmp, 'README.md'), '# Hello\n\nThis is fine.\n');
      const { exitCode } = run([tmp]);
      expect(exitCode).toBe(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
