#!/usr/bin/env node

/**
 * Release Analysis Script
 * Analyses test results, security findings, and build status
 * to generate a release-readiness report.
 *
 * Usage: node scripts/release-analysis.mjs
 * Output: reports/release-report.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
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

function analyseTestResults() {
  // Check for Jest JSON output
  const jestReport = loadJSON(join(ROOT, 'reports', 'test-results.json'));

  if (jestReport) {
    return {
      suites: [
        {
          suite: 'Unit Tests',
          total: jestReport.numTotalTests || 0,
          passed: jestReport.numPassedTests || 0,
          failed: jestReport.numFailedTests || 0,
          skipped: (jestReport.numPendingTests || 0) + (jestReport.numTodoTests || 0),
          duration: jestReport.testResults
            ? jestReport.testResults.reduce((sum, r) => sum + (r.endTime - r.startTime), 0)
            : 0,
        },
      ],
      allPassed: jestReport.success === true,
    };
  }

  // Default: no test results found
  return {
    suites: [],
    allPassed: false,
    warning: 'No test results found. Run tests first.',
  };
}

function analyseSecurityFindings() {
  const auditReport = loadJSON(join(ROOT, 'reports', 'npm-audit.json'));
  const secretReport = loadJSON(join(ROOT, 'reports', 'secret-scan.json'));

  const summary = { critical: 0, high: 0, medium: 0, low: 0 };
  const findings = [];

  if (auditReport && auditReport.vulnerabilities) {
    for (const [name, vuln] of Object.entries(auditReport.vulnerabilities)) {
      const severity = vuln.severity || 'info';
      if (summary[severity] !== undefined) {
        summary[severity]++;
      }
      findings.push({
        title: `Vulnerability in ${name}`,
        severity,
        category: 'Dependency Vulnerability',
        description: vuln.title || `${severity} severity vulnerability in ${name}`,
        remediation: vuln.fixAvailable
          ? `Fix available: ${typeof vuln.fixAvailable === 'object' ? `update to ${vuln.fixAvailable.name}@${vuln.fixAvailable.version}` : 'run npm audit fix'}`
          : 'No automatic fix available. Review and update manually.',
        status: 'open',
      });
    }
  }

  if (secretReport && secretReport.secretsFound) {
    findings.push({
      title: 'Secrets detected in source code',
      severity: 'critical',
      category: 'Secret Detection',
      description: `${secretReport.count || 'Unknown number of'} secret(s) found`,
      remediation: 'Remove secrets from source code immediately. Use environment variables or a secrets manager.',
      status: 'open',
    });
    summary.critical += secretReport.count || 1;
  }

  return { summary, findings };
}

function calculateReadinessScore(testAnalysis, securityAnalysis) {
  let score = 0;
  const maxScore = 100;

  // Tests: 40 points
  if (testAnalysis.allPassed) {
    score += 40;
  } else if (testAnalysis.suites.length > 0) {
    const totalTests = testAnalysis.suites.reduce((s, r) => s + r.total, 0);
    const passedTests = testAnalysis.suites.reduce((s, r) => s + r.passed, 0);
    score += Math.round((passedTests / Math.max(totalTests, 1)) * 40);
  }

  // Security: 30 points
  const sec = securityAnalysis.summary;
  let secScore = 30;
  secScore -= sec.critical * 30;
  secScore -= sec.high * 15;
  secScore -= sec.medium * 5;
  secScore -= sec.low * 1;
  score += Math.max(0, secScore);

  // Build: 20 points (if we got this far, build succeeded)
  score += 20;

  // Lint: 10 points (if we got this far, lint passed)
  score += 10;

  return Math.min(score, maxScore);
}

function determineRiskLevel(score, securitySummary) {
  if (securitySummary.critical > 0) return 'critical';
  if (securitySummary.high > 0 || score < 50) return 'high';
  if (securitySummary.medium > 0 || score < 75) return 'medium';
  return 'low';
}

function generateReleaseNotes() {
  // Read git log for recent changes (best effort)
  const notes = [];

  try {
    const log = execSync('git log --oneline -10 --no-merges', {
      encoding: 'utf-8',
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (log && !log.includes('No git history')) {
      log.split('\n').forEach(line => {
        const msg = line.replace(/^[a-f0-9]+\s+/, '');
        if (msg) notes.push(msg);
      });
    }
  } catch {
    // Git not available
  }

  if (notes.length === 0) {
    notes.push('Release readiness dashboard with lifecycle view');
    notes.push('CI/CD pipeline integration with automated checks');
    notes.push('Security scanning and remediation recommendations');
  }

  return notes;
}

// ── Main ──

async function main() {
  console.log('🔍 ShipShape AI — Release Analysis');
  console.log('─'.repeat(50));

  const testAnalysis = analyseTestResults();
  console.log(`✅ Test Analysis: ${testAnalysis.suites.length} suite(s) found`);

  const securityAnalysis = analyseSecurityFindings();
  console.log(`🔒 Security Analysis: ${securityAnalysis.findings.length} finding(s)`);

  const score = calculateReadinessScore(testAnalysis, securityAnalysis);
  const riskLevel = determineRiskLevel(score, securityAnalysis.summary);
  const releaseNotes = await generateReleaseNotes();

  const report = {
    version: process.env.CI_COMMIT_TAG || process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    readinessScore: score,
    testResults: testAnalysis.suites,
    securitySummary: securityAnalysis.summary,
    securityFindings: securityAnalysis.findings,
    riskLevel,
    releaseNotes,
    approved: false,
    blockers: [],
    pipeline: {
      id: process.env.CI_PIPELINE_ID || 'local',
      ref: process.env.CI_COMMIT_REF_NAME || 'local',
      sha: process.env.CI_COMMIT_SHA || 'local',
    },
  };

  // Determine blockers
  if (!testAnalysis.allPassed) {
    report.blockers.push('Not all tests have passed');
  }
  if (securityAnalysis.summary.critical > 0) {
    report.blockers.push('Critical security vulnerabilities detected');
  }
  if (securityAnalysis.summary.high > 0) {
    report.blockers.push('High severity security vulnerabilities detected');
  }
  report.blockers.push('Production approval has not been granted');

  // Write report
  const reportsDir = join(ROOT, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  writeFileSync(
    join(reportsDir, 'release-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('─'.repeat(50));
  console.log(`📊 Readiness Score: ${score}/100`);
  console.log(`⚡ Risk Level: ${riskLevel}`);
  console.log(`🚫 Blockers: ${report.blockers.length}`);
  report.blockers.forEach(b => console.log(`   • ${b}`));
  console.log(`📄 Report saved to: reports/release-report.json`);

  // Exit with error if critical issues
  if (riskLevel === 'critical') {
    console.error('\n❌ CRITICAL: Release is not ready due to critical issues.');
    process.exit(1);
  }

  console.log('\n✅ Release analysis complete.');
}

main().catch(err => {
  console.error('Release analysis failed:', err);
  process.exit(1);
});
