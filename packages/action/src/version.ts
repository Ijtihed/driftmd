import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

function findPackageJson(startDir: string): string {
  let dir = startDir;
  while (true) {
    const candidate = resolve(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not find package.json');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = findPackageJson(__dirname);
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
export const VERSION: string = pkg.version;
