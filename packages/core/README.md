# driftmd-core

The engine behind [driftmd](https://www.npmjs.com/package/driftmd). A static analysis library that cross-references README claims against your actual codebase and reports every claim that's no longer true.

No LLM required. The default checks are fully deterministic: broken links, stale directory trees, badge mismatches. An optional verified mode uses an LLM to go deeper (file references, CLI flags, env vars, function signatures), but the core workflow is plain static analysis.

Most users should install `driftmd` (the CLI). Use this package directly if you want to integrate drift detection into your own tools.

## Install

```bash
npm install driftmd-core
```

## Usage

```typescript
import { analyzeDrift } from 'driftmd-core';

const report = await analyzeDrift('/path/to/repo', {
  checks: { internalLinks: true, dirTree: true, badges: true },
  ignore: ['node_modules'],
});

console.log(report.findings);
// [{ type: 'internal-link', severity: 'error', line: 23, message: '...' }, ...]
```

## What it checks

**Deterministic (no LLM):**
- Internal markdown links
- Directory tree listings
- Badge version mismatches

**Verified mode (optional LLM filtering):**
- File references in prose
- CLI flag definitions (commander, argparse, click, clap)
- Environment variable usage (JS, Python, Rust, Ruby, Go, Java)
- Function signatures

## Links

- [CLI tool (driftmd)](https://www.npmjs.com/package/driftmd)
- [GitHub](https://github.com/Ijtihed/driftmd)
- [Full documentation](https://github.com/Ijtihed/driftmd#readme)

## License

MIT
