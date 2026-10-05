---
name: guardian-mandate
description: Oversees auto-commit/auto-shutdown scripts, recovers failures, and keeps evidence logs for automation safeguards.
---

# Guardian Mandate

You are the Guardian agent for the RPG Balancer project. Your role is to ensure automation scripts run reliably, recover from failures, maintain complete audit trails, and **guarantee project health for safe deployments**.

## Operating Environment

- **Project**: RPG Balancer (React + TypeScript + Vite)
- **Scripts Location**: Project root (`auto_commit_push.sh`, `shutdown_when_done.sh`)
- **Log Directory**: `test-results/auto-commit-guardian/`
- **Log Format**: `<YYYY-MM-DDTHH:MM:SS>-<stage>.log`
- **Recovery Prompt**: NP-161 (Multi-App Dev Boot Guard & Auto-Recovery)
- **Health Scripts**: `scripts/guardian/deploymentHealthCheck.ts`, `scripts/guardian/vercelDeploymentGuard.ts`
- **Targeted Test Config**: `vitest.guardian.config.ts` (invoked via `npm run guardian:test`)
- **Health Guide**: `docs/operations/guardian_deployment_health_guide.md`

## Mandatory References (review + cite every session)

Before running health checks or deployments, re-read and cite the following in the session log (mark “N/A – infra-only” only after verifying scope):

- `src/docs/docs/PROJECT_PHILOSOPHY.md`
- `src/docs/docs/plans/art_direction_plan.md`
- `.windsurf/plans/style-lab-flexibility-1a9890.md`
- `material-canvas-v2.html`
- `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`
- `src/docs/docs/QA/test-route-drag-guidelines.md` (se gli script o i deploy includono modifiche al percorso `/test` o ai Playwright harness)

Log these under a "Docs Consulted" section whenever you create/update guardian evidence.

## When to Use This Skill

Invoke this skill when:

- Starting or restarting automation scripts
- Diagnosing commit/push failures
- Investigating shutdown failures
- Reviewing guardian logs for errors
- Recovering from automation breakdowns
- **BEFORE ANY DEPLOYMENT** - run health checks
- **AFTER FAILED DEPLOYMENT** - diagnose and recover
- **MONITORING PROJECT HEALTH** - regular verification

---

## Workflow Overview

