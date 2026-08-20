import React from 'react';
import { FieldGrain, type FieldGrainProps } from '@/ui/visualFidelityLab/FieldGrain';

export interface MatericGrainProps extends FieldGrainProps {}

/**
 * Canonical materic grain texture overlay.
 *
 * `MatericGrain` is the gate-candidate re-export of `FieldGrain`. It tiles a
 * low-opacity PNG texture over a surface to mask gradient banding and read as
 * a painted material. Drop it as the first child of a `position: relative`
 * field; it fills the field and inherits its border radius.
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative', borderRadius: 14 }}>
 *   <MatericGrain />
 *   <div style={{ padding: 24 }}>Content</div>
 * </div>
 * ```
 */
export const MatericGrain: React.FC<MatericGrainProps> = (props) => <FieldGrain {...props} />;

export default MatericGrain;
