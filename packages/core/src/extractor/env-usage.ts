import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';

export interface EnvVarUsage {
  name: string;
  file: string;
  line: number;
}

const LANG_PATTERNS: { pattern: RegExp; nameGroup: number }[] = [
  // JS/TS: process.env.VAR_NAME or process.env['VAR_NAME'] or process.env["VAR_NAME"]
  { pattern: /process\.env\.([A-Z][A-Z0-9_]+)/g, nameGroup: 1 },
  { pattern: /process\.env\[['"]([A-Z][A-Z0-9_]+)['"]\]/g, nameGroup: 1 },
  // Python: os.environ["VAR"] os.environ.get("VAR") os.getenv("VAR")
  { pattern: /os\.environ\[['"]([A-Z][A-Z0-9_]+)['"]\]/g, nameGroup: 1 },
  { pattern: /os\.environ\.get\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g, nameGroup: 1 },
  { pattern: /os\.getenv\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g, nameGroup: 1 },
  // Rust: env::var("VAR") std::env::var("VAR")
  { pattern: /env::var\(\s*"([A-Z][A-Z0-9_]+)"/g, nameGroup: 1 },
  // Java: System.getenv("VAR")
  { pattern: /System\.getenv\(\s*"([A-Z][A-Z0-9_]+)"/g, nameGroup: 1 },
  // Ruby: ENV["VAR"] ENV.fetch("VAR")
  { pattern: /ENV\[['"]([A-Z][A-Z0-9_]+)['"]\]/g, nameGroup: 1 },
  { pattern: /ENV\.fetch\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g, nameGroup: 1 },
  // Go / C: getenv("VAR") or os.Getenv("VAR")
  { pattern: /[Gg]etenv\(\s*"([A-Z][A-Z0-9_]+)"/g, nameGroup: 1 },
];

const DOTENV_PATTERN = { pattern: /^([A-Z][A-Z0-9_]+)\s*=/gm, nameGroup: 1 };

const JS_DESTRUCTURED_ENV_RE = /\b(?:const|let|var)\s*\{[^}]*\benv\b[^}]*\}\s*=\s*process\b/;
const JS_DESTRUCTURED_DOT = /\benv\.([A-Z][A-Z0-9_]+)\b/g;
const JS_DESTRUCTURED_BRACKET = /\benv\[['"]([A-Z][A-Z0-9_]+)['"]\]/g;
const JS_IN_ENV = /['"]([A-Z][A-Z0-9_]+)['"]\s+in\s+env\b/g;

function isEnvFile(filePath: string): boolean {
  const base = path.basename(filePath);
  return /^\.env(\..+)?$/.test(base);
}

function isJsFile(filePath: string): boolean {
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(filePath);
}

export async function findEnvVarUsages(
  repoPath: string,
  ignore: string[],
): Promise<EnvVarUsage[]> {
  const usages: EnvVarUsage[] = [];
  const seen = new Set<string>();

  const files = await fg(
    ['**/*.{ts,js,tsx,jsx,py,rs,java,rb,go,c,h,env,env.*}'],
    {
      cwd: repoPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', ...ignore],
      absolute: false,
    },
  );

  for (const file of files) {
    const fullPath = path.join(repoPath, file);
    let content: string;
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');

    const hasDestructuredEnv = isJsFile(file) && JS_DESTRUCTURED_ENV_RE.test(content);

    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, nameGroup } of LANG_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(lines[i])) !== null) {
          const name = match[nameGroup];
          const key = `${name}:${file}`;
          if (!seen.has(key)) {
            seen.add(key);
            usages.push({ name, file, line: i + 1 });
          }
        }
      }

      if (isEnvFile(file)) {
        DOTENV_PATTERN.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = DOTENV_PATTERN.pattern.exec(lines[i])) !== null) {
          const name = match[DOTENV_PATTERN.nameGroup];
          const key = `${name}:${file}`;
          if (!seen.has(key)) {
            seen.add(key);
            usages.push({ name, file, line: i + 1 });
          }
        }
      }

      if (hasDestructuredEnv) {
        for (const re of [JS_DESTRUCTURED_DOT, JS_DESTRUCTURED_BRACKET, JS_IN_ENV]) {
          re.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = re.exec(lines[i])) !== null) {
            const name = match[1];
            const key = `${name}:${file}`;
            if (!seen.has(key)) {
              seen.add(key);
              usages.push({ name, file, line: i + 1 });
            }
          }
        }
      }
    }
  }

  return usages;
}