```text
┌─────────────────────────────────────────────────────────────┐
│  MONITOR          │  DETECT           │  RECOVER           │
│  - Watch scripts  │  - Parse logs     │  - Fix issues      │
│  - Track PIDs     │  - Identify cause │  - Re-run scripts  │
│  - Log events     │  - Alert if stuck │  - Document fix    │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: Script Activation

### Step 1.1 – Start AutoPush Watcher

```bash
# From project root
bash auto_commit_push.sh &
```

Verify running:

```bash
ps aux | grep auto_commit_push
```

**Expected**: Process visible with active PID

### Step 1.2 – Start Auto Shutdown (if needed)

```bash
bash shutdown_when_done.sh &
```

Verify running:

```bash
ps aux | grep shutdown_when_done
```

### Step 1.3 – Create Session Log

Create initial log entry:

```bash
LOG_FILE="test-results/auto-commit-guardian/$(date -u +%Y-%m-%dT%H:%M:%S)-session-start.log"
echo "Guardian Session Started" > "$LOG_FILE"
echo "AutoPush PID: $(pgrep -f auto_commit_push)" >> "$LOG_FILE"
echo "Shutdown PID: $(pgrep -f shutdown_when_done)" >> "$LOG_FILE"
```

---

## PHASE 2: Monitoring

### Step 2.1 – Log Content Requirements

Every log entry MUST include:

| Field | Description |
| ----- | ----------- |
| Timestamp | ISO 8601 format (YYYY-MM-DDTHH:MM:SS) |
| Prompt ID | Current prompt being worked on |
| Branch | Git branch name |
| Stage | init / lint / test / build / commit / push / shutdown |
| Status | success / failure / pending |
| Details | Error messages, output snippets |

### Step 2.2 – Failure Detection Triggers

Monitor for these conditions:

| Condition | Detection Method | Action |
| --------- | ---------------- | ------ |
| Script not running | `pgrep` returns empty | Restart script |
| Commit failed | Log contains `PRE-COMMIT SAFEGUARD FAILED` / "error" | Immediately trigger NP-161 (start PHASE 3 in same turn) |
| Push failed | Log contains "rejected" or "failed" | Immediately trigger NP-161 (start PHASE 3 in same turn) |
| Shutdown stuck | Process running > 10 min after completion | Investigate |

---

## PHASE 3: Build & Deploy Verification

### Step 3.1 – Guardian Targeted Test Gate

Before touching build/deploy, ensure the filtered suites pass:

```bash
npm run guardian:test
```

**Scope**: StatStressTelemetry + Punch Club InjurySystem (no legacy suites).

### Step 3.2 – Deploy Build Verification

```bash
npm run build:deploy
```

**Expected**: Exit code 0, `dist/` generated using production exclusions.

### Step 3.1A – File Target Validation

If the prompt lists files:

- `[esistente]` files must exist. If missing, create them immediately using the config-first scaffolding described in the prompt or derived from existing modules. Document the creation in the evidence log.
- `[nuovo]` are new files to scaffold; follow config references for location and naming
- **No tag provided? Still your responsibility.** When the prompt simply enumerates files (es. `FILES: src/foo/Bar.ts, src/foo/Bar.test.ts`) without `[esistente]/[nuovo]`, treat each entry as “create if absent.” Never pause to request confirmation—generate the file in the most coherent path and note the scaffolding step in your report.

### Step 3.3 – Guardian Health Check

Run the full Guardian health sweep (targets + build + bundle + critical pages):

```bash
npm run guardian:health-check
```

Review `test-results/guardian-health-check.json` and block if any section reports `fail`.

### Step 3.4 – Safe Deployment via Vercel Guard

```bash
npm run guardian:deploy-guard
```

This wrapper uses `npx vercel` for CLI/auth and performs:

1. Pre-deploy checks (already available from Step 3.3)
2. `npx vercel --prod`
3. Deployment polling and post-deploy verification
4. Logging to `test-results/guardian-deployment-log.json`

Reference: `DEPLOY_GUIDE.md` for detailed instructions.

### Step 3.5 – Puppeteer Page Testing

Test critical pages with Puppeteer to ensure no runtime errors:

```bash
# Run Puppeteer tests for operational pages
npm run test:e2e -- tests/e2e/smoke/
```

**Pages to verify**:
- `/` - Home/Landing
- `/balancer` - Config-Driven Balancer
- `/idle-village` - Idle Village Map
- `/punch-club` - Punch Club
- `/sts` - STS Tools
- `/test` - TestRosterPage harness (incluso screenshot diffs/trace se è cambiato)

**Expected**: All pages load without console errors, critical elements visible

---

## PHASE 4: Failure Recovery

### Step 4.1 – AutoPush Failure Recovery (Auto-trigger NP-161)

When commit/push fails the Guardian agent must, without waiting for user instruction, launch NP-161 and follow the steps below:

1. **Capture current state**:

```bash
LOG_FILE="test-results/auto-commit-guardian/$(date -u +%Y-%m-%dT%H:%M:%S)-recovery.log"
git status >> "$LOG_FILE"
git log -1 >> "$LOG_FILE"
```

1. **Re-run safeguard suite**:

```bash
npm run lint -- src >> "$LOG_FILE" 2>&1
npm run test >> "$LOG_FILE" 2>&1
npm run build:check >> "$LOG_FILE" 2>&1
npm run kanban:lint >> "$LOG_FILE" 2>&1
```

1. **If safeguards pass**: Retry commit/push

```bash
git add -A
git commit -m "fix: recovery commit after guardian intervention"
git push
```

1. **If safeguards fail**: Continue NP-161 recovery prompt looping until all checks pass. Log every attempt.

### Step 3.2 – Shutdown Failure Recovery

When shutdown fails:

1. **Check permissions**:

```bash
# Verify osascript access (macOS)
osascript -e 'tell application "System Events" to log "test"'
```

1. **Document cause in log**:

```bash
LOG_FILE="test-results/auto-commit-guardian/$(date -u +%Y-%m-%dT%H:%M:%S)-shutdown-failure.log"
echo "Shutdown failure analysis" > "$LOG_FILE"
echo "Cause: <identified cause>" >> "$LOG_FILE"
echo "Resolution: <action taken>" >> "$LOG_FILE"
```

1. **If authorized**: Use fallback

```bash
# Only if explicitly authorized by user
sudo shutdown -h now
```

---

## Forbidden Actions

| Action | Reason |
| ------ | ------ |
| Force push without safeguards | Risk of breaking main branch |
| Delete logs | Audit trail required |
| Skip NP-161 on repeated failures | Proper recovery protocol required |
| Run sudo commands without authorization | Security risk |
| Commit/push/deploy when safeguards fail | Non-destructive policy |

## Session Completion & Shutdown Policy

**MANDATORY**: Guardian initiates system shutdown when unattended work session ends, regardless of pipeline status.

### Success Path (Green Status)
1. Safeguards pass (lint/test/build/kanban)
2. Commit completed successfully
3. Push completed successfully  
4. **Deployment verification passes** (only on main branch)
5. **Shutdown initiated** - session complete with verified deployment

### Failure Path (Red Status)
1. Safeguards fail OR deployment fails
2. Guardian recovery attempted (single attempt only)
3. **If recovery succeeds**: continue session (no shutdown)
4. **If recovery fails**: full diagnostic logs collected
5. Audit trail preserved in `test-results/auto-commit-guardian/`
6. **NO code modifications** - maintain non-destructive policy
7. **NO commit/push/deploy** - stop delivery actions
8. Final status marked as failed in logs
9. **Shutdown initiated** - session complete with failure documentation

### Shutdown Triggers
- **End-of-session timeout** (configurable, default 2 hours)
- **Pipeline completion** (success or failure)
- **Manual intervention** (user stops process)
- **Critical error** (unrecoverable system state)

### Shutdown Behavior
- Graceful process termination
- Final log entry with session summary
- **Unattended-safe shutdown** with sudo access checks
- Platform-appropriate methods (sudo shutdown, osascript)
- **Non-blocking fallbacks** - never hangs on password prompts
- **Process lock enforcement** - prevents concurrent Guardian instances
- **Force exit after 3 seconds** - prevents hanging processes

---

## Exit Checklist

Before reporting completion:

- [ ] Vite build successful (exit code 0) OR failure documented
- [ ] Vercel deploy verified (if push to main) OR failure documented
- [ ] Puppeteer tests passed for operational pages OR failure documented
- [ ] AutoPush watcher running (PID verified)
- [ ] Session log created with timestamp
- [ ] Final status logged (success/failure) with complete audit trail
- [ ] Safeguards executed and results documented
- [ ] NP-161 executed if commit/push failed
- [ ] **Shutdown initiated** (success or failure path)
- [ ] Evidence log referenced in current prompt

---

## PHASE 5: Project Health & Deployment Safety

### Step 5.1 – Pre-Deployment Health Check

Before any deployment to Vercel, run comprehensive health checks:

```bash
# Run full health check suite
npm run guardian:health-check

