import {
  calculateReadinessScore,
  getStageStatus,
  getRiskLevel,
  canPromoteToProduction,
} from '@/lib/readiness';
import type { LifecycleStage, SecurityFinding, ApprovalGate, Check } from '@/types';
import {
  DEMO_STAGES,
  DEMO_SECURITY_FINDINGS,
  DEMO_APPROVAL_GATES,
} from '@/data/demo-data';

describe('calculateReadinessScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = calculateReadinessScore(DEMO_STAGES, DEMO_SECURITY_FINDINGS, DEMO_APPROVAL_GATES);
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });

  it('returns a deterministic score for the same inputs', () => {
    const result1 = calculateReadinessScore(DEMO_STAGES, DEMO_SECURITY_FINDINGS, DEMO_APPROVAL_GATES);
    const result2 = calculateReadinessScore(DEMO_STAGES, DEMO_SECURITY_FINDINGS, DEMO_APPROVAL_GATES);
    expect(result1.percentage).toBe(result2.percentage);
    expect(result1.totalScore).toBe(result2.totalScore);
  });

  it('returns max score when all checks pass and no findings', () => {
    const allPassStages: LifecycleStage[] = [
      {
        id: 'verify',
        name: 'Verify',
        icon: '✅',
        description: 'Test',
        status: 'pass',
        checks: [
          { id: '1', name: 'Test', description: 'Test', status: 'pass', mandatory: true },
        ],
      },
    ];
    const noFindings: SecurityFinding[] = [];
    const allApproved: ApprovalGate[] = [
      { id: '1', name: 'Gate', required: true, status: 'approved' },
    ];

    const result = calculateReadinessScore(allPassStages, noFindings, allApproved);
    expect(result.percentage).toBe(100);
  });

  it('reduces score for failed mandatory checks', () => {
    const failedStages: LifecycleStage[] = [
      {
        id: 'verify',
        name: 'Verify',
        icon: '✅',
        description: 'Test',
        status: 'fail',
        checks: [
          { id: '1', name: 'Test', description: 'Test', status: 'fail', mandatory: true },
          { id: '2', name: 'Lint', description: 'Lint', status: 'pass', mandatory: true },
        ],
      },
    ];

    const result = calculateReadinessScore(failedStages, [], []);
    expect(result.categories.find(c => c.name === 'Mandatory Checks')!.score).toBe(20);
  });

  it('reduces score for critical security findings', () => {
    const criticalFinding: SecurityFinding[] = [
      {
        id: '1',
        title: 'Critical vuln',
        severity: 'critical',
        category: 'Dep',
        description: 'Bad',
        remediation: 'Fix it',
        status: 'open',
        source: 'ci',
      },
    ];

    const result = calculateReadinessScore([], criticalFinding, []);
    expect(result.categories.find(c => c.name === 'Security Posture')!.score).toBe(0);
  });

  it('provides correct category breakdown', () => {
    const result = calculateReadinessScore(DEMO_STAGES, DEMO_SECURITY_FINDINGS, DEMO_APPROVAL_GATES);
    expect(result.categories).toHaveLength(4);
    expect(result.categories.map(c => c.name)).toEqual([
      'Mandatory Checks',
      'Security Posture',
      'Optional Checks',
      'Approval Gates',
    ]);
  });

  it('does not count resolved findings against score', () => {
    const resolvedFinding: SecurityFinding[] = [
      {
        id: '1',
        title: 'Resolved',
        severity: 'critical',
        category: 'Dep',
        description: 'Was bad',
        remediation: 'Fixed',
        status: 'resolved',
        source: 'ci',
      },
    ];

    const result = calculateReadinessScore([], resolvedFinding, []);
    expect(result.categories.find(c => c.name === 'Security Posture')!.score).toBe(25);
  });
});

