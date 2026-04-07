import type { DriftReport } from 'driftmd-core';
import { VERSION } from '../version.js';

interface SarifLog {
  version: string;
  $schema: string;
  runs: SarifRun[];
}

interface SarifRun {
  tool: { driver: { name: string; version: string; rules: SarifRule[] } };
  results: SarifResult[];
}

interface SarifRule {
  id: string;
  shortDescription: { text: string };
}

interface SarifResult {
  ruleId: string;
  level: string;
  message: { text: string };
  locations: {
    physicalLocation: {
      artifactLocation: { uri: string };
      region: { startLine: number };
    };
  }[];
}

const SEVERITY_MAP: Record<string, string> = {
  error: 'error',
  warning: 'warning',
  info: 'note',
};

export function formatSarif(report: DriftReport): SarifLog {
  const rules = new Map<string, SarifRule>();

  for (const f of report.findings) {
    if (!rules.has(f.type)) {
      rules.set(f.type, {
        id: `driftmd/${f.type}`,
        shortDescription: { text: `README drift: ${f.type}` },
      });
    }
  }

  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'driftmd',
            version: VERSION,
            rules: [...rules.values()],
          },
        },
        results: report.findings.map((f) => ({
          ruleId: `driftmd/${f.type}`,
          level: SEVERITY_MAP[f.severity] ?? 'note',
          message: { text: f.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.readme },
                region: { startLine: Math.max(1, f.line) },
              },
            },
          ],
        })),
      },
    ],
  };
}
