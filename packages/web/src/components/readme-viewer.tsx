'use client';

import { useEffect, useRef } from 'react';
import type { Finding } from '@driftmd/core';

interface ReadmeViewerProps {
  content: string;
  findings: Finding[];
  highlightLine: number | null;
}

export default function ReadmeViewer({
  content,
  findings,
  highlightLine,
}: ReadmeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = content.split('\n');

  const errorLines = new Set(
    findings.filter((f) => f.severity === 'error').map((f) => f.line),
  );
  const warningLines = new Set(
    findings.filter((f) => f.severity === 'warning').map((f) => f.line),
  );
  const infoLines = new Set(
    findings.filter((f) => f.severity === 'info').map((f) => f.line),
  );

  useEffect(() => {
    if (highlightLine && containerRef.current) {
      const el = containerRef.current.querySelector(
        `[data-line="${highlightLine}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightLine]);

  function getLineClass(lineNum: number): string {
    const isHighlighted = highlightLine === lineNum;

    if (errorLines.has(lineNum)) {
      return `border-l-2 border-drift-error/60 bg-drift-error/[0.05] ${isHighlighted ? '!bg-drift-error/[0.15]' : ''}`;
    }
    if (warningLines.has(lineNum)) {
      return `border-l-2 border-drift-warning/60 bg-drift-warning/[0.04] ${isHighlighted ? '!bg-drift-warning/[0.12]' : ''}`;
    }
    if (infoLines.has(lineNum)) {
      return `border-l-2 border-drift-info/40 bg-drift-info/[0.03] ${isHighlighted ? '!bg-drift-info/[0.10]' : ''}`;
    }
    if (isHighlighted) {
      return 'bg-white/[0.04]';
    }
    return 'border-l-2 border-transparent';
  }

  function getLineIndicator(lineNum: number): string | null {
    if (errorLines.has(lineNum)) return '✗';
    if (warningLines.has(lineNum)) return '⚠';
    if (infoLines.has(lineNum)) return 'ℹ';
    return null;
  }

  return (
    <div ref={containerRef} className="font-[JetBrains_Mono] text-[0.8rem] leading-relaxed">
      {lines.map((line, i) => {
        const lineNum = i + 1;
        const indicator = getLineIndicator(lineNum);
        const findingsForLine = findings.filter((f) => f.line === lineNum);

        return (
          <div key={lineNum} data-line={lineNum}>
            <div
              className={`
                flex transition-colors duration-200
                ${getLineClass(lineNum)}
                hover:bg-white/[0.02]
              `}
            >
              <span className="w-12 shrink-0 text-right pr-3 select-none text-neutral-700 text-xs py-0.5">
                {indicator ? (
                  <span
                    className={
                      indicator === '✗'
                        ? 'text-drift-error'
                        : indicator === '⚠'
                          ? 'text-drift-warning'
                          : 'text-drift-info'
                    }
                  >
                    {indicator}
                  </span>
                ) : (
                  lineNum
                )}
              </span>
              <pre className="flex-1 whitespace-pre-wrap break-words text-neutral-400 py-0.5 px-3 overflow-hidden">
                {line || ' '}
              </pre>
            </div>

            {findingsForLine.length > 0 && (
              <div className="ml-12 pl-3 border-l-2 border-drift-error/30">
                {findingsForLine.map((f, fi) => (
                  <div
                    key={fi}
                    className={`
                      py-1 text-xs leading-relaxed
                      ${f.severity === 'error' ? 'text-drift-error/80' : f.severity === 'warning' ? 'text-drift-warning/80' : 'text-drift-info/70'}
                    `}
                  >
                    {f.message}
                    {f.suggestion && (
                      <span className="block text-neutral-600 mt-0.5">
                        → {f.suggestion}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
