/**
 * syncGateExpect — PLAN-054 T-005: wrapper `expect` contante per spec
 * Playwright, attivo SOLO sotto `SYNC_GATE=1` (i normali `test:e2e`
 * passano direttamente a `@playwright/test` senza conteggio).
 *
 * Adozione in una spec:
 *   import { syncGateTest as test, invExpect as expect } from '../helpers/syncGateExpect';
 *
 * Il fixture `syncGateTest` estende `test` con un auto-fixture che
 * azzera il contatore per test e appende una entry JSONL a
 * `INV_COUNTS_FILE` (default `test-results/inv-executed-counts.json`)
 * con le asserzioni del tentativo finale — coerente con la semantica
 * vitest (`expect.poll`/`toPass` cumulano: per quei blocchi il gate usa
 * il floor statico delle asserzioni dirette).
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { expect as pwExpect, test as pwTest, type Expect, type TestInfo } from '@playwright/test';

const ENABLED = process.env.SYNC_GATE === '1';
const OUT = process.env.INV_COUNTS_FILE ?? 'test-results/inv-executed-counts.json';
let counter = 0;

/** `expect` che conta: stessa superficie di `@playwright/test` expect. */
export const invExpect: Expect = new Proxy(pwExpect as Expect, {
  apply(target, thisArg, args) {
    if (ENABLED) counter++;
    return Reflect.apply(target as never, thisArg, args);
  },
  get(target, prop, recv) {
    const v = Reflect.get(target as object, prop, recv);
    /* `expect.poll`/`expect.soft`/`expect.extend`... delegano intatti:
     * il floor statico copre i blocchi poll (artifact-r009). */
    return v;
  },
});

/** `test` con auto-fixture che persiste il conteggio per test. */
export const syncGateTest = pwTest.extend<{ _invCounts: void }>({
  _invCounts: [
    async ({}, use, testInfo: TestInfo) => {
      counter = 0;
      await use(undefined);
      if (!ENABLED) return;
      const file = testInfo.file ? relative(process.cwd(), resolve(testInfo.file)).split('\\').join('/') : 'unknown';
      const entry = {
        file,
        title: testInfo.titlePath.slice(1).join(' '),
        assertionCalls: counter,
        status: testInfo.status === 'passed' ? 'passed' : testInfo.status === 'skipped' ? 'skipped' : 'failed',
      };
      try {
        mkdirSync(dirname(OUT), { recursive: true });
        appendFileSync(OUT, `${JSON.stringify(entry)}\n`);
      } catch {
        /* come il setup vitest: persistenza fallita → fail-closed a valle */
      }
    },
    { auto: true },
  ],
});
