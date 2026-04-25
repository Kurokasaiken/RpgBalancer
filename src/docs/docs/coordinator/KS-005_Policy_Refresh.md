# KS-005 Policy Refresh - CI/CD Integration Guide

**Version:** 2.0  
**Date:** 2026-01-14  
**Author:** CI-Coordinator  
**Status:** Active

## Overview

This document outlines the refreshed KS-005 policy for kanban management with comprehensive CI/CD integration. The policy ensures consistent kanban hygiene, automated validation, and proper agent assignment tracking.

## 🎯 **Policy KS-005 Core Principles**

### 1. **Kanban State Management**
- **Non assegnato**: Must have agent and date set to "-"
- **In corso**: Must have valid agent and start date
- **Completato**: Must have evidence reference and end date
- **Bloccato**: Must have blocking reason and agent assignment

### 2. **Agent Workload Limits**
- **Maximum 3 concurrent "In corso" tasks per agent**
- **Automatic workload balancing and distribution tracking**
- **Agent capacity monitoring and alerts

### 3. **Evidence Requirements**
- **All "Completato" tasks must have evidence**
- **Evidence patterns**: `test-results/*.md`, `src/*.(ts|tsx)`, `docs/*.md`
- **Evidence must be accessible and verifiable**

### 4. **Stale Task Management**
- **"In corso" tasks older than 7 days flagged as stale**
- **"In corso" tasks older than 30 days require escalation**
- **Automatic cleanup suggestions for completed tasks**

## 🔧 **CI/CD Integration Architecture**

### GitHub Actions Workflow
```yaml
name: Kanban Lint Check

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/docs/docs/coordinator/agent_assignments.md'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'src/docs/docs/coordinator/agent_assignments.md'

jobs:
  kanban-lint:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.19.6'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci --ignore-scripts
      
    - name: Run kanban lint
      run: npm run kanban:lint
      
    - name: Validate KS-005 policy
      run: npx tsx scripts/coord/kanbanLintIntegration.ts validate-policy
      
    - name: Generate CI report
      if: failure()
      run: npx tsx scripts/coord/kanbanLintIntegration.ts report-failure
      
    - name: Upload failure report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: kanban-lint-failure
        path: docs/coordinator/ci-failure-reports.md
```

### Pre-commit Hook
```bash
#!/bin/bash
# Pre-commit hook for kanban lint validation

# Check if agent_assignments.md is being modified
if git diff --cached --name-only | grep -q "src/docs/docs/coordinator/agent_assignments.md"; then
  echo "🔍 Running kanban lint validation..."
  
  # Run kanban lint
  if ! npm run kanban:lint > /dev/null 2>&1; then
    echo "❌ Kanban lint failed. Please fix issues before committing."
    echo "Run 'npm run kanban:lint' to see detailed errors."
    exit 1
  fi
  
  # Validate KS-005 policy
  if ! npx tsx scripts/coord/kanbanLintIntegration.ts validate-policy > /dev/null 2>&1; then
    echo "❌ KS-005 policy validation failed. Please fix violations before committing."
    exit 1
  fi
  
  echo "✅ Kanban validation passed."
fi

exit 0
```

## 📋 **Implementation Checklist**

### Phase 1: Setup CI Integration
- [ ] Create GitHub Actions workflow
- [ ] Install pre-commit hook
- [ ] Configure failure reporting
- [ ] Test CI pipeline with sample violations

### Phase 2: Policy Enforcement
- [ ] Configure agent workload limits
- [ ] Set up stale task monitoring
- [ ] Implement evidence validation
- [ ] Create escalation procedures

### Phase 3: Monitoring & Reporting
- [ ] Set up automated reports
- [ ] Configure agent capacity dashboards
- [ ] Implement trend analysis
- [ ] Create alerting system

## 🛠 **Tooling & Scripts**

### kanbanLintIntegration.ts
**Purpose:** CI guardrails for kanban validation and policy enforcement

**Commands:**
```bash
# Setup CI integration
npx tsx scripts/coord/kanbanLintIntegration.ts setup

# Validate kanban lint only
npx tsx scripts/coord/kanbanLintIntegration.ts validate

# Validate KS-005 policy only
npx tsx scripts/coord/kanbanLintIntegration.ts validate-policy

# Run full validation
npx tsx scripts/coord/kanbanLintIntegration.ts full-validation

# Generate failure report
npx tsx scripts/coord/kanbanLintIntegration.ts report-failure
```

### kanbanAutoAudit.ts (Extended)
**Purpose:** Comprehensive kanban auditing with KS-005 policy validation

**New Features:**
- CI integration status checking
- KS-005 policy validation integration
- Enhanced reporting with CI metrics
- Automated cleanup suggestions

