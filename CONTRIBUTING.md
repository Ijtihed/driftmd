# Contributing to driftmd

Thanks for your interest in contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/Ijtihed/driftmd.git
cd driftmd
npm install
npm run build
```

## Development

This is a Turborepo monorepo with four packages:

- **`packages/core`** - the analysis engine
- **`packages/cli`** - the CLI wrapper
- **`packages/action`** - the GitHub Action
- **`packages/web`** - the Next.js web interface

Run everything in dev mode:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Making changes

1. Fork the repo and create a branch from `main`.
2. Make your changes. Add tests if you're touching `packages/core`.
3. Run `npm run build && npm test` to make sure nothing breaks.
4. Open a pull request.

## Adding a new checker

Checkers live in `packages/core/src/checker/`. Each checker:

1. Receives parsed README data and a repo root path.
2. Returns an array of `Finding` objects (see `packages/core/src/types.ts`).
3. Gets registered in `packages/core/src/index.ts`.

## Adding a new extractor

Extractors live in `packages/core/src/extractor/`. They pull structured info from source files (CLI flags, env vars, etc.) that checkers compare against README claims.

## Reporting issues

Open an issue on GitHub. Include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node version and OS

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
