/**
 * pgcardKit.contract
 *
 * Frozen TypeScript contract for PgCard. Any change to this
 * file (props, version, defaults) requires a version bump and re-certification.
 */

import type { ContractConfig } from '../_infra/contract';

export interface PgCardKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'pgcardKit';
  referenceRoute: '/test';
  minimalRoute: '/minimal-pgcard';
  subtreeSelector: '[data-testid="village-roster-section"] [data-testid="pg-card"]';
}

export const pgcardKitVersion: PgCardKitContract['version'] = '1.0.0';
export const PGCARD_KIT_VERSION: PgCardKitContract['version'] = '1.0.0';
export const PGCARD_KIT_SUBTREE_SELECTOR: PgCardKitContract['subtreeSelector'] =
  '[data-testid="village-roster-section"] [data-testid="pg-card"]';

export const pgcardKitContract: ContractConfig = {
  kitId: 'pgcardKit',
  referenceRoute: '/test',
  minimalRoute: '/minimal-pgcard',
  subtreeSelector: '[data-testid="village-roster-section"] [data-testid="pg-card"]',
};
