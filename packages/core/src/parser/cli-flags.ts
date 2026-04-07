import { visit } from 'unist-util-visit';
import type { Root, Code, InlineCode, Text } from 'mdast';
import type { ExtractedCliFlag } from '../types.js';

// Matches --flag-name or -f style flags
const CLI_FLAG_RE = /(?:^|\s)(--[a-zA-Z][\w-]*|-[a-zA-Z])\b/g;

const IGNORED_FLAGS = new Set([
  '--', '---', // separators
]);

export function extractCliFlags(
  tree: Root,
  rawContent: string,
): ExtractedCliFlag[] {
  const flags: ExtractedCliFlag[] = [];
  const seen = new Set<string>();

  function add(flag: string, line: number, column: number) {
    if (seen.has(flag)) return;
    if (IGNORED_FLAGS.has(flag)) return;
    seen.add(flag);
    flags.push({ flag, line, column });
  }

  visit(tree, 'inlineCode', (node: InlineCode) => {
    let match: RegExpExecArray | null;
    CLI_FLAG_RE.lastIndex = 0;
    while ((match = CLI_FLAG_RE.exec(node.value)) !== null) {
      add(
        match[1],
        node.position?.start.line ?? 0,
        (node.position?.start.column ?? 0) + match.index,
      );
    }
  });

  visit(tree, 'code', (node: Code) => {
    if (node.lang && ['bash', 'sh', 'shell', 'console', 'zsh'].includes(node.lang)) {
      const startLine = node.position?.start.line ?? 0;
      const lines = node.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let match: RegExpExecArray | null;
        CLI_FLAG_RE.lastIndex = 0;
        while ((match = CLI_FLAG_RE.exec(lines[i])) !== null) {
          add(match[1], startLine + i + 1, match.index + 1);
        }
      }
    }
  });

  // Also check prose text for documented flags
  visit(tree, 'text', (node: Text) => {
    let match: RegExpExecArray | null;
    CLI_FLAG_RE.lastIndex = 0;
    while ((match = CLI_FLAG_RE.exec(node.value)) !== null) {
      add(
        match[1],
        node.position?.start.line ?? 0,
        (node.position?.start.column ?? 0) + match.index,
      );
    }
  });

  return flags;
}
