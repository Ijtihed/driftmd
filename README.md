<div align="center">

<h1>driftmd.</h1>
<h3><em>Your README is lying. driftmd catches it.</em></h3>

<p>
  <a href="https://www.npmjs.com/package/driftmd"><img src="https://img.shields.io/badge/npx-driftmd-cb3837?style=for-the-badge&logo=npm&logoColor=white" alt="npx driftmd"></a>
  <a href="https://github.com/Ijtihed/driftmd"><img src="https://img.shields.io/badge/Checks-7-8a9bb5?style=for-the-badge" alt="7 Checks"></a>
  <a href="https://github.com/Ijtihed/driftmd"><img src="https://img.shields.io/badge/Built_with-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="Built with TypeScript"></a>
  <a href="https://github.com/Ijtihed/driftmd"><img src="https://img.shields.io/badge/Runtime-Node_20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node 20+"></a>
  <a href="https://github.com/Ijtihed/driftmd/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License"></a>
</p>

</div>

<img width="1865" height="938" alt="image" src="https://github.com/user-attachments/assets/b1c483e2-c4e8-4e81-9d72-0d5794ad63c1" />

---

> Semantic drift detection for documentation. Cross-references your README against your actual codebase and reports every claim that is no longer true. Not link-checking. Not linting. Your README says one thing, your code says another, and nobody noticed. Until now.

---

## Quick Start

```bash
npx driftmd
```

Run in any repo. Zero config. Finds your README, cross-references it against your codebase, reports every lie.

## Two Modes

**Quick mode** (default) checks what can be verified with zero false positives:
- Internal links (`[text](./path)` pointing to missing files)
- Directory tree listings that don't match the filesystem
- Badge version mismatches

No LLM, no API key, instant results.

**Verified mode** adds deeper checks with LLM filtering:
- File references in prose and inline code
- CLI flag cross-referencing (commander, argparse, click, clap)
- Environment variable cross-referencing (JS, Python, Rust, Ruby, Go, Java)
- Function signature validation

```bash
# Ollama (free, local)
npx driftmd --verify

# Anthropic
npx driftmd --verify --provider anthropic --api-key KEY
# or set ANTHROPIC_API_KEY env var

# OpenAI
npx driftmd --verify --provider openai --api-key KEY
# or set OPENAI_API_KEY env var
```

The LLM reads each candidate in context and filters out examples, illustrations, and hypothetical filenames. Only real claims about the repo get reported. Cost is typically under $0.01 per run.

## What It Checks

| Check | What it catches |
|-------|----------------|
| **Internal links** | `[Guide](./docs/setup.md)` points to a file that's gone |
| **Directory trees** | ASCII tree listing shows directories that were renamed or removed |
| **Badge versions** | Badge says v2.0.0, package.json says 3.1.0 |
| **File references** | README mentions `src/config.yaml` but the file was deleted |
| **CLI flags** | README documents `--verbose` but the flag was removed from the argparser |
| **Env variables** | README says to set `REDIS_URL` but the code never reads it |
| **Signatures** | README shows `connect(host, timeout=60)` but the actual default is 30 |

The first three run in quick mode (deterministic). The rest require `--verify` for accurate results.

## GitHub Action

Create `.github/workflows/driftmd.yml`:

```yaml
name: driftmd
on: [pull_request]
jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Ijtihed/driftmd@v1
```

For verified mode in CI:

```yaml
      - uses: Ijtihed/driftmd@v1
        with:
          verify: true
          verify-provider: anthropic
          verify-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Configuration

Create `.driftmdrc.json` for customization, or run `npx driftmd --init` to generate one:

```json
{
  "checks": {
    "cli-flags": false
  },
  "ignore": ["dist", "node_modules"],
  "severity": "warning"
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `readme` | `string[]` | `["README.md"]` | Markdown files to check |
| `checks` | `object` | all enabled | Enable/disable checks |
| `ignore` | `string[]` | `["node_modules","dist",".git"]` | Paths to exclude |
| `cli-entry` | `string` | auto-detect | CLI entry point for flag extraction |
| `severity` | `string` | `"error"` | Minimum severity: `error`, `warning`, `info` |
| `verify` | `object` | disabled | LLM verification config |

## CLI Reference

```
npx driftmd [path] [options]

Options:
  --json                   Output as JSON
  --severity <level>       Minimum severity (error, warning, info)
  --verify                 Enable LLM-verified deep checks
  --provider <name>        LLM provider: ollama, anthropic, openai
  --model <name>           LLM model name
  --api-key <key>          API key for anthropic/openai
  --signatures             Enable function signature checks
  --init                   Generate .driftmdrc.json
  --no-file-references     Disable file reference checks
  --no-dir-tree            Disable directory tree checks
  --no-internal-links      Disable internal link checks
  --no-cli-flags           Disable CLI flag checks
  --no-env-vars            Disable env var checks
  --no-badges              Disable badge version checks
  --cli-entry <path>       CLI entry point for flag extraction
  --ignore <patterns...>   Patterns to ignore
  --help                   Show help
  --version                Show version
```

## Let AI Set It Up

Paste into Cursor, Claude Code, or Copilot inside your project:

```
Add driftmd to this project. Create .github/workflows/driftmd.yml that runs
on every PR using Ijtihed/driftmd@v1. Then run npx driftmd locally and fix
any README drift it finds.
```

## License

[MIT](LICENSE) · [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md)

---

<div align="center">
<sub>Built by <a href="https://github.com/Ijtihed">Ijtihed</a></sub>
</div>
