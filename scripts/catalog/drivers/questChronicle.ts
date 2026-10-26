/** Catalog driver: open the run window's «Chronicle» companion plaque (real click). */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { openCompanion } from './questCompanion';

export async function drive(ctx: HarnessCtx): Promise<boolean> {
  return openCompanion(ctx, 'Chronicle', '[data-testid="quest-log-panel"]');
}
