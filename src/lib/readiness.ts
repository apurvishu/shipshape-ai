/**
 * Calculates the release-readiness score based on actual check results.
 * The score is deterministic — given the same inputs, it always returns the same score.
 * No random values are used.
 */

import type { LifecycleStage, Check, SecurityFinding, ApprovalGate } from '@/types';

interface ScoreBreakdown {
  totalScore: number;
  maxScore: number;
  percentage: number;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    details: string;
  }[];
}

/**
 * Calculates a weighted readiness score from lifecycle stages, security findings,
 * and approval gates. The score reflects actual check results.
 */
export function calculateReadinessScore(
  stages: LifecycleStage[],
  findings: SecurityFinding[],
  gates: ApprovalGate[]
): ScoreBreakdown {
  const categories: ScoreBreakdown['categories'] = [];

  // 1. Mandatory checks (40 points max)
  const mandatoryChecks = stages.flatMap(s => s.checks.filter(c => c.mandatory));
  const mandatoryPassed = mandatoryChecks.filter(c => c.status === 'pass').length;
  const mandatoryTotal = mandatoryChecks.length;
  const mandatoryScore = mandatoryTotal > 0
    ? Math.round((mandatoryPassed / mandatoryTotal) * 40)
    : 40;
  categories.push({
    name: 'Mandatory Checks',
    score: mandatoryScore,
    maxScore: 40,
    details: `${mandatoryPassed}/${mandatoryTotal} mandatory checks passing`,
  });

  // 2. Security posture (25 points max)
  const openFindings = findings.filter(f => f.status === 'open');
  const criticalCount = openFindings.filter(f => f.severity === 'critical').length;
  const highCount = openFindings.filter(f => f.severity === 'high').length;
  const mediumCount = openFindings.filter(f => f.severity === 'medium').length;
  let securityScore = 25;
  securityScore -= criticalCount * 25; // any critical = 0
  securityScore -= highCount * 10;
  securityScore -= mediumCount * 3;
  securityScore = Math.max(0, securityScore);
  categories.push({
    name: 'Security Posture',
    score: securityScore,
    maxScore: 25,
    details: `${openFindings.length} open findings (${criticalCount} critical, ${highCount} high)`,
  });

  // 3. Optional checks (15 points max)
  const optionalChecks = stages.flatMap(s => s.checks.filter(c => !c.mandatory));
  const optionalPassed = optionalChecks.filter(c => c.status === 'pass').length;
  const optionalTotal = optionalChecks.length;
  const optionalScore = optionalTotal > 0
    ? Math.round((optionalPassed / optionalTotal) * 15)
    : 15;
  categories.push({
    name: 'Optional Checks',
    score: optionalScore,
    maxScore: 15,
    details: `${optionalPassed}/${optionalTotal} optional checks passing`,
  });

  // 4. Approval gates (20 points max)
  const requiredGates = gates.filter(g => g.required);
  const approvedGates = requiredGates.filter(g => g.status === 'approved').length;
  const totalGates = requiredGates.length;
  const gateScore = totalGates > 0
    ? Math.round((approvedGates / totalGates) * 20)
    : 20;
  categories.push({
    name: 'Approval Gates',
    score: gateScore,
    maxScore: 20,
    details: `${approvedGates}/${totalGates} required gates approved`,
  });

  const totalScore = mandatoryScore + securityScore + optionalScore + gateScore;
  const maxScore = 100;

  return {
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    categories,
  };
}

/**
 * Returns the stage's aggregated status from its checks.
 */
export function getStageStatus(checks: Check[]): Check['status'] {
  if (checks.length === 0) return 'pending';
  if (checks.some(c => c.status === 'fail' && c.mandatory)) return 'fail';
  if (checks.some(c => c.status === 'fail')) return 'warn';
  if (checks.some(c => c.status === 'warn')) return 'warn';
  if (checks.some(c => c.status === 'pending' && c.mandatory)) return 'pending';
  if (checks.every(c => c.status === 'pass' || c.status === 'skipped')) return 'pass';
  return 'pending';
}

/**
 * Determines risk level from security findings.
 */
export function getRiskLevel(findings: SecurityFinding[]): 'low' | 'medium' | 'high' | 'critical' {
  const open = findings.filter(f => f.status === 'open');
  if (open.some(f => f.severity === 'critical')) return 'critical';
  if (open.some(f => f.severity === 'high')) return 'high';
  if (open.filter(f => f.severity === 'medium').length >= 3) return 'high';
  if (open.some(f => f.severity === 'medium')) return 'medium';
  return 'low';
}

/**
 * Checks whether all mandatory gates are approved and all mandatory checks pass,
 * meaning the release can be promoted to production.
 */
export function canPromoteToProduction(
  stages: LifecycleStage[],
  gates: ApprovalGate[],
  findings: SecurityFinding[]
): { allowed: boolean; blockers: string[] } {
  const blockers: string[] = [];

  // Check mandatory checks
  const failedMandatory = stages
    .flatMap(s => s.checks)
    .filter(c => c.mandatory && c.status !== 'pass');

  if (failedMandatory.length > 0) {
    blockers.push(
      `${failedMandatory.length} mandatory check(s) have not passed: ${failedMandatory.map(c => c.name).join(', ')}`
    );
  }

  // Check critical/high security findings
  const criticalFindings = findings.filter(
    f => f.status === 'open' && (f.severity === 'critical' || f.severity === 'high')
  );
  if (criticalFindings.length > 0) {
    blockers.push(
      `${criticalFindings.length} critical/high security finding(s) are unresolved`
    );
  }

  // Check required approval gates
  const pendingGates = gates.filter(g => g.required && g.status !== 'approved');
  if (pendingGates.length > 0) {
    blockers.push(
      `${pendingGates.length} required approval gate(s) are pending: ${pendingGates.map(g => g.name).join(', ')}`
    );
  }

  return {
    allowed: blockers.length === 0,
    blockers,
  };
}
