'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CopyBlock from '@/components/copy-block';

const ACTION_YAML = `name: driftmd
on: [pull_request]
jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Ijtihed/driftmd@v1`;

const AI_PROMPT = `Add driftmd to this project. Create .github/workflows/driftmd.yml that runs on every PR using the Ijtihed/driftmd@v1 action. Also run npx driftmd locally and fix any README drift it finds. Commit both the workflow file and any README fixes.`;

const CHECKS = [
  { name: 'Internal links', example: '[guide](./docs/setup.md) points to a deleted file' },
  { name: 'Directory trees', example: 'ASCII tree shows src/helpers/ but the folder was renamed' },
  { name: 'Badge versions', example: 'Badge says v2.0.0, package.json says v3.1.0' },
  { name: 'File references', example: 'README mentions src/config.yaml but the file is gone' },
  { name: 'CLI flags', example: 'Docs say --verbose but the flag was removed from argparse' },
  { name: 'Env variables', example: 'README says set REDIS_URL but code never reads it' },
  { name: 'Signatures', example: 'README shows connect(timeout=60) but default is 30' },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">

        {/* Hero */}
        <section className="min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center px-6 shrink-0 pt-20 md:pt-0">
          <div className="w-full max-w-2xl mx-auto text-center">
            <h1 className="font-[Manrope] font-extrabold text-[clamp(2.5rem,11vw,8rem)] leading-[0.9] tracking-tighter text-white select-none mb-4">
              driftmd.
            </h1>
            <p className="font-[JetBrains_Mono] text-xs sm:text-sm text-neutral-400 uppercase tracking-[0.25em] mb-8 md:mb-10 max-w-md mx-auto">
              your readme is lying. driftmd catches it.
            </p>
            <a
              href="https://www.npmjs.com/package/driftmd"
              target="_blank"
              rel="noreferrer"
              className="inline-block border border-neutral-700 px-8 py-3 bg-neutral-950 hover:border-neutral-400 hover:bg-neutral-900 transition-all duration-300"
            >
              <code className="font-[JetBrains_Mono] text-base text-white tracking-wider">
                npx driftmd
              </code>
            </a>
            <p className="mt-4 font-[JetBrains_Mono] text-[0.7rem] text-neutral-600 uppercase tracking-[0.15em]">
              run it right now. zero config.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-16 md:py-28">
          <div className="max-w-4xl mx-auto">
            <p className="font-[JetBrains_Mono] text-xs text-neutral-600 uppercase tracking-[0.3em] mb-4 md:mb-6 text-center">
              How it works
            </p>
            <h2 className="font-[Manrope] text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight text-center mb-12 md:mb-20">
              Your README says one thing.<br />Your code says another.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
              <div className="text-center">
                <div className="w-12 h-12 border border-neutral-800 flex items-center justify-center mx-auto mb-5">
                  <span className="font-[Manrope] text-lg font-light text-neutral-500">1</span>
                </div>
                <p className="font-[Manrope] text-base text-white mb-2">README claims</p>
                <p className="font-[JetBrains_Mono] text-xs text-neutral-500 leading-relaxed max-w-[240px] mx-auto">
                  &quot;Config lives in <span className="text-drift-error">src/config.yaml</span>&quot;<br />
                  &quot;Run with <span className="text-drift-error">--verbose</span>&quot;<br />
                  &quot;Set <span className="text-drift-error">REDIS_HOST</span>&quot;
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 border border-neutral-800 flex items-center justify-center mx-auto mb-5">
                  <span className="font-[Manrope] text-lg font-light text-neutral-500">2</span>
                </div>
                <p className="font-[Manrope] text-base text-white mb-2">driftmd scans</p>
                <p className="font-[JetBrains_Mono] text-xs text-neutral-500 leading-relaxed max-w-[240px] mx-auto">
                  Parses your README, extracts every claim, then cross-references against your actual files, CLI flags, env vars, badges, and signatures.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 border border-neutral-800 flex items-center justify-center mx-auto mb-5">
                  <span className="font-[Manrope] text-lg font-light text-neutral-500">3</span>
                </div>
                <p className="font-[Manrope] text-base text-white mb-2">Drift caught</p>
                <p className="font-[JetBrains_Mono] text-xs text-neutral-500 leading-relaxed max-w-[240px] mx-auto">
                  File deleted. Flag removed. Env var unused. Badge outdated. Default changed. You fix it before users notice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What it checks */}
        <section className="px-4 sm:px-6 py-16 md:py-28">
          <div className="max-w-3xl mx-auto">
            <p className="font-[JetBrains_Mono] text-xs text-neutral-600 uppercase tracking-[0.3em] mb-4 md:mb-6 text-center">
              What it checks
            </p>
            <h2 className="font-[Manrope] text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight text-center mb-12 md:mb-16">
              7 checks. 7 languages.
            </h2>

            <div className="space-y-0">
              {CHECKS.map((check, i) => (
                <div
                  key={check.name}
                  className="flex items-start gap-4 sm:gap-6 py-5 border-b border-neutral-800/50 last:border-0"
                >
                  <span className="font-[Manrope] text-sm text-neutral-700 tabular-nums shrink-0 pt-0.5 w-5 text-right">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-[Manrope] text-sm sm:text-base text-white mb-1">
                      {check.name}
                    </p>
                    <p className="font-[JetBrains_Mono] text-[0.7rem] sm:text-xs text-neutral-500 leading-relaxed">
                      {check.example}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 font-[JetBrains_Mono] text-[0.7rem] text-neutral-600 text-center leading-relaxed">
              Supports TypeScript, JavaScript, Python, Rust, Go, Ruby, and Java.<br />
              CLI flag extraction works with commander, argparse, click, and clap.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="w-16 h-px bg-neutral-800 mx-auto" />

        {/* Get started */}
        <section className="px-4 sm:px-6 py-16 md:py-28">
          <div className="max-w-5xl mx-auto">
            <p className="font-[JetBrains_Mono] text-xs text-neutral-600 uppercase tracking-[0.3em] mb-4 md:mb-6 text-center">
              Get started
            </p>
            <h2 className="font-[Manrope] text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight text-center mb-10 md:mb-20">
              Pick how you want to use it.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Terminal */}
              <div className="border border-neutral-800 p-5 sm:p-7 flex flex-col">
                <p className="font-[Manrope] text-lg text-white mb-2">Terminal</p>
                <p className="font-[JetBrains_Mono] text-[0.75rem] text-neutral-500 leading-relaxed mb-5">
                  Run once in any project. Nothing to install, nothing to configure.
                </p>
                <div className="mt-auto space-y-3">
                  <CopyBlock code="npx driftmd" lang="bash" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                    <span className="font-[JetBrains_Mono] text-[0.6rem] text-neutral-600">--json</span>
                    <span className="font-[JetBrains_Mono] text-[0.6rem] text-neutral-600">--severity warning</span>
                    <span className="font-[JetBrains_Mono] text-[0.6rem] text-neutral-600">--verify</span>
                  </div>
                </div>
              </div>

              {/* GitHub Action */}
              <div className="border border-neutral-800 p-5 sm:p-7 flex flex-col">
                <p className="font-[Manrope] text-lg text-white mb-2">GitHub Action</p>
                <p className="font-[JetBrains_Mono] text-[0.75rem] text-neutral-500 leading-relaxed mb-5">
                  Add one file. Every PR gets checked for README drift automatically.
                </p>
                <div className="mt-auto">
                  <CopyBlock code={ACTION_YAML} lang=".github/workflows/driftmd.yml" />
                </div>
              </div>

              {/* AI Prompt */}
              <div className="border border-neutral-800 p-5 sm:p-7 flex flex-col">
                <p className="font-[Manrope] text-lg text-white mb-2">AI Prompt</p>
                <p className="font-[JetBrains_Mono] text-[0.75rem] text-neutral-500 leading-relaxed mb-5">
                  Paste into Cursor, Claude Code, or Copilot. AI does the rest.
                </p>
                <div className="mt-auto">
                  <CopyBlock code={AI_PROMPT} lang="prompt" />
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
