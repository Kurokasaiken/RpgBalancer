# jobDetailKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `JobDetail` (`src/ui/idleVillage/frozen/kits/jobDetailKit.tsx`)
- Reference route: `/minimal-job-detail` → `src/pages/minimal-job-detail.tsx`
- Minimal route: `/minimal-job-detail`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider` via `JobDetailKitShell`

## Public API

```tsx
import { JobDetail, JobDetailIsolated, JobDetailKitShell } from '@/ui/idleVillage/frozen/kits/jobDetailKit';

function MinimalJobDetail() {
  return (
    <JobDetailKitShell>
      <JobDetailIsolated />
    </JobDetailKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `jobDetailKit.contract.ts`. The contract subtree is `[data-testid="job-detail"]`.

## Workflow
- The `JobDetail` panel renders a demo job selected from `DEMO_JOBS`.
- It displays header, description, stats (duration, fatigue, max slots, danger), rewards, requirements.
- Clicking `Assegna Residente` emits `job_detail_assign_clicked` telemetry and calls `onAssign`.
- The `JobDetailIsolated` wrapper cycles through the three demo jobs and tracks the assigned job.

## Fixture
`DEMO_JOBS` array with `chop-wood`, `mine-iron`, `farm-food` demo data.

## Certification
- **Status:** candidate
- **Manifest:** `jobDetailKit.cert.json`
- **Evidence:**
  - Runtime smoke: `/minimal-job-detail` must return 200.
  - Build: `npm run build:check`
