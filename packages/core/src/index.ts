import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import { parseReadme } from './parser/markdown.js';
import { checkFileReferences, checkInternalLinks } from './checker/file-exists.js';
import { checkDirTrees } from './checker/dir-tree.js';
import { checkCliFlags } from './checker/cli-flags.js';
import { checkEnvVars } from './checker/env-vars.js';
import { checkBadgeVersions } from './checker/badge-version.js';
import { checkSignatures } from './checker/signatures.js';
import { findEnvVarUsages } from './extractor/env-usage.js';
import { verifyFindings } from './verifier/llm.js';
import type {
  DriftConfig,
  DriftReport,
  Finding,
  ChecksConfig,
} from './types.js';

export type {
  DriftConfig,
  DriftReport,
  Finding,
  ChecksConfig,
  Severity,
  CheckType,
  ParsedReadme,
  VerifyConfig,
} from './types.js';

const DEFAULT_CHECKS: Required<ChecksConfig> = {
  fileReferences: true,
  dirTree: true,
  internalLinks: true,
  cliFlags: true,
  envVars: true,
  badges: true,
  signatures: false,
};

export async function analyzeDrift(
  repoPath: string,
  config: DriftConfig = {},
): Promise<DriftReport> {
  const start = performance.now();
  const checks = { ...DEFAULT_CHECKS, ...config.checks };
  const ignore = config.ignore ?? ['node_modules', 'dist', '.git'];
  const readmeGlobs = config.readme ?? ['README.md'];
  const verifyMode = config.verify?.enabled === true;

  const readmeFiles = await resolveReadmes(repoPath, readmeGlobs);

  if (readmeFiles.length === 0) {
    return emptyReport(performance.now() - start);
  }

  const reliableFindings: Finding[] = [];
  const candidates: Finding[] = [];

  for (const readmeFile of readmeFiles) {
    const fullPath = path.resolve(repoPath, readmeFile);
    let content: string;
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const parsed = await parseReadme(readmeFile, content);

    if (checks.internalLinks) {
      reliableFindings.push(
        ...(await checkInternalLinks(repoPath, parsed.links, readmeFile, ignore)),
      );
    }

    if (checks.badges) {
      reliableFindings.push(
        ...checkBadgeVersions(repoPath, parsed.badgeUrls, readmeFile),
      );
    }

    if (checks.dirTree) {
      reliableFindings.push(
        ...checkDirTrees(repoPath, parsed.dirTrees, readmeFile, ignore),
      );
    }

    const noisyTarget = verifyMode ? candidates : reliableFindings;

    if (checks.fileReferences) {
      noisyTarget.push(
        ...(await checkFileReferences(repoPath, parsed.fileReferences, readmeFile, ignore)),
      );
    }

    if (checks.cliFlags) {
      noisyTarget.push(
        ...(await checkCliFlags(repoPath, parsed.cliFlags, readmeFile, config.cliEntry, ignore)),
      );
    }

    if (checks.envVars) {
      const usages = await findEnvVarUsages(repoPath, ignore);
      noisyTarget.push(
        ...checkEnvVars(parsed.envVars, usages, readmeFile),
      );
    }

    if (checks.signatures) {
      noisyTarget.push(
        ...(await checkSignatures(repoPath, parsed.codeBlocks, readmeFile, ignore)),
      );
    }
  }

  let verifiedCount = 0;
  let filteredCount = 0;

  if (verifyMode && candidates.length > 0 && config.verify) {
    const readmeContent = fs.readFileSync(
      path.resolve(repoPath, readmeFiles[0]),
      'utf-8',
    );
    const { verified, filtered } = await verifyFindings(
      candidates,
      readmeContent,
      repoPath,
      config.verify,
    );
    reliableFindings.push(...verified);
    verifiedCount = verified.length;
    filteredCount = filtered;
  }

  const allFindings = reliableFindings;
  const duration = performance.now() - start;
  const errors = allFindings.filter((f) => f.severity === 'error').length;
  const warnings = allFindings.filter((f) => f.severity === 'warning').length;
  const info = allFindings.filter((f) => f.severity === 'info').length;

  return {
    readme: readmeFiles.join(', '),
    findings: allFindings,
    checkedAt: new Date().toISOString(),
    duration,
    hasErrors: errors > 0,
    hasWarnings: warnings > 0,
    summary: {
      total: allFindings.length,
      errors,
      warnings,
      info,
    },
    ...(verifyMode ? { verified: verifiedCount, filtered: filteredCount } : {}),
  } as DriftReport;
}

async function resolveReadmes(
  repoPath: string,
  globs: string[],
): Promise<string[]> {
  const files: string[] = [];

  for (const glob of globs) {
    if (glob.includes('*')) {
      const matches = await fg([glob], {
        cwd: repoPath,
        onlyFiles: true,
      });
      files.push(...matches);
    } else {
      const fullPath = path.resolve(repoPath, glob);
      if (fs.existsSync(fullPath)) {
        files.push(glob);
      }
    }
  }

  return [...new Set(files)];
}

function emptyReport(duration: number): DriftReport {
  return {
    readme: '',
    findings: [],
    checkedAt: new Date().toISOString(),
    duration,
    hasErrors: false,
    hasWarnings: false,
    summary: { total: 0, errors: 0, warnings: 0, info: 0 },
  };
}
