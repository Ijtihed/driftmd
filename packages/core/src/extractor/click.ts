/**
 * Extracts CLI flag definitions from Python click decorators.
 */

export interface ExtractedFlag {
  flag: string;
  file: string;
  line: number;
}

// @click.option('--verbose', '-v', ...)
// @click.argument('name')
const CLICK_OPTION_RE =
  /click\.option\(\s*['"](-{1,2}[\w-]+)['"](?:\s*,\s*['"](-{1,2}[\w-]+)['"])*/g;

export function extractClickFlags(
  content: string,
  file: string,
): ExtractedFlag[] {
  const flags: ExtractedFlag[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    CLICK_OPTION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = CLICK_OPTION_RE.exec(lines[i])) !== null) {
      if (match[1]) flags.push({ flag: match[1], file, line: i + 1 });
      if (match[2]) flags.push({ flag: match[2], file, line: i + 1 });
    }
  }

  return flags;
}
