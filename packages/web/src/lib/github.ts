import { simpleGit } from 'simple-git';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export async function cloneRepo(repoUrl: string): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `driftmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const git = simpleGit({ timeout: { block: 30000 } });
  await git.clone(repoUrl, tmpDir, ['--depth', '1', '--single-branch']);

  return tmpDir;
}

export async function cleanup(dir: string): Promise<void> {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

export function readReadmeContent(repoPath: string, readmePath: string = 'README.md'): string {
  const candidates = [readmePath, 'README.md', 'readme.md', 'Readme.md'];
  for (const candidate of candidates) {
    const full = path.resolve(repoPath, candidate);
    if (fs.existsSync(full)) {
      return fs.readFileSync(full, 'utf-8');
    }
  }
  return '';
}
