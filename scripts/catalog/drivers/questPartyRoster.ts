/** Catalog driver: open the run window's «Assigned party» companion plaque (real click). */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { openCompanion } from './questCompanion';

export async function drive(ctx: HarnessCtx): Promise<boolean> {
  return openCompanion(ctx, 'Assigned party', '[data-testid="quest-party-roster"]');
}
