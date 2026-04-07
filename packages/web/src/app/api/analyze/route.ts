import { NextResponse } from 'next/server';
import { analyzeDrift } from '@driftmd/core';
import { nanoid } from 'nanoid';
import { cloneRepo, cleanup, readReadmeContent } from '@/lib/github';
import { setReport } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';

const GITHUB_URL_RE = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  let tmpDir: string | null = null;

  try {
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl || !GITHUB_URL_RE.test(repoUrl)) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 },
      );
    }

    const gitUrl = repoUrl.replace(/\/?$/, '.git');
    tmpDir = await cloneRepo(gitUrl);

    const report = await analyzeDrift(tmpDir, {
      checks: {
        fileReferences: true,
        dirTree: true,
        internalLinks: true,
        cliFlags: true,
        envVars: true,
        badges: true,
      },
    });

    const readmeContent = readReadmeContent(tmpDir);
    const id = nanoid(12);

    setReport({
      id,
      repoUrl,
      report,
      readmeContent,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id, summary: report.summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';

    if (message.includes('Could not read from remote') || message.includes('not found')) {
      return NextResponse.json(
        { error: 'Repository not found or not public' },
        { status: 404 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tmpDir) {
      await cleanup(tmpDir);
    }
  }
}
