export type ResidentCompatibilityState = 'idle' | 'valid' | 'invalid';

export interface ResidentCompatibility {
  state: ResidentCompatibilityState;
  slotLabel?: string;
  slotId?: string;
  reason?: string;
}

export type GetResidentCompatibility = (residentId: string) => ResidentCompatibility | undefined;

export type DragFeedbackState = 'idle' | 'valid' | 'invalid' | 'returning';
