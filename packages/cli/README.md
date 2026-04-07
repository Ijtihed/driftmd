# driftmd

Your README is lying. driftmd catches it.

Cross-references every claim in your README against your actual codebase: internal links, directory trees, badge versions, file references, CLI flags, env vars, and function signatures.

## Quick start

```bash
npx driftmd
```

Zero config. Run in any repo.

## Two modes

**Quick mode** (default) checks links, dir trees, and badges with zero false positives. No LLM needed.

**Verified mode** (`--verify`) adds file references, CLI flags, env vars, and signatures with LLM filtering to eliminate false positives.

```bash
npx driftmd --verify                          # ollama (free, local)
npx driftmd --verify --provider anthropic     # Claude
npx driftmd --verify --provider openai        # GPT
```

## GitHub Action

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

## All flags

```
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
```

## Links

- [GitHub](https://github.com/Ijtihed/driftmd)
- [Full documentation](https://github.com/Ijtihed/driftmd#readme)
- [Changelog](https://github.com/Ijtihed/driftmd/blob/main/CHANGELOG.md)

## License

MIT
