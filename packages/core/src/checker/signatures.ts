import type { Finding, ExtractedCodeBlock } from '../types.js';
import { extractSignatures } from '../extractor/signatures.js';
import type { ExtractedSignature } from '../extractor/signatures.js';

// Match function/method calls like: client.send(message, retries=3) or helper(x, y)
const CALL_RE = /(\w+(?:\.\w+)*)\s*\(([^)]*)\)/g;

interface DocumentedCall {
  qualifiedName: string;
  args: string[];
  kwargs: Map<string, string>;
  line: number;
  lang: string;
}

export async function checkSignatures(
  repoPath: string,
  codeBlocks: ExtractedCodeBlock[],
  readmePath: string,
  ignore: string[] = [],
): Promise<Finding[]> {
  const findings: Finding[] = [];

  const actualSigs = await extractSignatures(repoPath, ignore);
  if (actualSigs.length === 0) return [];

  const sigMap = new Map<string, ExtractedSignature>();
  for (const sig of actualSigs) {
    sigMap.set(sig.name, sig);
    sigMap.set(sig.qualifiedName, sig);
  }

  const documentedCalls = extractDocumentedCalls(codeBlocks);

  for (const call of documentedCalls) {
    // Try to find a matching signature
    const sig = sigMap.get(call.qualifiedName)
      ?? sigMap.get(call.qualifiedName.split('.').pop() || '');

    if (!sig) continue;

    // Check kwargs that don't exist in the actual signature
    for (const [kwarg] of call.kwargs) {
      const paramExists = sig.params.some((p) => p.name === kwarg);
      if (!paramExists) {
        findings.push({
          type: 'signature',
          severity: 'error',
          line: call.line,
          message: `\`${call.qualifiedName}(${kwarg}=...)\` — parameter \`${kwarg}\` not found in actual signature`,
          source: `${sig.file}:${sig.line}`,
          readme: readmePath,
        });
      }
    }

    // Check if documented defaults differ from actual
    for (const [kwarg, value] of call.kwargs) {
      const param = sig.params.find((p) => p.name === kwarg);
      if (param?.hasDefault && param.defaultValue && param.defaultValue !== value) {
        findings.push({
          type: 'signature',
          severity: 'warning',
          line: call.line,
          message: `\`${call.qualifiedName}(${kwarg}=${value})\` — actual default is \`${param.defaultValue}\`, not \`${value}\``,
          source: `${sig.file}:${sig.line}`,
          readme: readmePath,
        });
      }
    }
  }

  return findings;
}

function extractDocumentedCalls(codeBlocks: ExtractedCodeBlock[]): DocumentedCall[] {
  const calls: DocumentedCall[] = [];

  for (const block of codeBlocks) {
    if (!block.lang) continue;
    // Only check language-specific code blocks
    if (!['python', 'py', 'typescript', 'ts', 'javascript', 'js'].includes(block.lang)) continue;

    const blockLines = block.value.split('\n');
    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i];
      CALL_RE.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = CALL_RE.exec(line)) !== null) {
        const qualifiedName = match[1];
        const argsRaw = match[2];

        // Skip common non-function patterns
        if (['if', 'for', 'while', 'return', 'import', 'from', 'class', 'print', 'console'].includes(qualifiedName)) continue;

        const { args, kwargs } = parseCallArgs(argsRaw, block.lang);

        calls.push({
          qualifiedName,
          args,
          kwargs,
          line: block.line + i + 1,
          lang: block.lang,
        });
      }
    }
  }

  return calls;
}

function parseCallArgs(
  raw: string,
  lang: string,
): { args: string[]; kwargs: Map<string, string> } {
  const args: string[] = [];
  const kwargs = new Map<string, string>();

  if (!raw.trim()) return { args, kwargs };

  const parts = splitArgs(raw);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Python kwargs: key=value
    const kwMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (kwMatch && lang !== 'javascript' && lang !== 'js' && lang !== 'typescript' && lang !== 'ts') {
      kwargs.set(kwMatch[1], kwMatch[2].trim());
    } else {
      // For TS/JS, check for object-style { key: value }
      args.push(trimmed);
    }
  }

  return { args, kwargs };
}

function splitArgs(raw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of raw) {
    if ('([{'.includes(char)) depth++;
    else if (')]}'.includes(char)) depth--;

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}
