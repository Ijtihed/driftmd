/**
 * Extracts CLI flag definitions from Rust clap.
 */

export interface ExtractedFlag {
  flag: string;
  file: string;
  line: number;
}

// Arg::new("verbose").long("verbose") or .short('v')
const CLAP_LONG_RE = /\.long\(\s*"([\w-]+)"\s*\)/g;
const CLAP_SHORT_RE = /\.short\(\s*'(\w)'\s*\)/g;

// Derive macro: #[arg(long = "verbose")] or #[arg(long)]
const DERIVE_LONG_RE = /#\[arg\([^)]*long\s*(?:=\s*"([\w-]+)")?\s*[,)]/g;
const DERIVE_SHORT_RE = /#\[arg\([^)]*short\s*(?:=\s*'(\w)')?\s*[,)]/g;

export function extractClapFlags(
  content: string,
  file: string,
): ExtractedFlag[] {
  const flags: ExtractedFlag[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const re of [CLAP_LONG_RE]) {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(line)) !== null) {
        flags.push({ flag: `--${match[1]}`, file, line: i + 1 });
      }
    }

    for (const re of [CLAP_SHORT_RE]) {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(line)) !== null) {
        flags.push({ flag: `-${match[1]}`, file, line: i + 1 });
      }
    }

    DERIVE_LONG_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DERIVE_LONG_RE.exec(line)) !== null) {
      if (match[1]) {
        flags.push({ flag: `--${match[1]}`, file, line: i + 1 });
      }
      // If no explicit name, the field name is used — we'd need the next line
    }

    DERIVE_SHORT_RE.lastIndex = 0;
    while ((match = DERIVE_SHORT_RE.exec(line)) !== null) {
      if (match[1]) {
        flags.push({ flag: `-${match[1]}`, file, line: i + 1 });
      }
    }
  }

  return flags;
}
