import { checkContractsGate } from './verification/contractsCheck';
const mine = [
  'RICHIESTE.md',
  'src/pages/game-mappa2.tsx',
  'src/pages/hud-compose.tsx',
  'src/ui/idleVillage/components/C1Medallion.tsx',
  'src/ui/idleVillage/hudReal/HudRealCassetto.tsx',
  'src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx',
  'src/ui/idleVillage/hudReal/HudRealCassettoHost.tsx',
  'src/test/setup/polyfills.ts',
  'tests/unit/idleVillage/r335RosterChrome.test.ts',
  'tests/unit/idleVillage/r335CassettoResources.test.ts',
];
const rep = checkContractsGate(process.cwd(), { changedFiles: mine });
console.log(JSON.stringify({ errors: rep.errors, unmapped: rep.unmapped }, null, 1));
