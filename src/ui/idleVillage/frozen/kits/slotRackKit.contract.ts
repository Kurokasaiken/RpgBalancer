/**
 * slotRackKit.contract
 *
 * Frozen TypeScript contract for SlotRack. Any change to this
 * file (props, version, defaults) requires a version bump and re-certification.
 */

import type { ContractConfig } from '../_infra/contract';

export interface SlotRackKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'slotRackKit';
  referenceRoute: '/test';
  minimalRoute: '/minimal-slotRack';
  subtreeSelector: '[data-testid="resident-slot-rack-root"]';
}

export const slotRackKitVersion: SlotRackKitContract['version'] = '1.0.0';

export const slotRackKitContract: ContractConfig = {
  kitId: 'slotRackKit',
  referenceRoute: '/test',
  minimalRoute: '/minimal-slotRack',
  subtreeSelector: '[data-testid="resident-slot-rack-root"]',
};
