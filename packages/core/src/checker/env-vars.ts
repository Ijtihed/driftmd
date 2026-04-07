import type { ExtractedEnvVar, Finding } from '../types.js';
import type { EnvVarUsage } from '../extractor/env-usage.js';
import { WELL_KNOWN_ENV_VARS } from '../parser/env-vars.js';

export function checkEnvVars(
  documented: ExtractedEnvVar[],
  actual: EnvVarUsage[],
  readmePath: string,
): Finding[] {
  const findings: Finding[] = [];

  const documentedSet = new Set(documented.map((v) => v.name));
  const actualSet = new Set(actual.map((v) => v.name));

  for (const doc of documented) {
    if (!actualSet.has(doc.name)) {
      if (WELL_KNOWN_ENV_VARS.has(doc.name)) continue;
      findings.push({
        type: 'env-var',
        severity: 'warning',
        line: doc.line,
        column: doc.column,
        message: `Documents env var \`${doc.name}\` — never read in codebase`,
        readme: readmePath,
      });
    }
  }

  for (const usage of actual) {
    if (!documentedSet.has(usage.name)) {
      const alreadyReported = findings.some(
        (f) => f.message.includes(usage.name) && f.type === 'env-var',
      );
      if (!alreadyReported) {
        findings.push({
          type: 'env-var',
          severity: 'info',
          line: 0,
          message: `Env var \`${usage.name}\` read in \`${usage.file}:${usage.line}\` — not documented in README`,
          source: `${usage.file}:${usage.line}`,
          readme: readmePath,
        });
      }
    }
  }

  return findings;
}
