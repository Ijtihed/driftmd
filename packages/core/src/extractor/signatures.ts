/**
 * Extracts function/method signatures from source code.
 * Supports: TypeScript/JavaScript, Python
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';

export interface ExtractedSignature {
  name: string;
  qualifiedName: string;
  params: ParamInfo[];
  file: string;
  line: number;
}

export interface ParamInfo {
  name: string;
  hasDefault: boolean;
  defaultValue?: string;
  optional: boolean;
}

// TypeScript/JavaScript function patterns
const TS_FUNCTION_RE =
  /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
const TS_METHOD_RE =
  /(\w+)\s*\(([^)]*)\)\s*(?::\s*\w+)?\s*\{/g;
const TS_ARROW_RE =
  /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])*=>/g;

// Python function patterns
const PY_FUNCTION_RE =
  /(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/g;

export async function extractSignatures(
  repoPath: string,
  ignore: string[],
): Promise<ExtractedSignature[]> {
  const signatures: ExtractedSignature[] = [];

  const files = await fg(
    ['**/*.{ts,js,tsx,jsx,py}'],
    {
      cwd: repoPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/test/**', '**/tests/**', ...ignore],
      absolute: false,
    },
  );

  for (const file of files) {
    const fullPath = path.join(repoPath, file);
    let content: string;
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const ext = path.extname(file);
    if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
      signatures.push(...extractTSSignatures(content, file));
    } else if (ext === '.py') {
      signatures.push(...extractPySignatures(content, file));
    }
  }

  return signatures;
}

function extractTSSignatures(content: string, file: string): ExtractedSignature[] {
  const sigs: ExtractedSignature[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    TS_FUNCTION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TS_FUNCTION_RE.exec(line)) !== null) {
      const params = parseParamList(match[2], 'ts');
      sigs.push({
        name: match[1],
        qualifiedName: match[1],
        params,
        file,
        line: i + 1,
      });
    }
  }

  return sigs;
}

function extractPySignatures(content: string, file: string): ExtractedSignature[] {
  const sigs: ExtractedSignature[] = [];
  const lines = content.split('\n');

  // Track current class for qualified names
  let currentClass: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const classMatch = line.match(/^class\s+(\w+)/);
    if (classMatch) {
      currentClass = classMatch[1];
      continue;
    }

    // Reset class context on unindented non-class line
    if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t') && !classMatch) {
      currentClass = null;
    }

    PY_FUNCTION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PY_FUNCTION_RE.exec(line)) !== null) {
      const name = match[1];
      const params = parseParamList(match[2], 'py');
      // Filter out `self` and `cls`
      const filteredParams = params.filter((p) => p.name !== 'self' && p.name !== 'cls');

      sigs.push({
        name,
        qualifiedName: currentClass ? `${currentClass}.${name}` : name,
        params: filteredParams,
        file,
        line: i + 1,
      });
    }
  }

  return sigs;
}

function parseParamList(raw: string, lang: 'ts' | 'py'): ParamInfo[] {
  if (!raw.trim()) return [];

  const params: ParamInfo[] = [];
  // Simple split — handles most cases but not nested generics or default values with commas
  let depth = 0;
  let current = '';
  const parts: string[] = [];

  for (const char of raw) {
    if (char === '(' || char === '<' || char === '[' || char === '{') depth++;
    else if (char === ')' || char === '>' || char === ']' || char === '}') depth--;

    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());

  for (const part of parts) {
    if (!part) continue;

    if (lang === 'ts') {
      const tsMatch = part.match(/^(\w+)\s*(\?)?(?:\s*:\s*[^=]+)?(?:\s*=\s*(.+))?$/);
      if (tsMatch) {
        params.push({
          name: tsMatch[1],
          optional: !!tsMatch[2],
          hasDefault: !!tsMatch[3],
          defaultValue: tsMatch[3]?.trim(),
        });
      }
    } else {
      // Python
      const pyMatch = part.match(
        /^(\*{0,2}\w+)(?:\s*:\s*[^=]+)?(?:\s*=\s*(.+))?$/,
      );
      if (pyMatch) {
        params.push({
          name: pyMatch[1],
          optional: !!pyMatch[2] || pyMatch[1].startsWith('*'),
          hasDefault: !!pyMatch[2],
          defaultValue: pyMatch[2]?.trim(),
        });
      }
    }
  }

  return params;
}
