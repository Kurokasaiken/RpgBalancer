import React from 'react';
import {
  WanderlustRecordList,
  type WanderlustRecordListProps,
  type RecordColumn,
} from '@/ui/wanderlust-surface/layout/WanderlustLayout';

export type { RecordColumn as MatericRecordColumn };
export interface MatericRecordListProps extends WanderlustRecordListProps {}

/**
 * Canonical materic record list with optional rail and columns.
 */
export const MatericRecordList: React.FC<MatericRecordListProps> = (props) => (
  <WanderlustRecordList {...props} />
);

export default MatericRecordList;
