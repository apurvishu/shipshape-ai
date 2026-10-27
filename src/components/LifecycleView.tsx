'use client';

import React, { useState } from 'react';
import type { LifecycleStage, Check } from '@/types';

interface LifecycleViewProps {
  stages: LifecycleStage[];
}

const statusConfig: Record<Check['status'], { color: string; bg: string; border: string; icon: string }> = {
  pass: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', icon: '✓' },
  fail: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/25', icon: '✗' },
  warn: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/25', icon: '⚠' },
  pending: { color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25', icon: '◷' },
  skipped: { color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/25', icon: '—' },
};

function CheckItem({ check }: { check: Check }) {
  const config = statusConfig[check.status];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border} transition-all duration-200 hover:scale-[1.01]`}>
      <span className={`${config.color} text-sm font-bold mt-0.5 min-w-[16px] text-center`} aria-hidden="true">
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200">{check.name}</span>
          {check.mandatory && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{check.description}</p>
        {check.details && (
          <p className={`text-xs mt-1 ${config.color} opacity-80`}>{check.details}</p>
        )}
      </div>
    </div>
  );
}

export function LifecycleView({ stages }: LifecycleViewProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
        <span className="text-xl">🔄</span> DevSecOps Lifecycle
      </h2>

      {/* Stage pipeline visualization */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
        {stages.map((stage, idx) => {
          const config = statusConfig[stage.status];
          const isExpanded = expandedStage === stage.id;
          return (
            <React.Fragment key={stage.id}>
              {idx > 0 && (
                <div className="w-4 h-0.5 bg-slate-700 shrink-0" aria-hidden="true" />
              )}
              <button
                id={`stage-${stage.id}`}
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-300 cursor-pointer shrink-0
                  ${isExpanded
                    ? 'bg-indigo-500/15 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : `${config.bg} ${config.border} hover:border-indigo-500/30`
                  }
                `}
                aria-expanded={isExpanded}
                aria-controls={`stage-details-${stage.id}`}
              >
                <span className="text-lg" aria-hidden="true">{stage.icon}</span>
                <span className="text-[11px] font-medium text-slate-300 whitespace-nowrap">{stage.name}</span>
                <span className={`text-[10px] font-bold ${config.color}`}>{config.icon}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Expanded stage details */}
      {expandedStage && (() => {
        const stage = stages.find(s => s.id === expandedStage);
        if (!stage) return null;
        return (
          <div
            id={`stage-details-${stage.id}`}
            className="glass-card p-4 animate-fade-in"
            role="region"
            aria-label={`${stage.name} stage details`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{stage.icon}</span>
              <div>
                <h3 className="text-base font-semibold text-slate-200">{stage.name}</h3>
                <p className="text-xs text-slate-400">{stage.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              {stage.checks.map(check => (
                <CheckItem key={check.id} check={check} />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
