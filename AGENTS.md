# AGENTS.md — ShipShape AI

## Project Overview

ShipShape AI is a release-readiness dashboard and DevSecOps automation workflow built with Next.js, TypeScript, and Tailwind CSS. It demonstrates how code moves through the complete post-code DevSecOps lifecycle, from verification through production promotion.

## Architecture

- **Framework**: Next.js 16 with App Router and TypeScript
- **Styling**: Tailwind CSS v4 with custom dark-mode design system
- **State**: React `useState`/`useMemo` for client-side dashboard state
- **Data**: Demo mode with clearly labelled sample data; designed for future GitLab API integration
- **API**: Health check endpoint at `/api/health`
- **CI/CD**: GitLab CI pipeline with verify → secure → package → release → govern stages

## Key Directories

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React UI components
├── data/          # Demo/sample data (clearly labelled)
├── lib/           # Business logic (readiness calculator, etc.)
├── types/         # TypeScript type definitions
scripts/
├── release-analysis.mjs   # Release readiness report generator
├── policy-check.mjs       # Policy evaluation script
├── secret-scan.mjs        # Secret detection scanner
```

## Safe Operating Instructions

### DO

- Run linting and tests before committing: `npm run lint && npm test`
- Use the existing type definitions in `src/types/index.ts`
- Follow the existing component patterns in `src/components/`
- Keep demo data in `src/data/demo-data.ts`, clearly labelled with `source: 'demo'`
- Add new checks to the readiness calculator in `src/lib/readiness.ts`
- Write tests for new business logic in `src/lib/__tests__/`
- Use the `glass-card` CSS class for card components
- Keep the `.gitlab-ci.yml` stages in order: verify → secure → package → release → govern

### DO NOT

- **Never hardcode secrets, API keys, or credentials** in source code
- **Never bypass security checks or the production approval gate**
- **Never fabricate CI/CD results or security scan findings** — use real check results
- **Never auto-deploy to production** — the production-promote job must remain manual
- **Never remove the demo mode banner or label** from sample data
- **Never modify `canPromoteToProduction()` to always return true**
- Do not commit `.env` files with real values (use `.env.example` as template)
- Do not commit `node_modules/`, `.next/`, `reports/`, or `coverage/` directories

## GitLab Duo Integration

### GitLab Duo Code Review Flow

This project is designed to work with [GitLab Duo Code Review](https://docs.gitlab.com/user/project/merge_requests/duo_code_review/), which provides AI-powered code review on merge requests.

**Setup**:
1. Enable GitLab Duo in your project settings (Settings → General → GitLab Duo features)
2. The Code Review flow automatically analyses merge requests when enabled
3. GitLab Duo Code Review analyses code changes, suggests improvements, and identifies potential issues

### Custom Workflow: Release Analysis Flow

The following custom workflow analyses CI results and prepares release recommendations:

1. **Pipeline Analysis**: After each CI pipeline completes on the default branch, the `release-analysis` job analyses test results, security findings, and build status
2. **Policy Evaluation**: The `policy-check` job validates all release policies
3. **Remediation Recommendations**: Security findings include specific remediation steps
4. **Release Summary**: A comprehensive release report is generated as a pipeline artifact

### Prerequisites for GitLab Duo

- GitLab Premium or Ultimate tier (for Duo features)
- GitLab Duo enabled at the group or project level
- For Code Review: GitLab 17.1+ with Code Review enabled in project settings

### Limitations

- GitLab Duo features require a GitLab Premium/Ultimate license
- Code Review is currently limited to merge request diffs
- Custom Duo Agents require GitLab 17.1+ and may have additional prerequisites
- The dashboard currently uses demo data; full GitLab API integration is planned

## Testing

Run unit tests:
```bash
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

## Release Process

1. All checks in the `verify` stage must pass (lint + tests)
2. Security scans in the `secure` stage must not find critical issues
3. Production build in the `package` stage must succeed
4. Release analysis generates a readiness report
5. Policy check validates all required policies
6. **Manual approval** is required for production promotion
