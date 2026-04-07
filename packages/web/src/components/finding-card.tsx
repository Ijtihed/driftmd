'use client';

import { useState } from 'react';
import type { Finding } from 'driftmd-core';

interface FindingCardProps {
  finding: Finding;
  index: number;
  onHoverLine: (line: number | null) => void;
}

const SEVERITY_STYLES = {
  error: {
    border: 'border-drift-error/30',
    hoverBorder: 'hover:border-drift-error/50',
    icon: '✗',
    iconColor: 'text-drift-error',
    label: 'ERROR',
    labelColor: 'text-drift-error/90',
  },
  warning: {
    border: 'border-drift-warning/25',
    hoverBorder: 'hover:border-drift-warning/45',
    icon: '⚠',
    iconColor: 'text-drift-warning',
    label: 'WARN',
    labelColor: 'text-drift-warning/90',
  },
  info: {
    border: 'border-drift-info/20',
    hoverBorder: 'hover:border-drift-info/35',
    icon: 'ℹ',
    iconColor: 'text-drift-info',
    label: 'INFO',
    labelColor: 'text-drift-info/80',
  },
} as const;

const TYPE_LABELS: Record<string, string> = {
  'file-reference': 'file ref',
  'internal-link': 'link',
  'dir-tree': 'dir tree',
  'cli-flag': 'cli flag',
  'env-var': 'env var',
  badge: 'badge',
  signature: 'signature',
};

export default function FindingCard({ finding, index, onHoverLine }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLES[finding.severity];

  return (
    <div
      className={`
        border ${style.border} ${style.hoverBorder}
        transition-all duration-300 cursor-pointer
        hover:bg-neutral-950
      `}
      onMouseEnter={() => finding.line > 0 && onHoverLine(finding.line)}
      onMouseLeave={() => onHoverLine(null)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span className={`${style.iconColor} text-base`}>{style.icon}</span>
            <span className={`font-[JetBrains_Mono] text-[0.65rem] uppercase tracking-widest ${style.labelColor}`}>
              {style.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-[JetBrains_Mono] text-xs text-neutral-600 uppercase tracking-wide">
              {TYPE_LABELS[finding.type] || finding.type}
            </span>
            {finding.line > 0 && (
              <span className="font-[JetBrains_Mono] text-xs text-neutral-500 tabular-nums">
                L{finding.line}
              </span>
            )}
          </div>
        </div>

        <p className="font-[JetBrains_Mono] text-[0.8rem] text-neutral-300 leading-relaxed">
          {finding.message}
        </p>

        {expanded && (
          <div className="mt-4 pt-3 border-t border-neutral-800 space-y-3">
            {finding.suggestion && (
              <div>
                <p className="font-[JetBrains_Mono] text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Suggestion
                </p>
                <p className="font-[JetBrains_Mono] text-sm text-neutral-400">
                  {finding.suggestion}
                </p>
              </div>
            )}
            {finding.source && (
              <div>
                <p className="font-[JetBrains_Mono] text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Source
                </p>
                <p className="font-[JetBrains_Mono] text-sm text-neutral-400">
                  {finding.source}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
