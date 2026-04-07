import { visit } from 'unist-util-visit';
import type { Root, Code } from 'mdast';
import type { ExtractedDirTree, DirTreeEntry } from '../types.js';

const TREE_CHARS = /[├└│─┬┤┼╔╗╚╝║═╠╣╬┌┐└┘│─]/;
const TREE_LINE_RE = /^(\s*(?:[│├└]\s*)*(?:[├└]──\s*|│\s+)*)(.+)$/;

export function isDirTreeBlock(code: string): boolean {
  const lines = code.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;
  const treeLinePattern = /^[\s│]*[├└]──\s/;
  const treeLineCount = lines.filter((l) => treeLinePattern.test(l)).length;
  return treeLineCount >= 2;
}

export function parseDirTree(code: string): DirTreeEntry[] {
  const entries: DirTreeEntry[] = [];
  const lines = code.split('\n');
  const pathStack: string[] = [];
  let hasRootLabel = false;

  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length > 0 && !/[├└]/.test(nonEmptyLines[0])) {
    hasRootLabel = true;
  }

  for (const line of lines) {
    if (!line.trim()) continue;

    const hasTreeChars = /[├└]/.test(line);
    let depth = hasTreeChars ? getDepth(line) : 0;
    if (hasTreeChars && hasRootLabel) depth += 1;
    const name = extractName(line);
    if (!name) continue;

    const isDirectory = name.endsWith('/');

    const cleanName = name.replace(/\/$/, '').replace(/\s*#.*$/, '').trim();
    if (!cleanName) continue;

    while (pathStack.length > depth) {
      pathStack.pop();
    }

    const fullPath =
      pathStack.length > 0
        ? pathStack.join('/') + '/' + cleanName
        : cleanName;

    if (isDirectory) {
      pathStack.push(cleanName);
    }

    entries.push({
      path: fullPath,
      isDirectory,
      depth,
    });
  }

  return entries;
}

function getDepth(line: string): number {
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '│' || (line[i] === ' ' && i % 4 === 0)) {
      // Each tree indent is ~4 chars
    }
    if (line[i] === '├' || line[i] === '└') {
      depth = Math.floor(i / 4);
      break;
    }
  }
  return depth;
}

function extractName(line: string): string | null {
  // Remove tree drawing characters and extract the file/dir name
  const cleaned = line
    .replace(/[│├└─┬┤┼╔╗╚╝║═╠╣╬┌┐┘│]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;

  // Remove trailing comments like "# some comment"
  const parts = cleaned.split(/\s{2,}|\s+#\s+/);
  return parts[0]?.trim() || null;
}

export function extractDirTrees(tree: Root): ExtractedDirTree[] {
  const dirTrees: ExtractedDirTree[] = [];

  visit(tree, 'code', (node: Code) => {
    if (isDirTreeBlock(node.value)) {
      dirTrees.push({
        line: node.position?.start.line ?? 0,
        raw: node.value,
        entries: parseDirTree(node.value),
      });
    }
  });

  return dirTrees;
}
