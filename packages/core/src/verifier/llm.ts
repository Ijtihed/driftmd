import type { Finding, VerifyConfig } from '../types.js';

const DEFAULT_MODELS: Record<string, string> = {
  ollama: 'llama3.2',
  anthropic: 'claude-haiku-4-5-20251001',
  openai: 'gpt-4o-mini',
};

interface VerificationResult {
  id: number;
  verdict: 'REAL' | 'EXAMPLE';
  reason: string;
}

export async function verifyFindings(
  candidates: Finding[],
  readmeContent: string,
  repoPath: string,
  config: VerifyConfig,
): Promise<{ verified: Finding[]; filtered: number }> {
  if (candidates.length === 0) return { verified: [], filtered: 0 };

  const model = config.model || DEFAULT_MODELS[config.provider] || 'llama3.2';
  const verified: Finding[] = [];
  let filtered = 0;

  const batches = batchItems(candidates, 10);

  for (const batch of batches) {
    const prompt = buildPrompt(batch, readmeContent, repoPath);

    try {
      const raw = await callProvider(prompt, model, config);
      const results = parseResponse(raw, batch);

      for (const r of results) {
        if (r.verdict === 'REAL') {
          verified.push(batch[r.id - 1]);
        } else {
          filtered++;
        }
      }
    } catch {
      for (const f of batch) {
        verified.push(f);
      }
    }
  }

  return { verified, filtered };
}

function batchItems<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function buildPrompt(candidates: Finding[], readmeContent: string, repoPath: string): string {
  const lines = readmeContent.split('\n');

  const descriptions = candidates.map((c, i) => {
    const start = Math.max(0, c.line - 3);
    const end = Math.min(lines.length, c.line + 2);
    const ctx = lines.slice(start, end).map((l, j) => `${start + j + 1}: ${l}`).join('\n');
    return `CANDIDATE ${i + 1}:\nType: ${c.type}\nLine ${c.line}: ${c.message}\nContext:\n${ctx}`;
  }).join('\n\n');

  return `You are verifying documentation drift candidates. A tool flagged potential issues in a README. For each candidate, decide if it is a REAL claim about this specific repository, or an EXAMPLE/illustration/unrelated mention.

REAL = The README asserts this file/flag/variable exists in THIS project.
EXAMPLE = The README uses it as an example, illustration, sample output, or hypothetical.

When in doubt, say EXAMPLE. We strongly prefer missing a real issue over a false positive.

Project path: ${repoPath}

${descriptions}

Respond with ONLY a JSON array:
[{"id":1,"verdict":"REAL","reason":"..."},{"id":2,"verdict":"EXAMPLE","reason":"..."}]`;
}

function parseResponse(raw: string, batch: Finding[]): VerificationResult[] {
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return batch.map((_, i) => ({ id: i + 1, verdict: 'REAL' as const, reason: 'parse failed' }));
    const arr = JSON.parse(match[0]) as VerificationResult[];
    return arr;
  } catch {
    return batch.map((_, i) => ({ id: i + 1, verdict: 'REAL' as const, reason: 'parse failed' }));
  }
}

async function callProvider(prompt: string, model: string, config: VerifyConfig): Promise<string> {
  if (config.provider === 'ollama') {
    const base = config.baseUrl || 'http://localhost:11434';
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error(`Ollama: ${res.status} ${res.statusText}`);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content;
  }

  if (config.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic: ${res.status}`);
    const data = await res.json() as { content: { text: string }[] };
    return data.content[0].text;
  }

  if (config.provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI: ${res.status}`);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content;
  }

  throw new Error(`Unknown provider: ${config.provider}`);
}