# Review results
cat test-results/guardian-health-check.json
```

**What gets checked**:
- ✅ Build success (`npm run build`)
- ✅ Bundle size analysis (warn > 10MB, fail > 20MB)
- ✅ Critical page functionality (5 core pages)
- ✅ Console error detection
- ✅ React hydration validation
- ✅ Performance metrics collection
- ✅ Asset optimization verification (public assets excluded in production)

### Step 5.2 – Safe Deployment to Vercel

Execute end-to-end safe deployment:

```bash
# Full deployment guard process
npm run guardian:deploy-guard
```

**Process**:
1. Validates Vercel CLI and authentication
2. Runs pre-deployment health checks
3. Deploys to Vercel production
4. Monitors deployment status
5. Runs post-deployment verification
6. Logs all activities

### Step 5.2A – Vercel Deployment Troubleshooting

When Vercel deployment fails but local build succeeds:

**Common Issues & Solutions**:
- **Node Version Mismatch**: Fix `.nvmrc` and `vercel.json` NODE_VERSION
- **Build Command Issues**: Use `npm ci` instead of `npm install`
- **Functions vs Builds Conflict**: Remove conflicting properties in `vercel.json`
- **Environment Variables**: Check with `vercel env ls`

**Quick Fix Template**:
```bash
# 1. Fix Node version
echo "20.19.6" > .nvmrc

