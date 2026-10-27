'use client';

import React, { useState } from 'react';
import type { Pipeline } from '@/types';

interface PipelineHistoryProps {
  pipelines: Pipeline[];
}

const pipelineStatusConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  success: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Passed', icon: '✓' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/15', label: 'Failed', icon: '✗' },
  running: { color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Running', icon: '⟳' },
  pending: { color: 'text-violet-400', bg: 'bg-violet-500/15', label: 'Pending', icon: '◷' },
  canceled: { color: 'text-slate-400', bg: 'bg-slate-500/15', label: 'Canceled', icon: '⊘' },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function PipelineHistory({ pipelines }: PipelineHistoryProps) {
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);

  if (pipelines.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <span className="text-3xl mb-2 block">🔍</span>
        <p className="text-slate-400 text-sm">No pipeline history available.</p>
        <p className="text-slate-500 text-xs mt-1">Push code to trigger a pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
        <span className="text-xl">📜</span> Pipeline History
      </h2>
      <div className="space-y-2">
        {pipelines.map(pipeline => {
          const config = pipelineStatusConfig[pipeline.status] || pipelineStatusConfig.pending;
          const isExpanded = expandedPipeline === pipeline.id;
          return (
            <div key={pipeline.id} className="glass-card overflow-hidden">
              <button
                id={`pipeline-${pipeline.id}`}
                onClick={() => setExpandedPipeline(isExpanded ? null : pipeline.id)}
                className="w-full flex items-center gap-4 p-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                aria-expanded={isExpanded}
              >
                <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                  <span className={`${config.color} text-sm font-bold`}>{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      #{pipeline.id.replace('demo-pipe-', '')}
                    </span>
                    <span className={`badge ${pipeline.status === 'success' ? 'badge-pass' : pipeline.status === 'failed' ? 'badge-fail' : 'badge-info'}`}>
                      {config.label}
                    </span>
                    {pipeline.source === 'demo' && (
                      <span className="text-[10px] font-medium text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="font-mono">{pipeline.ref}</span>
                    <span>•</span>
                    <span className="font-mono">{pipeline.sha}</span>
                    {pipeline.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(pipeline.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 shrink-0">
                  {formatTimestamp(pipeline.createdAt)}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-700/50 p-4 animate-fade-in">
                  <div className="grid gap-2">
                    {pipeline.jobs.map(job => {
                      const jobConfig = pipelineStatusConfig[job.status] || pipelineStatusConfig.pending;
                      return (
                        <div
                          key={job.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30"
                        >
                          <span className={`${jobConfig.color} text-xs font-bold w-4 text-center`}>
                            {jobConfig.icon}
                          </span>
                          <span className="text-sm text-slate-300 font-medium flex-1">{job.name}</span>
                          <span className="text-xs text-slate-500">{job.stage}</span>
                          {job.duration !== undefined && job.duration > 0 && (
                            <span className="text-xs text-slate-400 font-mono">
                              {formatDuration(job.duration)}
                            </span>
                          )}
                          {job.artifacts && job.artifacts.length > 0 && (
                            <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                              📎 {job.artifacts.length} artifact{job.artifacts.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
