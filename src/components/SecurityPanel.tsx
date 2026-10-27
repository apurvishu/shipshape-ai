'use client';

import React, { useState } from 'react';
import type { SecurityFinding, Severity } from '@/types';

interface SecurityPanelProps {
  findings: SecurityFinding[];
}

const severityConfig: Record<Severity, { color: string; bg: string; border: string; label: string; weight: number }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/25', label: 'Critical', weight: 4 },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/25', label: 'High', weight: 3 },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/25', label: 'Medium', weight: 2 },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/25', label: 'Low', weight: 1 },
  info: { color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/25', label: 'Info', weight: 0 },
};

export function SecurityPanel({ findings }: SecurityPanelProps) {
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');

  const filtered = findings
    .filter(f => filterStatus === 'all' || f.status === filterStatus)
    .sort((a, b) => severityConfig[b.severity].weight - severityConfig[a.severity].weight);

  const openCount = findings.filter(f => f.status === 'open').length;
  const resolvedCount = findings.filter(f => f.status === 'resolved').length;

  if (findings.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <span className="text-3xl mb-2 block">🛡️</span>
        <p className="text-emerald-400 text-sm font-medium">No security findings</p>
        <p className="text-slate-500 text-xs mt-1">All scans passed without findings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <span className="text-xl">🛡️</span> Security Findings
        </h2>
        <div className="flex gap-1">
          {(['all', 'open', 'resolved'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-3 py-1 rounded-full transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
              }`}
            >
              {status === 'all' ? `All (${findings.length})` :
               status === 'open' ? `Open (${openCount})` :
               `Resolved (${resolvedCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(finding => {
          const config = severityConfig[finding.severity];
          const isExpanded = expandedFinding === finding.id;
          return (
            <div key={finding.id} className="glass-card overflow-hidden">
              <button
                id={`finding-${finding.id}`}
                onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                aria-expanded={isExpanded}
              >
                <span className={`badge ${config.bg} ${config.color} border ${config.border}`}>
                  {config.label}
                </span>
                <span className="text-sm text-slate-200 flex-1 truncate">{finding.title}</span>
                {finding.status === 'resolved' && (
                  <span className="badge badge-pass text-[10px]">Resolved</span>
                )}
                {finding.source === 'demo' && (
                  <span className="text-[10px] font-medium text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    DEMO
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-700/50 p-4 space-y-3 animate-fade-in">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Description</h4>
                    <p className="text-sm text-slate-300">{finding.description}</p>
                  </div>
                  {finding.location && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Location</h4>
                      <code className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded font-mono">
                        {finding.location}
                      </code>
                    </div>
                  )}
                  {finding.cveId && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">CVE</h4>
                      <span className="text-xs text-cyan-400 font-mono">{finding.cveId}</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Remediation</h4>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <p className="text-sm text-emerald-300">{finding.remediation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="glass-card p-4 text-center text-slate-400 text-sm">
            No findings match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
