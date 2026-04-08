'use client';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 flex w-full items-center justify-end px-6 py-4 mix-blend-difference sm:px-10">
      <nav className="flex gap-6">
        <a
          href="https://github.com/Ijtihed/driftmd"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 text-neutral-500 hover:text-white transition-colors font-[JetBrains_Mono] text-xs uppercase tracking-[0.15em]"
        >
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/driftmd"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 text-neutral-500 hover:text-white transition-colors font-[JetBrains_Mono] text-xs uppercase tracking-[0.15em]"
        >
          npm
        </a>
        <a
          href="https://github.com/Ijtihed/driftmd#readme"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 text-white font-[JetBrains_Mono] text-xs uppercase tracking-[0.15em] hover:opacity-70 transition-opacity"
        >
          Docs
        </a>
      </nav>
    </header>
  );
}