## 📊 **Policy Validation Rules**

### Agent Assignment Rules
```typescript
interface AgentWorkloadRule {
  maxConcurrentTasks: 3;
  escalationThreshold: 5;
  autoBalanceThreshold: 2;
}
```

### Evidence Validation Rules
```typescript
interface EvidenceRule {
  requiredPatterns: [
    /Evidence:\s*test-results\/.*\.md/,
    /Evidence:\s*src\/.*\.(ts|tsx)/,
    /Evidence:\s*docs\/.*\.md/
  ];
  minEvidenceLength: 20;
  accessiblePaths: boolean;
}
```

### Stale Task Rules
```typescript
interface StaleTaskRule {
  warningDays: 7;
  escalationDays: 30;
  autoArchiveDays: 90;
  notificationFrequency: 'daily' | 'weekly';
}
```

## 🚨 **Violation Handling**

### Level 1: Warnings
- Minor formatting issues
- Missing optional fields
- Non-critical evidence gaps

**Action:** Log warning, allow commit with notification

### Level 2: Errors
- Invalid agent assignments
- Missing required evidence
- Exceeding workload limits

**Action:** Block commit, require fixes

### Level 3: Critical
- Corrupted kanban structure
- Security policy violations
- Data integrity issues

**Action:** Block commit, escalate to coordinator

## 📈 **Monitoring & Metrics**

### Key Performance Indicators
- **Kanban Hygiene Score**: % of entries passing validation
- **Agent Utilization**: Average tasks per agent
- **Evidence Compliance**: % of completed tasks with proper evidence
- **Stale Task Rate**: % of tasks older than thresholds

### Reporting Frequency
- **Real-time**: CI validation results
- **Daily**: Agent workload summaries
- **Weekly**: Policy compliance reports
- **Monthly**: Trend analysis and recommendations

## 🔧 **Configuration**

### Environment Variables
```bash
# CI Configuration
KANBAN_LINT_ENABLED=true
KANBAN_POLICY_ENFORCEMENT=true
KANBAN_REPORTING_LEVEL=detailed

# Agent Limits
MAX_CONCURRENT_TASKS_PER_AGENT=3
STALE_TASK_WARNING_DAYS=7
STALE_TASK_ESCALATION_DAYS=30
```

### Configuration Files
```json
{
  "kanbanPolicy": {
    "agentWorkload": {
      "maxConcurrent": 3,
      "escalationThreshold": 5
    },
    "evidence": {
      "requiredPatterns": ["test-results", "src", "docs"],
      "minLength": 20
    },
    "staleTasks": {
      "warningDays": 7,
      "escalationDays": 30
    }
  }
}
```

## 🎓 **Training & Guidelines**

### Agent Guidelines
1. **Always update kanban status when starting work**
2. **Provide evidence links for completed tasks**
3. **Monitor personal workload and capacity**
4. **Follow escalation procedures for blocked tasks**

### Coordinator Guidelines
1. **Review agent workload distribution weekly**
2. **Address stale task escalations promptly**
3. **Maintain kanban hygiene and consistency**
4. **Use CI reports for quality assurance**

## 🔄 **Continuous Improvement**

### Policy Review Schedule
- **Monthly**: Review violation patterns and trends
- **Quarterly**: Update policy rules and thresholds
- **Annually**: Comprehensive policy refresh and training

### Feedback Mechanisms
- **CI Reports**: Automated violation tracking
- **Agent Surveys**: Workload and process feedback
- **Coordinator Meetings**: Process improvement discussions
- **Metrics Analysis**: Data-driven policy adjustments

## 📞 **Support & Escalation**

### Primary Support
- **CI Issues**: Check failure reports in `docs/coordinator/ci-failure-reports.md`
- **Policy Questions**: Review this document and examples
- **Tooling Issues**: Check script documentation and error logs

### Escalation Path
1. **Agent → Coordinator**: Workload and assignment issues
2. **Coordinator → Tech Lead**: Tooling and CI problems
3. **Tech Lead → System Admin**: Infrastructure and access issues

## 📚 **References**

- **Agent Assignment Guidelines**: `docs/coordinator/agent_execution_guidelines.md`
- **CI/CD Best Practices**: `docs/operations/ci_cd_guidelines.md`
- **Tooling Documentation**: `scripts/coord/README.md`
- **Historical Context**: `docs/coordinator/KS-005_Original.md`

---

**Policy Status**: Active  
**Next Review**: 2026-04-14  
**Contact**: CI-Coordinator  
**Version History**: v1.0 (2025-12-01) → v2.0 (2026-01-14)
