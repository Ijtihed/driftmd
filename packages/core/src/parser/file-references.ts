import { visit } from 'unist-util-visit';
import type { Root, Code, InlineCode, Text } from 'mdast';
import type { ExtractedFileReference } from '../types.js';

const SLASH_PATH_RE =
  /(?:^|[\s`"'(])(\.{0,2}\/[\w@./-]+)\b/g;

const IGNORED_PREFIXES = ['http://', 'https://', 'ftp://', 'mailto:', '#'];

const REAL_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'pyi', 'rs', 'go', 'java', 'rb', 'c', 'h', 'cpp', 'hpp', 'cs',
  'json', 'yaml', 'yml', 'toml', 'xml', 'csv', 'env',
  'md', 'mdx', 'txt', 'rst', 'html', 'htm', 'css', 'scss', 'less',
  'sh', 'bash', 'zsh', 'fish', 'bat', 'ps1',
  'sql', 'graphql', 'gql', 'prisma', 'proto',
  'dockerfile', 'dockerignore', 'gitignore', 'editorconfig',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp',
  'wasm', 'lock', 'cfg', 'ini', 'conf', 'config',
]);

function hasRealExtension(s: string): boolean {
  const dotIdx = s.lastIndexOf('.');
  if (dotIdx === -1) return false;
  const ext = s.slice(dotIdx + 1).toLowerCase();
  return REAL_EXTENSIONS.has(ext);
}

function looksLikeFilePath(s: string): boolean {
  if (IGNORED_PREFIXES.some((p) => s.startsWith(p))) return false;

  if (/^(jsr|npm|node|bun|deno):/.test(s)) return false;

  if (s.startsWith('@') && !s.startsWith('@/')) return false;

  if (/^[\w-]+\/[\w-]+@/.test(s)) return false;

  if (/\/\//.test(s)) return false;

  if (/^\d+\.\d+/.test(s)) return false;

  if (/^[A-Z][\w]*\/[A-Z][\w]*$/.test(s)) return false;

  if (s.startsWith('./') || s.startsWith('../')) return true;

  if (hasRealExtension(s)) return true;

  if (s.endsWith('/')) return true;

  if (s.includes('/') && !hasRealExtension(s)) {
    return false;
  }

  return false;
}

function looksLikeFilePathInInlineCode(s: string): boolean {
  if (/[()=+*!?<>;,|&{}[\]]/.test(s)) return false;
  if (s.startsWith('.') && !s.startsWith('./') && !s.startsWith('../')) return false;
  if (/\s/.test(s)) return false;

  return looksLikeFilePath(s);
}

export function extractFileReferences(
  tree: Root,
  rawContent: string,
): ExtractedFileReference[] {
  const refs: ExtractedFileReference[] = [];
  const seen = new Set<string>();

  function addRef(
    path: string,
    line: number,
    column: number,
    context: ExtractedFileReference['context'],
  ) {
    const key = `${path}:${line}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ path, line, column, context });
  }

  visit(tree, 'inlineCode', (node: InlineCode) => {
    const line = node.position?.start.line ?? 0;
    const col = node.position?.start.column ?? 0;
    if (looksLikeFilePathInInlineCode(node.value)) {
      addRef(node.value, line, col, 'inline-code');
    }
  });

  visit(tree, 'text', (node: Text) => {
    const line = node.position?.start.line ?? 0;
    let match: RegExpExecArray | null;
    SLASH_PATH_RE.lastIndex = 0;
    while ((match = SLASH_PATH_RE.exec(node.value)) !== null) {
      const path = match[1];
      if (looksLikeFilePath(path)) {
        addRef(path, line, match.index + 1, 'prose');
      }
    }
  });

  return refs;
}
