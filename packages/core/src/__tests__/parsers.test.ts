import { describe, it, expect } from 'vitest';
import { parseReadme } from '../parser/markdown.js';
import { isDirTreeBlock, parseDirTree } from '../parser/dir-tree.js';
import { extractFileReferences } from '../parser/file-references.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root } from 'mdast';

function parseTree(md: string): Root {
  return unified().use(remarkParse).parse(md) as Root;
}

function getRefPaths(md: string): string[] {
  const tree = parseTree(md);
  return extractFileReferences(tree, md).map((r) => r.path);
}

describe('parseReadme', () => {
  it('extracts relative links', async () => {
    const md = `
# Test
[Guide](./docs/guide.md)
[External](https://example.com)
[Anchor](#section)
`;
    const parsed = await parseReadme('README.md', md);
    const relativeLinks = parsed.links.filter(
      (l) => !l.href.startsWith('http') && !l.href.startsWith('#'),
    );
    expect(relativeLinks).toHaveLength(1);
    expect(relativeLinks[0].href).toBe('./docs/guide.md');
  });

  it('extracts file references from inline code', async () => {
    const md = 'Check `src/config.yaml` for settings.';
    const parsed = await parseReadme('README.md', md);
    expect(parsed.fileReferences.length).toBeGreaterThanOrEqual(1);
    expect(parsed.fileReferences[0].path).toBe('src/config.yaml');
  });

  it('extracts env vars from inline code', async () => {
    const md = 'Set `DATABASE_URL` and `API_KEY` before running.';
    const parsed = await parseReadme('README.md', md);
    expect(parsed.envVars.length).toBe(2);
    expect(parsed.envVars.map((v) => v.name)).toContain('DATABASE_URL');
    expect(parsed.envVars.map((v) => v.name)).toContain('API_KEY');
  });

  it('extracts CLI flags from code blocks', async () => {
    const md = `
\`\`\`bash
npx my-tool --verbose --output file.json
\`\`\`
`;
    const parsed = await parseReadme('README.md', md);
    expect(parsed.cliFlags.map((f) => f.flag)).toContain('--verbose');
    expect(parsed.cliFlags.map((f) => f.flag)).toContain('--output');
  });

  it('extracts badges', async () => {
    const md = '![version](https://img.shields.io/badge/version-v2.1.0-blue)';
    const parsed = await parseReadme('README.md', md);
    expect(parsed.badgeUrls.length).toBe(1);
    expect(parsed.badgeUrls[0].version).toBe('2.1.0');
  });
});

describe('file-reference false positive prevention', () => {
  it('does not flag npm package names with slashes', () => {
    const paths = getRefPaths('4 times smaller than `uuid/v4` package');
    expect(paths).not.toContain('uuid/v4');
  });

  it('does not flag scoped npm packages', () => {
    const paths = getRefPaths('Uses `@types/node` and `@babel/core`');
    expect(paths).toHaveLength(0);
  });

  it('does not flag jsr: prefixed imports', () => {
    const paths = getRefPaths('Import from `jsr:@sitnik/nanoid`');
    expect(paths).toHaveLength(0);
  });

  it('does not flag node: built-in prefix', () => {
    const paths = getRefPaths('Import `node:path` for paths');
    expect(paths).toHaveLength(0);
  });

  it('does not flag bare module subpaths without extensions', () => {
    const paths = getRefPaths('Use `lodash/fp` or `react-dom/client`');
    expect(paths).toHaveLength(0);
  });

  it('still catches relative paths', () => {
    const paths = getRefPaths('See `./src/config.yaml` for settings');
    expect(paths).toContain('./src/config.yaml');
  });

  it('still catches paths with file extensions', () => {
    const paths = getRefPaths('Edit `src/index.ts` to get started');
    expect(paths).toContain('src/index.ts');
  });

  it('still catches directory references with trailing slash', () => {
    const paths = getRefPaths('The `src/helpers/` directory contains utils');
    expect(paths).toContain('src/helpers/');
  });
});

describe('dir-tree parser', () => {
  it('detects tree blocks', () => {
    const tree = `project/
├── src/
│   ├── index.ts
│   └── utils.ts
└── package.json`;
    expect(isDirTreeBlock(tree)).toBe(true);
  });

  it('rejects non-tree code', () => {
    const code = `const x = 1;\nconst y = 2;\nreturn x + y;`;
    expect(isDirTreeBlock(code)).toBe(false);
  });

  it('includes root label and prefixes children', () => {
    const tree = `project/
├── src/
│   ├── index.ts
│   └── utils.ts
└── package.json`;
    const entries = parseDirTree(tree);
    const paths = entries.map((e) => e.path);
    expect(paths).toContain('project');
    expect(paths).toContain('project/src');
    expect(paths).toContain('project/src/index.ts');
    expect(paths).toContain('project/src/utils.ts');
    expect(paths).toContain('project/package.json');
  });

  it('classifies entries ending with / as directories', () => {
    const tree = `app/
├── src/
│   └── index.ts
├── LICENSE
├── Makefile
└── README.md`;
    const entries = parseDirTree(tree);
    const byPath = Object.fromEntries(entries.map((e) => [e.path, e]));
    expect(byPath['app'].isDirectory).toBe(true);
    expect(byPath['app/src'].isDirectory).toBe(true);
    expect(byPath['app/src/index.ts'].isDirectory).toBe(false);
    expect(byPath['app/LICENSE'].isDirectory).toBe(false);
    expect(byPath['app/Makefile'].isDirectory).toBe(false);
    expect(byPath['app/README.md'].isDirectory).toBe(false);
  });
});
