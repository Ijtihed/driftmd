import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { analyzeDrift } from '../index.js';
import { extractSignatures } from '../extractor/signatures.js';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../test/fixtures');

describe('signature extractor', () => {
  it('extracts Python class methods', async () => {
    const sigs = await extractSignatures(
      path.join(FIXTURES, 'signature-drift'),
      [],
    );

    const querySig = sigs.find((s) => s.name === 'query');
    expect(querySig).toBeDefined();
    expect(querySig!.qualifiedName).toBe('Client.query');
    expect(querySig!.params.map((p) => p.name)).toContain('sql');
    expect(querySig!.params.map((p) => p.name)).toContain('timeout');
  });
});

describe('signature checker', () => {
  it('detects missing parameters', async () => {
    const report = await analyzeDrift(
      path.join(FIXTURES, 'signature-drift'),
      {
        checks: {
          fileReferences: false,
          dirTree: false,
          internalLinks: false,
          cliFlags: false,
          envVars: false,
          badges: false,
          signatures: true,
        },
      },
    );

    const sigFindings = report.findings.filter((f) => f.type === 'signature');

    // retries=5 is documented in README but doesn't exist in Client.query
    const retriesFinding = sigFindings.find((f) =>
      f.message.includes('retries'),
    );
    expect(retriesFinding).toBeDefined();
    expect(retriesFinding!.severity).toBe('error');
  });

  it('detects wrong default values', async () => {
    const report = await analyzeDrift(
      path.join(FIXTURES, 'signature-drift'),
      {
        checks: {
          fileReferences: false,
          dirTree: false,
          internalLinks: false,
          cliFlags: false,
          envVars: false,
          badges: false,
          signatures: true,
        },
      },
    );

    const sigFindings = report.findings.filter((f) => f.type === 'signature');

    // timeout=30 in README but actual default is 60
    const timeoutFinding = sigFindings.find((f) =>
      f.message.includes('timeout'),
    );
    expect(timeoutFinding).toBeDefined();
  });
});
