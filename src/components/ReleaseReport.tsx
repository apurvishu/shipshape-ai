'use client';

import React from 'react';
import type { ReleaseReport } from '@/types';

interface ReleaseReportViewProps {
  report: ReleaseReport | null;
}

const riskColors: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
  medium: 'text-amber-400 bg-amber-500/15 border-amber-500/25',
  high: 'text-orange-400 bg-orange-500/15 border-orange-500/25',
  critical: 'text-red-400 bg-red-500/15 border-red-500/25',
};

export function ReleaseReportView({ report }: ReleaseReportViewProps) {
  if (!report) {
    return (
      <div className="glass-card p-6 text-center">
        <span className="text-3xl mb-2 block">📋</span>
        <p className="text-slate-400 text-sm">No release report generated yet.</p>
        <p className="text-slate-500 text-xs mt-1">Run the release pipeline to generate a report.</p>
      </div>
    );
  }

  const totalTests = report.testResults.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = report.testResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = report.testResults.reduce((sum, r) => sum + r.failed, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
        <span className="text-xl">📋</span> Release Report
        <span className="text-sm font-normal text-slate-400">v{report.version}</span>
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold text-indigo-400">{report.readinessScore}</p>
          <p className="text-xs text-slate-400 mt-1">Readiness Score</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{totalPassed}/{totalTests}</p>
          <p className="text-xs text-slate-400 mt-1">Tests Passing</p>
        </div>
        <div className={`glass-card p-3 text-center`}>
          <p className={`text-2xl font-bold ${totalFailed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {totalFailed}
          </p>
          <p className="text-xs text-slate-400 mt-1">Tests Failed</p>
        </div>
        <div className="glass-card p-3 text-center">
          <div className={`inline-flex px-2 py-1 rounded-full text-sm font-semibold border ${riskColors[report.riskLevel]}`}>
            {report.riskLevel.toUpperCase()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Risk Level</p>
        </div>
      </div>

      {/* Test Results */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Test Results</h3>
        <div className="space-y-2">
          {report.testResults.map(result => {
            const passRate = result.total > 0 ? (result.passed / result.total) * 100 : 0;
            return (
              <div key={result.suite} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-32 truncate">{result.suite}</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${passRate}%`,
                      background: passRate === 100
                        ? 'linear-gradient(90deg, #10b981, #22d3ee)'
                        : passRate >= 80
                        ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                        : 'linear-gradient(90deg, #ef4444, #f43f5e)',
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono w-20 text-right">
                  {result.passed}/{result.total} ({Math.round(passRate)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Summary */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Security Summary</h3>
        <div className="flex gap-4">
          {Object.entries(report.securitySummary).map(([severity, count]) => (
            <div key={severity} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                severity === 'critical' ? 'bg-red-400' :
                severity === 'high' ? 'bg-orange-400' :
                severity === 'medium' ? 'bg-amber-400' :
                'bg-blue-400'
              }`} />
              <span className="text-xs text-slate-400 capitalize">{severity}</span>
              <span className="text-sm font-semibold text-slate-200">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Release Notes */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Release Notes</h3>
        <ul className="space-y-1.5">
          {report.releaseNotes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Blockers */}
      {report.blockers.length > 0 && (
        <div className="glass-card p-4 border-red-500/20">
          <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <span>🚫</span> Release Blockers
          </h3>
          <ul className="space-y-1">
            {report.blockers.map((blocker, idx) => (
              <li key={idx} className="text-sm text-red-300/80 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Approval Status */}
      <div className={`glass-card p-4 ${report.approved ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{report.approved ? '✅' : '⏳'}</span>
          <div>
            <p className={`text-sm font-semibold ${report.approved ? 'text-emerald-400' : 'text-amber-400'}`}>
              {report.approved ? 'Release Approved' : 'Awaiting Approval'}
            </p>
            {report.approved && report.approvedBy && (
              <p className="text-xs text-slate-400">
                Approved by {report.approvedBy} at {report.approvedAt ? new Date(report.approvedAt).toLocaleString() : 'N/A'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
