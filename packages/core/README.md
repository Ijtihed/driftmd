# driftmd-core

The engine behind [driftmd](https://www.npmjs.com/package/driftmd). Cross-references README claims against your actual codebase.

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

- Internal markdown links
- Directory tree listings
- Badge version mismatches
- File references (with optional LLM verification)
- CLI flag definitions (commander, argparse, click, clap)
- Environment variable usage (JS, Python, Rust, Ruby, Go, Java)
- Function signatures (opt-in)

## Links

- [CLI tool (driftmd)](https://www.npmjs.com/package/driftmd)
- [GitHub](https://github.com/Ijtihed/driftmd)
- [Full documentation](https://github.com/Ijtihed/driftmd#readme)

## License

MIT
