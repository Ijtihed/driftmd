import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import type { ExtractedCliFlag, Finding } from '../types.js';
import { extractCommanderFlags } from '../extractor/commander.js';
import { extractArgparseFlags } from '../extractor/argparse.js';
import { extractClickFlags } from '../extractor/click.js';
import { extractClapFlags } from '../extractor/clap.js';

interface SourceFlag {
  flag: string;
  file: string;
  line: number;
}

export async function checkCliFlags(
  repoPath: string,
  documented: ExtractedCliFlag[],
  readmePath: string,
  cliEntry?: string,
  ignore: string[] = [],
): Promise<Finding[]> {
  const actualFlags = await extractActualFlags(repoPath, cliEntry, ignore);

  if (actualFlags.length === 0) {
    if (documented.length > 0) {
      return [{
        type: 'cli-flag',
        severity: 'info',
        line: 0,
        message: `Found ${documented.length} documented CLI flag(s) but no flag definitions in source. ` +
                 `driftmd supports argparse, click, commander, and clap. ` +
                 `Disable this check with --no-cli-flags or set "cli-flags": false in .driftmdrc.json.`,
        readme: readmePath,
      }];
    }
    return [];
  }

  const findings: Finding[] = [];
  const actualSet = new Set(actualFlags.map((f) => f.flag));
  const documentedSet = new Set(documented.map((f) => f.flag));

  for (const doc of documented) {
    if (!actualSet.has(doc.flag)) {
      findings.push({
        type: 'cli-flag',
        severity: 'error',
        line: doc.line,
        column: doc.column,
        message: `Documents \`${doc.flag}\` flag — not found in CLI definition`,
        readme: readmePath,
      });
    }
  }

  for (const actual of actualFlags) {
    if (!documentedSet.has(actual.flag)) {
      const alreadyReported = findings.some(
        (f) => f.message.includes(actual.flag) && f.type === 'cli-flag',
      );
      if (!alreadyReported) {
        findings.push({
          type: 'cli-flag',
          severity: 'info',
          line: 0,
          message: `CLI flag \`${actual.flag}\` defined in \`${actual.file}:${actual.line}\` — not documented in README`,
          source: `${actual.file}:${actual.line}`,
          readme: readmePath,
        });
      }
    }
  }

  return findings;
}

async function extractActualFlags(
  repoPath: string,
  cliEntry?: string,
  ignore: string[] = [],
): Promise<SourceFlag[]> {
  const flags: SourceFlag[] = [];

  if (cliEntry) {
    const fullPath = path.resolve(repoPath, cliEntry);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      flags.push(...extractFromFile(content, cliEntry));
    }
    return flags;
  }

  // Auto-detect CLI entry points
  const candidates = await fg(
    [
      // JS/TS CLI patterns
      '**/cli.{ts,js,mjs}',
      '**/bin/*.{ts,js,mjs}',
      '**/src/cli/**/*.{ts,js,mjs}',
      '**/src/index.{ts,js,mjs}',
      // Python: scan all .py for argparse/click (the extractors handle filtering)
      '**/*.py',
      // Rust
      '**/src/main.rs',
      '**/src/bin/*.rs',
    ],
    {
      cwd: repoPath,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/test/**', '**/tests/**', '**/__pycache__/**', ...ignore],
      absolute: false,
    },
  );

  for (const file of candidates) {
    const fullPath = path.join(repoPath, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      flags.push(...extractFromFile(content, file));
    } catch {
      continue;
    }
  }

  return flags;
}

function extractFromFile(content: string, file: string): SourceFlag[] {
  const ext = path.extname(file);

  switch (ext) {
    case '.ts':
    case '.js':
    case '.mjs':
      return extractCommanderFlags(content, file);
    case '.py':
      return [
        ...extractArgparseFlags(content, file),
        ...extractClickFlags(content, file),
      ];
    case '.rs':
      return extractClapFlags(content, file);
    default:
      return [];
  }
}
