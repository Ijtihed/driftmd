import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExtractedBadge, Finding } from '../types.js';

const MANIFEST_FILES = [
  'package.json',
  'Cargo.toml',
  'pyproject.toml',
  'setup.py',
  'setup.cfg',
];

interface ManifestVersion {
  file: string;
  version: string;
  name?: string;
}

export function checkBadgeVersions(
  repoPath: string,
  badges: ExtractedBadge[],
  readmePath: string,
): Finding[] {
  if (badges.length === 0) return [];

  const findings: Finding[] = [];
  const manifest = readManifestVersion(repoPath);

  if (!manifest) return [];

  for (const badge of badges) {
    if (!badge.version) continue;

    if (badge.version !== manifest.version) {
      findings.push({
        type: 'badge',
        severity: 'warning',
        line: badge.line,
        message: `Badge shows v${badge.version} — ${manifest.file} says ${manifest.version}`,
        readme: readmePath,
      });
    }
  }

  return findings;
}

function readManifestVersion(repoPath: string): ManifestVersion | null {
  for (const file of MANIFEST_FILES) {
    const fullPath = path.join(repoPath, file);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');

      if (file === 'package.json') {
        const pkg = JSON.parse(content);
        if (pkg.version) return { file, version: pkg.version, name: pkg.name };
      }

      if (file === 'Cargo.toml') {
        const vMatch = content.match(/^\s*version\s*=\s*"([^"]+)"/m);
        const nMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
        if (vMatch) return { file, version: vMatch[1], name: nMatch?.[1] };
      }

      if (file === 'pyproject.toml') {
        const vMatch = content.match(/^\s*version\s*=\s*"([^"]+)"/m);
        const nMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
        if (vMatch) return { file, version: vMatch[1], name: nMatch?.[1] };
      }
    } catch {
      continue;
    }
  }

  return null;
}
