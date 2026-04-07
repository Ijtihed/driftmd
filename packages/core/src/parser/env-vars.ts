import { visit } from 'unist-util-visit';
import type { Root, Code, InlineCode, Text, TableCell, Heading } from 'mdast';
import type { ExtractedEnvVar } from '../types.js';

const ENV_VAR_RE = /\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g;

const IGNORED_VARS = new Set([
  'README', 'TODO', 'NOTE', 'WARNING', 'IMPORTANT', 'BREAKING',
  'API', 'URL', 'HTTP', 'HTTPS', 'JSON', 'HTML', 'CSS', 'UTF',
  'POST', 'GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS',
  'MIT', 'BSD', 'GPL', 'ISC', 'NPM', 'CLI',
  'ASCII', 'ANSI', 'CRLF', 'YAML', 'TOML', 'XML', 'CSV',
]);

const WELL_KNOWN_ENV_VARS = new Set([
  'FORCE_COLOR', 'NO_COLOR', 'TERM', 'COLORTERM', 'WT_SESSION',
  'TERM_PROGRAM', 'TERM_PROGRAM_VERSION',
  'CI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'CIRCLECI', 'TRAVIS',
  'JENKINS_URL', 'BUILDKITE', 'CODEBUILD_BUILD_ID',
  'NODE_ENV', 'NODE_DEBUG', 'NODE_OPTIONS', 'NODE_PATH',
  'NODE_EXTRA_CA_CERTS', 'NODE_TLS_REJECT_UNAUTHORIZED',
  'PYTHONPATH', 'PYTHONDONTWRITEBYTECODE', 'VIRTUAL_ENV',
  'HOME', 'USER', 'PATH', 'SHELL', 'LANG', 'LC_ALL',
  'TZ', 'EDITOR', 'VISUAL', 'PAGER',
  'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY',
  'DOCKER_HOST', 'COMPOSE_FILE',
]);

function isLikelyEnvVar(name: string): boolean {
  if (IGNORED_VARS.has(name)) return false;
  if (name.length < 4) return false;
  if (!name.includes('_')) return false;
  return true;
}

const ENV_HEADING_RE = /\b(env|environment|config|configuration|variable|setup)\b/i;

export function extractEnvVars(
  tree: Root,
  rawContent: string,
): ExtractedEnvVar[] {
  const vars: ExtractedEnvVar[] = [];
  const seen = new Set<string>();

  function add(name: string, line: number, column: number) {
    if (seen.has(name)) return;
    if (!isLikelyEnvVar(name)) return;
    seen.add(name);
    vars.push({ name, line, column });
  }

  visit(tree, 'inlineCode', (node: InlineCode) => {
    let match: RegExpExecArray | null;
    ENV_VAR_RE.lastIndex = 0;
    while ((match = ENV_VAR_RE.exec(node.value)) !== null) {
      add(
        match[1],
        node.position?.start.line ?? 0,
        (node.position?.start.column ?? 0) + match.index,
      );
    }
  });

  visit(tree, 'code', (node: Code) => {
    if (node.lang && ['bash', 'sh', 'shell', 'console', 'zsh', 'env', 'dotenv'].includes(node.lang)) {
      const startLine = node.position?.start.line ?? 0;
      const lines = node.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let match: RegExpExecArray | null;
        ENV_VAR_RE.lastIndex = 0;
        while ((match = ENV_VAR_RE.exec(lines[i])) !== null) {
          add(match[1], startLine + i + 1, match.index + 1);
        }
      }
    }
  });

  visit(tree, 'tableCell', (node: TableCell) => {
    const text = node.children
      .filter((c): c is Text => c.type === 'text')
      .map((c) => c.value)
      .join('');
    let match: RegExpExecArray | null;
    ENV_VAR_RE.lastIndex = 0;
    while ((match = ENV_VAR_RE.exec(text)) !== null) {
      add(
        match[1],
        node.position?.start.line ?? 0,
        (node.position?.start.column ?? 0) + match.index,
      );
    }
  });

  return vars;
}

export { WELL_KNOWN_ENV_VARS };
