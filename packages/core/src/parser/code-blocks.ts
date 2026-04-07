import { visit } from 'unist-util-visit';
import type { Root, Code } from 'mdast';
import type { ExtractedCodeBlock } from '../types.js';

export function extractCodeBlocks(tree: Root): ExtractedCodeBlock[] {
  const blocks: ExtractedCodeBlock[] = [];

  visit(tree, 'code', (node: Code) => {
    blocks.push({
      lang: node.lang ?? null,
      value: node.value,
      line: node.position?.start.line ?? 0,
    });
  });

  return blocks;
}
