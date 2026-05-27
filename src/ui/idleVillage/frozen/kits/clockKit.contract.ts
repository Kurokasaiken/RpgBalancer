/**
 * clockKit.contract — frozen contract for the Clock kit.
 */

import type { ContractConfig } from '../_infra/contract';

export interface ClockKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'clockKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-clock';
  subtreeSelector: '[data-testid="minimal-clock-widget"]';
}

export const CLOCK_KIT_VERSION: ClockKitContract['version'] = '1.0.0';
export const CLOCK_KIT_SUBTREE_SELECTOR: ClockKitContract['subtreeSelector'] =
  '[data-testid="minimal-clock-widget"]';

export const clockKitContract: ContractConfig = {
  kitId: 'clockKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-clock',
  subtreeSelector: CLOCK_KIT_SUBTREE_SELECTOR,
};
