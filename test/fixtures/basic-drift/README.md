# My Project

A sample project for testing driftmd.

## Installation

```bash
npm install my-project
```

## Usage

```bash
npx my-project --verbose --output result.json --dry-run
```

Check the config at `src/config.yaml` for settings.

See `lib/utils.py` for utility functions.

## Project Structure

```
my-project/
├── src/
│   ├── index.ts
│   ├── cli.ts
│   └── helpers/
│       └── format.ts
├── lib/
│   └── utils.py
├── docs/
│   └── CONTRIBUTING.md
├── package.json
└── README.md
```

## Configuration

Set the following environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `API_KEY` | Your API key |
| `REDIS_HOST` | Redis server hostname |

## Links

- [Contributing Guide](./docs/CONTRIBUTING.md)
- [Examples](./examples/basic.py)
- [License](./LICENSE)

## Badge

![version](https://img.shields.io/badge/version-v1.0.0-blue)
