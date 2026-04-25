import { execSync } from 'node:child_process'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const LOG_PATH = 'test-results/plan-audit.log'

const SANDBOX_PATTERN = /^src\/ui\/idleVillage\//
const PLAN_PATH = 'src/docs/docs/plans/village_sandbox_refactor_plan.md'

/**
 * Ensure the plan audit log destination exists before writing.
 */
function ensureLogDirectory(): void {
  try {
    mkdirSync(dirname(LOG_PATH), { recursive: true })
  } catch (error) {
    console.warn('Unable to prepare plan audit log directory:', error)
  }
}

/**
 * Append a status entry to the plan audit log.
 */
function logPlanAudit(status: 'PASS' | 'FAIL', details: string): void {
  try {
    ensureLogDirectory()
    const timestamp = new Date().toISOString()
    appendFileSync(LOG_PATH, `[${timestamp}] [${status}] ${details}\n`)
  } catch (error) {
    console.warn('Unable to append to plan audit log:', error)
  }
}

/**
 * Execute git diff and return the list of changed files for the provided args.
 */
function getChangedFiles(args: string[]): string[] {
  try {
    const raw = execSync(['git', 'diff', ...args, '--name-only'].join(' '), {
      encoding: 'utf8',
    })
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch (error) {
    console.error('Failed to read git diff:', error)
    process.exit(1)
  }
}

const autoApprove = process.argv.includes('--auto-approve')

const changedFiles = new Set([
  ...getChangedFiles([]),
  ...getChangedFiles(['--cached']),
])

const sandboxTouches = [...changedFiles].filter((filePath) =>
  SANDBOX_PATTERN.test(filePath)
)

if (sandboxTouches.length === 0) {
  const message = 'No VillageSandbox files modified. Guardrail passed.'
  console.log(message)
  logPlanAudit('PASS', message)
  process.exit(0)
}

if (!changedFiles.has(PLAN_PATH)) {
  const message = `VillageSandbox files touched (${sandboxTouches.join(
    ', '
  )}) but plan not updated. Please update ${PLAN_PATH}.`
  console.error('VillageSandbox files touched but plan not updated.')
  console.error(`Please update ${PLAN_PATH}`)
  logPlanAudit('FAIL', message)
  process.exit(autoApprove ? 0 : 1)
}

const successMessage =
  'VillageSandbox files modified and plan updated. Guardrail passed.'
console.log(successMessage)
logPlanAudit('PASS', successMessage)
