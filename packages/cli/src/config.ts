import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DriftConfig } from '@driftmd/core';

const CONFIG_FILES = [
  '.driftmdrc.json',
  '.driftmdrc',
  'driftmd.config.json',
];

export function loadConfig(cwd: string): DriftConfig {
  for (const file of CONFIG_FILES) {
    const fullPath = path.resolve(cwd, file);
    if (fs.existsSync(fullPath)) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return normalizeConfig(parsed);
      } catch (err) {
        console.warn(`Warning: Failed to parse ${file}: ${err}`);
      }
    }
  }

  // Check package.json for "driftmd" key
  const pkgPath = path.resolve(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.driftmd) {
        return normalizeConfig(pkg.driftmd);
      }
    } catch {
      // Ignore
    }
  }

  return {};
}

function normalizeConfig(raw: Record<string, unknown>): DriftConfig {
  const config: DriftConfig = {};

  if (Array.isArray(raw.readme)) {
    config.readme = raw.readme as string[];
  } else if (typeof raw.readme === 'string') {
    config.readme = [raw.readme as string];
  }

  if (raw.checks && typeof raw.checks === 'object') {
    const checks = raw.checks as Record<string, boolean>;
    config.checks = {
      fileReferences: checks['file-references'] ?? checks.fileReferences,
      dirTree: checks['dir-tree'] ?? checks.dirTree,
      internalLinks: checks['internal-links'] ?? checks.internalLinks,
      cliFlags: checks['cli-flags'] ?? checks.cliFlags,
      envVars: checks['env-vars'] ?? checks.envVars,
      badges: checks.badges,
      signatures: checks.signatures,
    };
  }

  if (Array.isArray(raw.ignore)) {
    config.ignore = raw.ignore as string[];
  }

  if (typeof raw['cli-entry'] === 'string') {
    config.cliEntry = raw['cli-entry'] as string;
  } else if (typeof raw.cliEntry === 'string') {
    config.cliEntry = raw.cliEntry as string;
  }

  if (raw.severity === 'error' || raw.severity === 'warning' || raw.severity === 'info') {
    config.severity = raw.severity;
  }

  return config;
}
