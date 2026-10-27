#!/usr/bin/env node

/**
 * Policy Evaluation Script
 * Validates that the release meets all required policies before
 * production promotion.
 *
 * Usage: node scripts/policy-check.mjs
 * Output: reports/policy-report.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

function loadJSON(filepath) {
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

// ── Policy Rules ──

const policies = [
  {
    id: 'all-tests-pass',
    name: 'All Tests Must Pass',
    required: true,
    evaluate: (releaseReport) => {
      if (!releaseReport) return { pass: false, reason: 'No release report found' };
      const failed = (releaseReport.testResults || []).reduce(
        (sum, r) => sum + (r.failed || 0),
        0
      );
      return {
        pass: failed === 0,
        reason: failed > 0 ? `${failed} test(s) failed` : 'All tests passed',
      };
    },
  },
  {
    id: 'no-critical-vulnerabilities',
    name: 'No Critical Vulnerabilities',
    required: true,
    evaluate: (releaseReport) => {
      if (!releaseReport) return { pass: false, reason: 'No release report found' };
      const critical = releaseReport.securitySummary?.critical || 0;
      return {
        pass: critical === 0,
        reason: critical > 0 ? `${critical} critical vulnerability(ies) found` : 'No critical vulnerabilities',
      };
    },
  },
  {
    id: 'no-high-vulnerabilities',
    name: 'No High Vulnerabilities',
    required: true,
    evaluate: (releaseReport) => {
      if (!releaseReport) return { pass: false, reason: 'No release report found' };
      const high = releaseReport.securitySummary?.high || 0;
      return {
        pass: high === 0,
        reason: high > 0 ? `${high} high severity vulnerability(ies) found` : 'No high vulnerabilities',
      };
    },
  },
  {
    id: 'minimum-readiness-score',
    name: 'Minimum Readiness Score of 60',
    required: true,
    evaluate: (releaseReport) => {
      if (!releaseReport) return { pass: false, reason: 'No release report found' };
      const score = releaseReport.readinessScore || 0;
      return {
        pass: score >= 60,
        reason: `Readiness score: ${score}/100 (minimum: 60)`,
      };
    },
  },
  {
    id: 'build-succeeds',
    name: 'Production Build Succeeds',
    required: true,
    evaluate: () => {
      // If this script runs after a successful build, the build succeeded
      const buildExists = existsSync(join(ROOT, '.next'));
      return {
        pass: buildExists,
        reason: buildExists ? 'Production build artifact exists' : 'No build artifact found',
      };
    },
  },
  {
    id: 'no-secrets-in-code',
    name: 'No Secrets in Source Code',
    required: true,
    evaluate: () => {
      const secretReport = loadJSON(join(ROOT, 'reports', 'secret-scan.json'));
      if (!secretReport) {
        return { pass: true, reason: 'Secret scan report not found (assuming clean)' };
      }
      return {
        pass: !secretReport.secretsFound,
        reason: secretReport.secretsFound
          ? 'Secrets detected in source code'
          : 'No secrets detected',
      };
    },
  },
];

// ── Main ──

function main() {
  console.log('📋 ShipShape AI — Policy Evaluation');
  console.log('─'.repeat(50));

  const releaseReport = loadJSON(join(ROOT, 'reports', 'release-report.json'));

  const results = policies.map(policy => {
    const result = policy.evaluate(releaseReport);
    const icon = result.pass ? '✅' : policy.required ? '❌' : '⚠️';
    console.log(`${icon} ${policy.name}: ${result.reason}`);
    return {
      id: policy.id,
      name: policy.name,
      required: policy.required,
      pass: result.pass,
      reason: result.reason,
    };
  });

  const allRequiredPass = results
    .filter(r => r.required !== false)
    .every(r => r.pass);

  const policyReport = {
    timestamp: new Date().toISOString(),
    policies: results,
    overallPass: allRequiredPass,
    promotionAllowed: false, // Always false — requires manual approval
    message: allRequiredPass
      ? 'All required policies pass. Manual approval is still required for production promotion.'
      : 'One or more required policies have failed. Production promotion is blocked.',
    pipeline: {
      id: process.env.CI_PIPELINE_ID || 'local',
      ref: process.env.CI_COMMIT_REF_NAME || 'local',
      sha: process.env.CI_COMMIT_SHA || 'local',
    },
  };

  // Write report
  const reportsDir = join(ROOT, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  writeFileSync(
    join(reportsDir, 'policy-report.json'),
    JSON.stringify(policyReport, null, 2)
  );

  console.log('─'.repeat(50));
  console.log(
    allRequiredPass
      ? '✅ All required policies pass.'
      : '❌ Policy check FAILED — production promotion is blocked.'
  );
  console.log('⚠️  Manual approval is always required for production promotion.');
  console.log('📄 Policy report saved to: reports/policy-report.json');

  if (!allRequiredPass) {
    process.exit(1);
  }
}

main();
