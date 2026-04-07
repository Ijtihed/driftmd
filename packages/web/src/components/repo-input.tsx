'use client';

import { useState } from 'react';

interface RepoInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

const GITHUB_URL_RE = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/;
const GITHUB_EXTRACT_RE = /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/;
const GITHUB_LOOSE_RE = /github\.com\/[\w.-]+\/[\w.-]+/;

function normalizeGithubUrl(raw: string): string | null {
  let value = raw.trim();
  if (GITHUB_LOOSE_RE.test(value) && !value.startsWith('http')) {
    value = `https://${value}`;
  }
  const match = value.match(GITHUB_EXTRACT_RE);
  if (!match) return null;
  return `https://github.com/${match[2]}/${match[3]}`;
}

export default function RepoInput({ onSubmit, loading }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [focused, setFocused] = useState(false);

  const normalized = normalizeGithubUrl(url);
  const isValid = normalized !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid && !loading && normalized) {
      onSubmit(normalized);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`
          border transition-all duration-300
          ${focused ? 'border-neutral-500' : 'border-neutral-800'}
          ${loading ? 'opacity-60' : ''}
        `}
      >
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={loading}
          placeholder="https://github.com/owner/repo"
          className="w-full bg-transparent px-4 py-3 text-sm font-[JetBrains_Mono] text-neutral-200 placeholder:text-neutral-600 outline-none tracking-wide"
        />
      </div>
      <button
        type="submit"
        disabled={!isValid || loading}
        className={`
          w-full mt-2 px-4 py-3 font-[JetBrains_Mono] text-sm uppercase tracking-[0.15em]
          transition-all duration-300 border
          ${isValid && !loading
            ? 'text-white border-neutral-600 hover:bg-white hover:text-black cursor-pointer'
            : 'text-neutral-700 border-neutral-800 cursor-default'
          }
        `}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            scanning
          </span>
        ) : (
          'Analyze'
        )}
      </button>

      {url && !isValid && url.length > 5 && (
        <p className="mt-3 font-[JetBrains_Mono] text-xs text-neutral-500 tracking-wide">
          Paste a GitHub repository URL
        </p>
      )}
    </form>
  );
}
