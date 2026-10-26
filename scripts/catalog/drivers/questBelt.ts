/** Catalog driver: open the run window's «Bag» companion plaque (real click). */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { openCompanion } from './questCompanion';

export async function drive(ctx: HarnessCtx): Promise<boolean> {
  return openCompanion(ctx, 'Bag', '[data-testid="quest-belt"]');
}
