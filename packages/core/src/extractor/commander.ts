/**
 * Extracts CLI flag definitions from Node.js CLI frameworks:
 * commander, yargs, citty, meow, etc.
 */

export interface ExtractedFlag {
  flag: string;
  file: string;
  line: number;
}

// .option('--verbose', ...) or .option('-v, --verbose <val>', ...)
const COMMANDER_OPTION_RE =
  /\.option\(\s*['"]((?:-{1,2}[\w-]+[\s,]*)+(?:<[^>]+>|\[[^\]]+\])?)\s*['"]/g;

// .command('--flag') patterns  
const YARGS_OPTION_RE =
  /\.(?:option|positional)\(\s*['"]([a-zA-Z][\w-]*)['"]/g;

// Both patterns capture flags
const ALL_FLAG_RE = /--([a-zA-Z][\w-]+)|-([a-zA-Z])\b/g;

export function extractCommanderFlags(
  content: string,
  file: string,
): ExtractedFlag[] {
  const flags: ExtractedFlag[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Commander-style .option()
    COMMANDER_OPTION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = COMMANDER_OPTION_RE.exec(line)) !== null) {
      const optionStr = match[1];
      ALL_FLAG_RE.lastIndex = 0;
      let flagMatch: RegExpExecArray | null;
      while ((flagMatch = ALL_FLAG_RE.exec(optionStr)) !== null) {
        const flag = flagMatch[1]
          ? `--${flagMatch[1]}`
          : `-${flagMatch[2]}`;
        flags.push({ flag, file, line: i + 1 });
      }
    }

    // Yargs-style .option('name')
    YARGS_OPTION_RE.lastIndex = 0;
    while ((match = YARGS_OPTION_RE.exec(line)) !== null) {
      flags.push({ flag: `--${match[1]}`, file, line: i + 1 });
    }
  }

  return flags;
}
