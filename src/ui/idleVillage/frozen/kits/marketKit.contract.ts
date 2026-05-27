import type { ContractConfig } from '../_infra/contract';

export interface MarketKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'marketKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-market';
  subtreeSelector: '[data-testid="market-action-card"]';
}

export const MARKET_KIT_VERSION: MarketKitContract['version'] = '0.0.0';
export const MARKET_KIT_SUBTREE_SELECTOR: MarketKitContract['subtreeSelector'] =
  '[data-testid="market-action-card"]';

export const marketKitContract: ContractConfig = {
  kitId: 'marketKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-market',
  subtreeSelector: MARKET_KIT_SUBTREE_SELECTOR,
};
