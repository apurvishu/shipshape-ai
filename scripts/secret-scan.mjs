#!/usr/bin/env node

/**
 * Secret Detection Script
 * Scans source files for common secret patterns (API keys, tokens, passwords).
 * This is a lightweight scanner — in production, use GitLab Secret Detection or gitleaks.
 *
 * Usage: node scripts/secret-scan.mjs
 * Output: reports/secret-scan.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Patterns that indicate potential secrets
const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret Key', pattern: /(?:aws_secret_access_key|aws_secret)\s*[=:]\s*['"]?[A-Za-z0-9/+=]{40}/gi },
  { name: 'Generic API Key', pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?[A-Za-z0-9]{32,}/gi },
  { name: 'Generic Secret', pattern: /(?:secret|password|passwd|pwd)\s*[=:]\s*['"]?[A-Za-z0-9!@#$%^&*]{8,}/gi },
  { name: 'Private Key', pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g },
  { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
  { name: 'GitLab Token', pattern: /glpat-[A-Za-z0-9_-]{20,}/g },
  { name: 'Slack Token', pattern: /xox[bporas]-[A-Za-z0-9-]{10,}/g },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
];

// Directories and files to skip
const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'reports', '.cache',
  'dist', 'build', 'coverage', '.nyc_output',
]);

const SKIP_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
]);

const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.yml', '.yaml', '.env', '.toml', '.ini',
  '.md', '.txt', '.sh', '.bash', '.zsh', '.ps1',
  '.py', '.rb', '.go', '.java', '.cs',
  '.html', '.css', '.scss', '.less',
  '.xml', '.cfg', '.conf', '.properties',
]);

function getFiles(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      if (entry.startsWith('.') && entry !== '.env' && entry !== '.env.example') continue;

      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(...getFiles(fullPath));
        } else if (stat.isFile()) {
          if (SKIP_FILES.has(entry)) continue;
          const ext = extname(entry);
          if (SCAN_EXTENSIONS.has(ext) || entry.startsWith('.env')) {
            files.push(fullPath);
          }
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return files;
}

function main() {
  console.log('🔍 ShipShape AI — Secret Detection');
  console.log('─'.repeat(50));

  const files = getFiles(ROOT);
  console.log(`Scanning ${files.length} files...`);

  const findings = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');

      // Skip example/template files for secret-like patterns
      if (relativePath.includes('.example') || relativePath.includes('.template')) continue;
      // Skip this script itself and demo data
      if (relativePath.includes('secret-scan') || relativePath.includes('demo-data')) continue;

      for (const { name, pattern } of SECRET_PATTERNS) {
        // Reset regex
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // Verify it's not in a comment describing patterns or a test
          const lineStart = content.lastIndexOf('\n', match.index) + 1;
          const line = content.substring(lineStart, content.indexOf('\n', match.index));
          if (
            line.trim().startsWith('//') ||
            line.trim().startsWith('*') ||
            line.trim().startsWith('#') ||
            line.includes('example') ||
            line.includes('placeholder') ||
            line.includes('CHANGE_ME') ||
            line.includes('your_') ||
            line.includes('xxx')
          ) {
            continue;
          }

          const lineNumber = content.substring(0, match.index).split('\n').length;
          findings.push({
            type: name,
            file: relativePath,
            line: lineNumber,
            snippet: match[0].substring(0, 20) + '...',
          });
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    filesScanned: files.length,
    secretsFound: findings.length > 0,
    count: findings.length,
    findings: findings.map(f => ({
      type: f.type,
      file: f.file,
      line: f.line,
    })),
  };

  // Write report
  const reportsDir = join(ROOT, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  writeFileSync(
    join(reportsDir, 'secret-scan.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('─'.repeat(50));
  if (findings.length === 0) {
    console.log(`✅ No secrets detected in ${files.length} files.`);
  } else {
    console.log(`❌ Found ${findings.length} potential secret(s):`);
    for (const f of findings) {
      console.log(`   • ${f.type} in ${f.file}:${f.line}`);
    }
  }
  console.log('📄 Report saved to: reports/secret-scan.json');

  if (findings.length > 0) {
    process.exit(1);
  }
}

main();
