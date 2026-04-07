import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExtractedDirTree, DirTreeEntry, Finding } from '../types.js';

export function checkDirTrees(
  repoPath: string,
  dirTrees: ExtractedDirTree[],
  readmePath: string,
  ignore: string[],
): Finding[] {
  const findings: Finding[] = [];

  for (const tree of dirTrees) {
    const entries = resolveRootLabel(repoPath, tree.entries);

    for (const entry of entries) {
      const fullPath = path.resolve(repoPath, entry.path);

      if (ignore.some((p) => entry.path.startsWith(p))) continue;

      const exists = fs.existsSync(fullPath);

      if (!exists) {
        const entityType = entry.isDirectory ? 'directory' : 'file';
        findings.push({
          type: 'dir-tree',
          severity: 'error',
          line: tree.line,
          message: `Directory tree shows \`${entry.path}\` — ${entityType} does not exist`,
          readme: readmePath,
        });
      }
    }
  }

  return findings;
}

function resolveRootLabel(
  repoPath: string,
  entries: DirTreeEntry[],
): DirTreeEntry[] {
  if (entries.length === 0) return entries;

  const first = entries[0];
  if (!first.isDirectory) return entries;

  const firstExists = fs.existsSync(path.resolve(repoPath, first.path));

  if (firstExists) {
    return entries;
  }

  const prefix = first.path + '/';
  return entries.slice(1).map((e) => ({
    ...e,
    path: e.path.startsWith(prefix)
      ? e.path.slice(prefix.length)
      : e.path,
  }));
}
