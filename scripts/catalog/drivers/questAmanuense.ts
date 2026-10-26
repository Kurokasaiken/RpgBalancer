/** Catalog driver: open the Amanuense folio on the first node with a long-form page. */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { openAmanuense } from './questCompanion';

export async function drive(ctx: HarnessCtx): Promise<boolean> {
  return openAmanuense(ctx);
}
