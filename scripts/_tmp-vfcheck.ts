import { checkVisualForkGate } from './verification/visualForkGate';
const mine = ['src/ui/idleVillage/components/C1Medallion.tsx','src/ui/idleVillage/hudReal/HudRealCassetto.tsx','src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx','src/ui/idleVillage/hudReal/HudRealCassettoHost.tsx'];
const r = checkVisualForkGate(process.cwd(), { changedFiles: mine });
console.log(JSON.stringify({ errors: r.errors, warnings: r.warnings }, null, 1));
