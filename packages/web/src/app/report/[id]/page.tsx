'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ReadmeViewer from '@/components/readme-viewer';
import FindingCard from '@/components/finding-card';
import type { DriftReport } from '@driftmd/core';

interface CachedReport {
  id: string;
  repoUrl: string;
  report: DriftReport;
  readmeContent: string;
  createdAt: string;
}

type FilterType = 'all' | 'error' | 'warning' | 'info';

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CachedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/report?id=${id}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Report not found');
        }
        const d = await res.json();
        setData(d);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-3xl text-neutral-600 animate-spin">
              progress_activity
            </span>
            <p className="mt-4 font-[JetBrains_Mono] text-sm text-neutral-500 uppercase tracking-wider">
              Loading report...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-[Manrope] text-3xl font-light text-white mb-4">
              Report not found
            </h2>
            <p className="font-[JetBrains_Mono] text-sm text-neutral-500">
              {error || 'This report may have expired.'}
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { report, readmeContent, repoUrl } = data;
  const repoName = repoUrl.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');

  const filteredFindings = report.findings.filter(
    (f) => filter === 'all' || f.severity === filter,
  );

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: report.summary.total },
    { key: 'error', label: 'Errors', count: report.summary.errors },
    { key: 'warning', label: 'Warnings', count: report.summary.warnings },
    { key: 'info', label: 'Info', count: report.summary.info },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-8 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-baseline gap-4 mb-1">
            <h1 className="font-[Manrope] text-3xl sm:text-4xl font-light text-white tracking-tight">
              {repoName}
            </h1>
            {report.hasErrors ? (
              <span className="font-[JetBrains_Mono] text-xs uppercase tracking-wider text-drift-error">
                drift detected
              </span>
            ) : (
              <span className="font-[JetBrains_Mono] text-xs uppercase tracking-wider text-drift-ok">
                in sync
              </span>
            )}
          </div>
          <p className="font-[JetBrains_Mono] text-xs text-neutral-500 tracking-wide">
            Scanned in {Math.round(report.duration)}ms
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  px-5 py-2.5 border font-[JetBrains_Mono] text-xs uppercase tracking-wider
                  transition-colors duration-300
                  ${filter === f.key
                    ? 'text-white border-neutral-500'
                    : 'text-neutral-500 border-neutral-800 hover:text-white hover:border-neutral-600'
                  }
                `}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-neutral-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-[JetBrains_Mono] text-xs text-neutral-400 uppercase tracking-wider">
                README.md
              </span>
              <span className="font-[JetBrains_Mono] text-xs text-neutral-600">
                {readmeContent.split('\n').length} lines
              </span>
            </div>
            <div className="max-h-[75vh] overflow-y-auto">
              <ReadmeViewer
                content={readmeContent}
                findings={report.findings}
                highlightLine={highlightLine}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="px-1 mb-3">
              <span className="font-[JetBrains_Mono] text-xs text-neutral-500 uppercase tracking-[0.2em]">
                Findings
              </span>
            </div>

            {filteredFindings.length === 0 ? (
              <div className="border border-neutral-800 p-10 text-center">
                <p className="font-[JetBrains_Mono] text-sm text-neutral-500">
                  {filter === 'all' ? 'No drift detected' : `No ${filter} findings`}
                </p>
              </div>
            ) : (
              filteredFindings.map((finding, i) => (
                <FindingCard
                  key={`${finding.type}-${finding.line}-${i}`}
                  finding={finding}
                  index={i}
                  onHoverLine={(line) => setHighlightLine(line)}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
