import { createContext, useContext } from 'react';

/**
 * Context controlling Localization Quality Assurance (LQA) overlay.
 *
 * When enabled, translated UI elements can expose `data-i18n-key` attributes
 * for inspection by `LQAOverlay`.
 */
export interface LQAContextValue {
  enabled: boolean;
}

export const LQAContext = createContext<LQAContextValue>({
  enabled: false,
});

export function useLQA(): LQAContextValue {
  return useContext(LQAContext);
}
