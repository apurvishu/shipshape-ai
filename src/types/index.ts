// ── Lifecycle Stage Types ──

export type LifecycleStageId =
  | 'plan'
  | 'create'
  | 'verify'
  | 'package'
  | 'secure'
  | 'release'
  | 'configure'
  | 'monitor'
  | 'govern';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'pending' | 'skipped';

export interface Check {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  details?: string;
  timestamp?: string;
  mandatory: boolean;
}

export interface LifecycleStage {
  id: LifecycleStageId;
  name: string;
  icon: string;
  description: string;
  checks: Check[];
  status: CheckStatus;
}

// ── Pipeline Types ──

export type PipelineStatus = 'success' | 'failed' | 'running' | 'pending' | 'canceled';

export interface PipelineJob {
  id: string;
  name: string;
  stage: string;
  status: PipelineStatus;
  duration?: number; // seconds
  startedAt?: string;
  finishedAt?: string;
  artifacts?: string[];
}

export interface Pipeline {
  id: string;
  ref: string;
  sha: string;
  status: PipelineStatus;
  createdAt: string;
  finishedAt?: string;
  duration?: number;
  jobs: PipelineJob[];
  source: 'demo' | 'ci';
}

// ── Security Types ──

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  description: string;
  location?: string;
  remediation: string;
  cveId?: string;
  status: 'open' | 'resolved' | 'dismissed';
  source: 'demo' | 'ci';
}

// ── Release Types ──

export interface TestResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // ms
}

export interface ReleaseReport {
  version: string;
  timestamp: string;
  readinessScore: number;
  testResults: TestResult[];
  securitySummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  releaseNotes: string[];
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  blockers: string[];
}

// ── Approval Gate Types ──

export interface ApprovalGate {
  id: string;
  name: string;
  required: boolean;
  status: 'approved' | 'pending' | 'rejected';
  approver?: string;
  timestamp?: string;
  reason?: string;
}

// ── Dashboard Types ──

export interface DashboardState {
  isDemoMode: boolean;
  stages: LifecycleStage[];
  pipelines: Pipeline[];
  securityFindings: SecurityFinding[];
  releaseReport: ReleaseReport | null;
  approvalGates: ApprovalGate[];
  readinessScore: number;
}