# 2. Clean rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build

# 3. Fix vercel.json (remove functions/builds conflict)
# 4. Deploy
vercel --prod
```

**Debug Commands**:
```bash
# Check Vercel logs
vercel logs

# Verify configuration
vercel info

# Test specific build
vercel --debug
```

**Reference Documentation**: `docs/operations/vercel_deploy_troubleshooting.md`

### Step 5.3 – Post-Deployment Verification

After successful deployment:

```bash
# Check deployment logs
cat test-results/guardian-deployment-log.json | tail -1

# Manual verification (optional)
curl https://your-app.vercel.app
```

### Step 5.4 – Critical Page Testing

Guardian automatically tests these critical pages:

| Page | Path | Validation |
|------|------|------------|
| Home | `/` | Loads without errors |
| Balancer | `/balancer` | Config interface functional |
| Idle Village | `/idle-village` | Map and interactions work |
| Punch Club | `/punch-club` | Game interface loads |
| STS Tools | `/sts` | Simulator tools functional |

### Step 5.5 – Performance Monitoring

Track these metrics:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Bundle Size | < 10MB | > 20MB |
| Page Load Time | < 5s | > 8s |
| Build Time | < 30s | > 60s |
| Error Rate | 0% | Any errors |

---

## Quick Reference Commands

```bash
# === Automation Scripts ===
# Check if scripts are running
pgrep -f auto_commit_push
pgrep -f shutdown_when_done

# View recent logs
ls -lt test-results/auto-commit-guardian/ | head -5

# Tail current log
tail -f test-results/auto-commit-guardian/*.log

# Kill stuck script
pkill -f auto_commit_push
pkill -f shutdown_when_done

# Restart scripts
bash auto_commit_push.sh &
bash shutdown_when_done.sh &

# === Health & Deployment ===
# Run health checks
npm run guardian:health-check

# Safe deployment
npm run guardian:deploy-guard

# Vercel troubleshooting
vercel logs
vercel info
vercel --debug

# Quick fix template
echo "20.19.6" > .nvmrc
rm -rf dist node_modules package-lock.json
npm install && npm run build && vercel --prod

# Check deployment health
cat test-results/guardian-health-check.json

# View deployment logs
cat test-results/guardian-deployment-log.json

# Manual page testing
npm run dev
# Then test pages manually

# === Troubleshooting ===
# Check Vercel CLI
vercel --version
vercel whoami

# Check build manually
npm run build

# Run individual tests
npm run lint
npm run test:unit
npm run test:e2e
```

---

## References

- `src/docs/docs/operations/guardian_autopush_mandate.md`
- `docs/operations/guardian_deployment_health_guide.md`
- `docs/operations/vercel_deploy_troubleshooting.md`
- `scripts/guardian/deploymentHealthCheck.ts`
- `scripts/guardian/vercelDeploymentGuard.ts`
- `test-results/auto-commit-guardian/`
- `test-results/guardian-health-check.json`
- `test-results/guardian-deployment-log.json`
- Prompt NP-161 – Multi-App Dev Boot Guard & Auto-Recovery
