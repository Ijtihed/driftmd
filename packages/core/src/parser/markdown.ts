import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import type { Root, Code, InlineCode, Link, Image, Text, Html } from 'mdast';
import type { ParsedReadme } from '../types.js';
import { extractFileReferences } from './file-references.js';
import { extractDirTrees } from './dir-tree.js';
import { extractEnvVars } from './env-vars.js';
import { extractCliFlags } from './cli-flags.js';
import type {
  ExtractedLink,
  ExtractedCodeBlock,
  ExtractedBadge,
} from '../types.js';

function lineOf(node: { position?: { start: { line: number } } }): number {
  return node.position?.start.line ?? 0;
}

function colOf(node: { position?: { start: { column: number } } }): number {
  return node.position?.start.column ?? 0;
}

export async function parseReadme(
  filePath: string,
  content: string,
): Promise<ParsedReadme> {
  const tree = unified().use(remarkParse).parse(content) as Root;

  const links: ExtractedLink[] = [];
  const codeBlocks: ExtractedCodeBlock[] = [];
  const badgeUrls: ExtractedBadge[] = [];

  visit(tree, 'link', (node: Link) => {
    links.push({
      href: node.url,
      line: lineOf(node),
      column: colOf(node),
      text:
        node.children
          .filter((c): c is Text => c.type === 'text')
          .map((c) => c.value)
          .join('') || '',
    });
  });

  visit(tree, 'code', (node: Code) => {
    codeBlocks.push({
      lang: node.lang ?? null,
      value: node.value,
      line: lineOf(node),
    });
  });

  visit(tree, 'image', (node: Image) => {
    if (isShieldsBadge((node as Image).url)) {
      badgeUrls.push(parseBadgeUrl((node as Image).url, lineOf(node)));
    }
  });

  // Also check HTML img tags for badges
  visit(tree, 'html', (node: Html) => {
    const imgSrcMatch = node.value.match(/src=["']([^"']+shields\.io[^"']+)["']/);
    if (imgSrcMatch) {
      badgeUrls.push(parseBadgeUrl(imgSrcMatch[1], lineOf(node)));
    }
  });

  const fileReferences = extractFileReferences(tree, content);
  const dirTrees = extractDirTrees(tree);
  const envVars = extractEnvVars(tree, content);
  const cliFlags = extractCliFlags(tree, content);

  return {
    filePath,
    links,
    codeBlocks,
    fileReferences,
    dirTrees,
    envVars,
    cliFlags,
    badgeUrls,
  };
}

function isShieldsBadge(url: string): boolean {
  return url.includes('shields.io') || url.includes('badgen.net');
}

function parseBadgeUrl(url: string, line: number): ExtractedBadge {
  // For shields.io badge URLs: /badge/label-vX.Y.Z-color
  // The version is between hyphens, and the last segment is the color
  const shieldsBadgeMatch = url.match(/badge\/[^/]*-v?(\d+\.\d+\.\d+(?:-[\w.]+?)?)-[a-zA-Z]+/);
  const versionMatch = shieldsBadgeMatch ?? url.match(/\/v(\d+\.\d+\.\d+)\b/);
  const npmMatch = url.match(/npm\/v\/([^/?#]+)/);
  return {
    url,
    line,
    version: (shieldsBadgeMatch ?? versionMatch)?.[1],
    packageName: npmMatch?.[1],
  };
}
