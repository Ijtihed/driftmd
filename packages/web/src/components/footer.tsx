export default function Footer() {
  return (
    <footer className="w-full flex justify-between items-center px-10 py-4 shrink-0">
      <div className="text-neutral-600 font-[JetBrains_Mono] text-xs uppercase tracking-[0.15em]">
        driftmd
      </div>
      <div className="flex gap-6">
        <a
          className="px-3 py-2 text-neutral-600 hover:text-white transition-colors duration-300 font-[JetBrains_Mono] text-xs uppercase tracking-[0.15em]"
          href="https://github.com/Ijtihed/driftmd"
          target="_blank"
          rel="noreferrer"
        >
          Source
        </a>
        <a
          className="px-3 py-2 text-neutral-600 hover:text-white transition-colors duration-300 font-[JetBrains_Mono] text-xs uppercase tracking-[0.15em]"
          href="https://www.npmjs.com/package/driftmd"
          target="_blank"
          rel="noreferrer"
        >
          npm
        </a>
      </div>
    </footer>
  );
}
