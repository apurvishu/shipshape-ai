'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ScoreRing } from '@/components/ScoreRing';
import { LifecycleView } from '@/components/LifecycleView';
import { PipelineHistory } from '@/components/PipelineHistory';
import { SecurityPanel } from '@/components/SecurityPanel';
import { ReleaseReportView } from '@/components/ReleaseReport';
import { ApprovalGateView } from '@/components/ApprovalGate';
import { calculateReadinessScore } from '@/lib/readiness';
import {
  DEMO_STAGES,
  DEMO_PIPELINES,
  DEMO_SECURITY_FINDINGS,
  DEMO_RELEASE_REPORT,
  DEMO_APPROVAL_GATES,
} from '@/data/demo-data';
import type { ApprovalGate, ReleaseReport } from '@/types';

type Tab = 'lifecycle' | 'pipelines' | 'security' | 'release' | 'approval';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'lifecycle', label: 'Lifecycle', icon: '🔄' },
  { id: 'pipelines', label: 'Pipelines', icon: '📜' },
  { id: 'security', label: 'Security', icon: '🛡️' },
  { id: 'release', label: 'Release', icon: '📋' },
  { id: 'approval', label: 'Approval', icon: '🏛️' },
];

export default function Dashboard() {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('lifecycle');
  const [approvalGates, setApprovalGates] = useState<ApprovalGate[]>(DEMO_APPROVAL_GATES);
  const [releaseReport, setReleaseReport] = useState<ReleaseReport>(DEMO_RELEASE_REPORT);

  // Use demo data when demo mode is on; empty data otherwise
  const stages = useMemo(() => (isDemoMode ? DEMO_STAGES : []), [isDemoMode]);
  const pipelines = useMemo(() => (isDemoMode ? DEMO_PIPELINES : []), [isDemoMode]);
  const findings = useMemo(() => (isDemoMode ? DEMO_SECURITY_FINDINGS : []), [isDemoMode]);
  const gates = useMemo(() => (isDemoMode ? approvalGates : []), [isDemoMode, approvalGates]);
  const report = useMemo(() => (isDemoMode ? releaseReport : null), [isDemoMode, releaseReport]);

  // Calculate readiness score from actual data
  const scoreBreakdown = useMemo(
    () => calculateReadinessScore(stages, findings, gates),
    [stages, findings, gates]
  );

  const handleApprove = useCallback((gateId: string) => {
    setApprovalGates(prev =>
      prev.map(g =>
        g.id === gateId
          ? { ...g, status: 'approved' as const, approver: 'Demo User', timestamp: new Date().toISOString() }
          : g
      )
    );
    setReleaseReport(prev => ({
      ...prev,
      approved: true,
      approvedBy: 'Demo User',
      approvedAt: new Date().toISOString(),
      blockers: [],
    }));
  }, []);

  const handleReject = useCallback((gateId: string) => {
    setApprovalGates(prev =>
      prev.map(g =>
        g.id === gateId
          ? { ...g, status: 'rejected' as const, approver: 'Demo User', timestamp: new Date().toISOString(), reason: 'Rejected during demo' }
          : g
      )
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="demo-banner flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Demo Mode</strong> — All data shown below is sample data, not real CI results.
          </span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#2a3050] bg-[#0d1221]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                ⛵
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">ShipShape AI</h1>
                <p className="text-[11px] text-slate-500 -mt-0.5">Release Readiness Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Demo mode toggle */}
              <label
                htmlFor="demo-toggle"
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-xs text-slate-400">Demo Mode</span>
                <div className="relative">
                  <input
                    id="demo-toggle"
                    type="checkbox"
                    checked={isDemoMode}
                    onChange={(e) => setIsDemoMode(e.target.checked)}
                    className="sr-only peer"
                    aria-label="Toggle demo mode"
                  />
                  <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-indigo-500/40 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-slate-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-indigo-400 transition-all" />
                </div>
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Score + Summary row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Score ring */}
          <div className="md:col-span-3 glass-card p-6 flex flex-col items-center justify-center">
            <ScoreRing
              score={scoreBreakdown.percentage}
              label="Release Readiness"
            />
          </div>

          {/* Score breakdown */}
          <div className="md:col-span-5 glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Score Breakdown
            </h2>
            <div className="space-y-3">
              {scoreBreakdown.categories.map(cat => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{cat.name}</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {cat.score}/{cat.maxScore}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0}%`,
                        background:
                          cat.score === cat.maxScore
                            ? 'linear-gradient(90deg, #10b981, #22d3ee)'
                            : cat.score >= cat.maxScore * 0.7
                            ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                            : 'linear-gradient(90deg, #ef4444, #f43f5e)',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{cat.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="md:col-span-4 grid grid-cols-2 gap-3">
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-indigo-400">
                {stages.length}
              </span>
              <span className="text-xs text-slate-400 mt-1">Lifecycle Stages</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-cyan-400">
                {pipelines.length}
              </span>
              <span className="text-xs text-slate-400 mt-1">Pipelines</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-bold ${findings.filter(f => f.status === 'open').length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {findings.filter(f => f.status === 'open').length}
              </span>
              <span className="text-xs text-slate-400 mt-1">Open Findings</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-bold ${gates.filter(g => g.required && g.status === 'approved').length === gates.filter(g => g.required).length ? 'text-emerald-400' : 'text-amber-400'}`}>
                {gates.filter(g => g.required && g.status === 'approved').length}/{gates.filter(g => g.required).length}
              </span>
              <span className="text-xs text-slate-400 mt-1">Gates Approved</span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 border-b border-slate-700/50" aria-label="Dashboard sections">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all cursor-pointer whitespace-nowrap
                ${activeTab === tab.id
                  ? 'text-indigo-300 bg-indigo-500/10 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.02]'
                }
              `}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="animate-fade-in" key={activeTab}>
          {!isDemoMode && (
            <div className="glass-card p-8 text-center mb-6">
              <span className="text-4xl mb-3 block">🔌</span>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">No Data Available</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Connect your GitLab project to see real CI/CD data. Enable Demo Mode to explore the dashboard with sample data.
              </p>
              <button
                onClick={() => setIsDemoMode(true)}
                className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors cursor-pointer"
              >
                Enable Demo Mode
              </button>
            </div>
          )}

          {isDemoMode && (
            <>
              {activeTab === 'lifecycle' && <LifecycleView stages={stages} />}
              {activeTab === 'pipelines' && <PipelineHistory pipelines={pipelines} />}
              {activeTab === 'security' && <SecurityPanel findings={findings} />}
              {activeTab === 'release' && <ReleaseReportView report={report} />}
              {activeTab === 'approval' && (
                <ApprovalGateView
                  gates={gates}
                  stages={stages}
                  findings={findings}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a3050] py-4 text-center text-xs text-slate-500">
        <p>
          ShipShape AI — Built for the GitLab Transcend Hackathon &quot;Life After Code&quot;
        </p>
        <p className="mt-1">
          Demonstrating the path from code to production at the speed of imagination
        </p>
      </footer>
    </div>
  );
}
