import React from 'react';
import {
  InsetPanel,
  INSET_PANEL_PRESETS,
  type InsetPanelProps,
} from '@/ui/wanderlust-surface/InsetPanel';

export { INSET_PANEL_PRESETS as MATERIC_INSET_PRESETS };
export type { InsetPanelProps as MatericInsetProps };

/**
 * Canonical materic inset panel (recessed surface with material preset).
 */
export const MatericInset: React.FC<InsetPanelProps> = (props) => <InsetPanel {...props} />;

export default MatericInset;
