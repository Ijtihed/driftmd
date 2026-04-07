import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import type { ExtractedFileReference, ExtractedLink, Finding } from '../types.js';

export async function checkFileReferences(
  repoPath: string,
  refs: ExtractedFileReference[],
  readmePath: string,
  ignore: string[],
): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const ref of refs) {
    const refPath = ref.path.replace(/^\.\//, '');
    const fullPath = path.resolve(repoPath, refPath);

    if (shouldIgnore(refPath, ignore)) continue;

    if (!fs.existsSync(fullPath)) {
      const suggestion = await findSimilar(repoPath, refPath, ignore);
      findings.push({
        type: 'file-reference',
        severity: 'error',
        line: ref.line,
        column: ref.column,
        message: `References \`${ref.path}\` — file does not exist`,
        suggestion,
        readme: readmePath,
      });
    }
  }

  return findings;
}

export async function checkInternalLinks(
  repoPath: string,
  links: ExtractedLink[],
  readmePath: string,
  ignore: string[],
): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const link of links) {
    if (link.href.startsWith('http://') || link.href.startsWith('https://')) continue;
    if (link.href.startsWith('#')) continue;
    if (link.href.startsWith('mailto:')) continue;

    const hrefPath = link.href.split('#')[0].split('?')[0];
    if (!hrefPath) continue;

    const resolvedPath = hrefPath.startsWith('/')
      ? path.join(repoPath, hrefPath)
      : path.resolve(
          path.dirname(path.resolve(repoPath, readmePath)),
          hrefPath,
        );

    if (shouldIgnore(hrefPath, ignore)) continue;

    if (!fs.existsSync(resolvedPath)) {
      const suggestion = await findSimilar(repoPath, hrefPath, ignore);
      findings.push({
        type: 'internal-link',
        severity: 'error',
        line: link.line,
        column: link.column,
        message: `Link to \`${hrefPath}\` — target does not exist`,
        suggestion,
        readme: readmePath,
      });
    }
  }

  return findings;
}

function shouldIgnore(filePath: string, ignore: string[]): boolean {
  return ignore.some((pattern) => {
    if (pattern.includes('*')) {
      return fg.isDynamicPattern(pattern) && filePath.match(new RegExp(pattern.replace(/\*/g, '.*')));
    }
    return filePath.startsWith(pattern);
  });
}

async function findSimilar(
  repoPath: string,
  missingPath: string,
  ignore: string[],
): Promise<string | undefined> {
  const basename = path.basename(missingPath);
  try {
    const candidates = await fg([`**/${basename}`], {
      cwd: repoPath,
      ignore: ['**/node_modules/**', '**/.git/**', ...ignore],
      onlyFiles: true,
      deep: 5,
    });

    if (candidates.length === 1) {
      return `Did you mean \`${candidates[0]}\`?`;
    } else if (candidates.length > 1 && candidates.length <= 5) {
      return `Possible matches: ${candidates.map((c) => `\`${c}\``).join(', ')}`;
    }
  } catch {
    // Ignore glob errors
  }

  return undefined;
}