describe('getStageStatus', () => {
  it('returns "pending" for empty checks', () => {
    expect(getStageStatus([])).toBe('pending');
  });

  it('returns "fail" when a mandatory check fails', () => {
    const checks: Check[] = [
      { id: '1', name: 'A', description: '', status: 'pass', mandatory: true },
      { id: '2', name: 'B', description: '', status: 'fail', mandatory: true },
    ];
    expect(getStageStatus(checks)).toBe('fail');
  });

  it('returns "warn" when an optional check fails', () => {
    const checks: Check[] = [
      { id: '1', name: 'A', description: '', status: 'pass', mandatory: true },
      { id: '2', name: 'B', description: '', status: 'fail', mandatory: false },
    ];
    expect(getStageStatus(checks)).toBe('warn');
  });

  it('returns "pass" when all checks pass', () => {
    const checks: Check[] = [
      { id: '1', name: 'A', description: '', status: 'pass', mandatory: true },
      { id: '2', name: 'B', description: '', status: 'pass', mandatory: false },
    ];
    expect(getStageStatus(checks)).toBe('pass');
  });

  it('returns "pending" when mandatory check is pending', () => {
    const checks: Check[] = [
      { id: '1', name: 'A', description: '', status: 'pass', mandatory: true },
      { id: '2', name: 'B', description: '', status: 'pending', mandatory: true },
    ];
    expect(getStageStatus(checks)).toBe('pending');
  });
});

describe('getRiskLevel', () => {
  it('returns "low" with no open findings', () => {
    expect(getRiskLevel([])).toBe('low');
  });

  it('returns "critical" with critical findings', () => {
    const findings: SecurityFinding[] = [
      { id: '1', title: 'A', severity: 'critical', category: '', description: '', remediation: '', status: 'open', source: 'ci' },
    ];
    expect(getRiskLevel(findings)).toBe('critical');
  });

  it('returns "high" with high findings', () => {
    const findings: SecurityFinding[] = [
      { id: '1', title: 'A', severity: 'high', category: '', description: '', remediation: '', status: 'open', source: 'ci' },
    ];
    expect(getRiskLevel(findings)).toBe('high');
  });

  it('returns "medium" with single medium finding', () => {
    const findings: SecurityFinding[] = [
      { id: '1', title: 'A', severity: 'medium', category: '', description: '', remediation: '', status: 'open', source: 'ci' },
    ];
    expect(getRiskLevel(findings)).toBe('medium');
  });

  it('ignores resolved findings', () => {
    const findings: SecurityFinding[] = [
      { id: '1', title: 'A', severity: 'critical', category: '', description: '', remediation: '', status: 'resolved', source: 'ci' },
    ];
    expect(getRiskLevel(findings)).toBe('low');
  });
});

describe('canPromoteToProduction', () => {
  it('blocks when mandatory checks fail', () => {
    const stages: LifecycleStage[] = [
      {
        id: 'verify', name: 'V', icon: '', description: '', status: 'fail',
        checks: [{ id: '1', name: 'Lint', description: '', status: 'fail', mandatory: true }],
      },
    ];
    const result = canPromoteToProduction(stages, [], []);
    expect(result.allowed).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('blocks when critical/high findings exist', () => {
    const findings: SecurityFinding[] = [
      { id: '1', title: 'A', severity: 'critical', category: '', description: '', remediation: '', status: 'open', source: 'ci' },
    ];
    const result = canPromoteToProduction([], [], findings);
    expect(result.allowed).toBe(false);
  });

  it('blocks when required gates are pending', () => {
    const gates: ApprovalGate[] = [
      { id: '1', name: 'Manual Approval', required: true, status: 'pending' },
    ];
    const result = canPromoteToProduction([], gates, []);
    expect(result.allowed).toBe(false);
  });

  it('allows when everything passes', () => {
    const stages: LifecycleStage[] = [
      {
        id: 'verify', name: 'V', icon: '', description: '', status: 'pass',
        checks: [{ id: '1', name: 'Lint', description: '', status: 'pass', mandatory: true }],
      },
    ];
    const gates: ApprovalGate[] = [
      { id: '1', name: 'Approval', required: true, status: 'approved' },
    ];
    const result = canPromoteToProduction(stages, gates, []);
    expect(result.allowed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });
});
