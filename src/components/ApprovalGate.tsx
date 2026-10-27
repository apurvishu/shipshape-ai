'use client';

import React from 'react';
import type { ApprovalGate, LifecycleStage, SecurityFinding } from '@/types';
import { canPromoteToProduction } from '@/lib/readiness';

interface ApprovalGateViewProps {
  gates: ApprovalGate[];
  stages: LifecycleStage[];
  findings: SecurityFinding[];
  onApprove: (gateId: string) => void;
  onReject: (gateId: string) => void;
}

const gateStatusConfig: Record<string, { icon: string; color: string; bg: string }> = {
  approved: { icon: '✓', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  pending: { icon: '◷', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  rejected: { icon: '✗', color: 'text-red-400', bg: 'bg-red-500/15' },
};

export function ApprovalGateView({ gates, stages, findings, onApprove, onReject }: ApprovalGateViewProps) {
  const promotion = canPromoteToProduction(stages, gates, findings);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
        <span className="text-xl">🏛️</span> Approval Gates
      </h2>

      {/* Gates list */}
      <div className="space-y-2">
        {gates.map(gate => {
          const config = gateStatusConfig[gate.status] || gateStatusConfig.pending;
          return (
            <div key={gate.id} className="glass-card p-4 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                <span className={`${config.color} text-sm font-bold`}>{config.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{gate.name}</span>
                  {gate.required && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                {gate.approver && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gate.status === 'approved' ? 'Approved by' : 'Rejected by'} {gate.approver}
                    {gate.timestamp && ` · ${new Date(gate.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                )}
                {gate.reason && gate.status === 'pending' && (
                  <p className="text-xs text-slate-500 mt-0.5">{gate.reason}</p>
                )}
              </div>
              {gate.status === 'pending' && gate.id === 'gate-manual' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    id={`approve-${gate.id}`}
                    onClick={() => onApprove(gate.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    aria-label={`Approve ${gate.name}`}
                  >
                    Approve
                  </button>
                  <button
                    id={`reject-${gate.id}`}
                    onClick={() => onReject(gate.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors cursor-pointer"
                    aria-label={`Reject ${gate.name}`}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Production promotion status */}
      <div className={`glass-card p-4 ${promotion.allowed ? 'border-emerald-500/30 animate-pulse-glow' : 'border-red-500/20'}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{promotion.allowed ? '🚀' : '🚫'}</span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${promotion.allowed ? 'text-emerald-400' : 'text-red-400'}`}>
              {promotion.allowed
                ? 'Ready for Production Promotion'
                : 'Production Promotion Blocked'}
            </p>
            {!promotion.allowed && (
              <ul className="mt-2 space-y-1">
                {promotion.blockers.map((blocker, idx) => (
                  <li key={idx} className="text-xs text-red-300/70 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{blocker}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
