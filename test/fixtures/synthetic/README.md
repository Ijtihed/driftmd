# synthetic-app

A comprehensive test fixture for driftmd accuracy validation.

## Installation

```bash
npm install synthetic-app
```

## Usage

### CLI

```bash
# These flags exist in src/cli.ts:
npx synthetic --output result.json --dry-run --format json

# This flag does NOT exist (should be caught):
npx synthetic --verbose --silent

# These flags exist in src/parser.py:
python parser.py --input data.csv --verbose --quiet
```

### Python Server

```bash
# These flags exist in src/server.py:
python server.py --host 0.0.0.0 --port 9090 --reload

# This flag does NOT exist (should be caught):
python server.py --daemon
```

### API Client

```python
result = client.query(sql, timeout=60, retries=5)
result2 = client.connect(host, port=5432, ssl=True, compression=True)
answer = helper(x, y=20)
```

## File References

These files exist:
- Check `src/index.ts` for the main entry point
- See `src/cli.ts` for the CLI definition
- Configuration lives in `config/default.yaml`
- Read the `docs/guide.md` for usage instructions
- See `src/utils.ts` for utility functions

These files do NOT exist (should be caught):
- Check `src/config.yaml` for settings
- See `src/database.ts` for DB logic
- Templates are in `templates/email.html`

## Links

Working links:
- [User Guide](./docs/guide.md)
- [API Reference](./docs/api.md)
- [License](./LICENSE)

Broken links (should be caught):
- [Contributing](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [Examples](./examples/basic.js)

## Project Structure

```
synthetic-app/
├── src/
│   ├── index.ts
│   ├── cli.ts
│   ├── utils.ts
│   ├── server.py
│   ├── parser.py
│   ├── main.rs
│   ├── deleted-file.ts
│   └── old-module/
│       └── legacy.ts
├── docs/
│   ├── guide.md
│   ├── api.md
│   └── changelog.md
├── config/
│   ├── default.yaml
│   └── production.yaml
├── templates/
│   └── email.html
├── lib/
│   └── helpers.ts
├── package.json
├── LICENSE
└── README.md
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `API_KEY` | Your API key for auth | Yes |
| `REDIS_URL` | Redis connection URL | Yes |
| `REDIS_HOST` | Redis host (deprecated) | No |
| `LOG_LEVEL` | Logging level | No |
| `SENTRY_DSN` | Sentry error tracking DSN | No |

## Badge

![version](https://img.shields.io/badge/version-v2.0.0-blue)
![npm](https://img.shields.io/npm/v/synthetic-app)
