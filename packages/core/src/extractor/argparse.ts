/**
 * Extracts CLI flag definitions from Python argparse.
 * Handles both single-line and multi-line add_argument() calls.
 */

export interface ExtractedFlag {
  flag: string;
  file: string;
  line: number;
}

const CALL_RE = /\.add_argument\s*\(([\s\S]*?)\)/g;
const FLAG_RE = /['"](-{1,2}[a-zA-Z][\w-]*)['"]/g;

export function extractArgparseFlags(
  content: string,
  file: string,
): ExtractedFlag[] {
  const flags: ExtractedFlag[] = [];
  const seen = new Set<string>();

  CALL_RE.lastIndex = 0;
  let callMatch: RegExpExecArray | null;
  while ((callMatch = CALL_RE.exec(content)) !== null) {
    const argBody = callMatch[1];
    const callStart = callMatch.index;
    const lineNum = content.slice(0, callStart).split('\n').length;

    FLAG_RE.lastIndex = 0;
    let flagMatch: RegExpExecArray | null;
    while ((flagMatch = FLAG_RE.exec(argBody)) !== null) {
      const flag = flagMatch[1];
      if (!seen.has(flag)) {
        seen.add(flag);
        flags.push({ flag, file, line: lineNum });
      }
    }
  }

  return flags;
}
