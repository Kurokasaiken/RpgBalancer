/**
 * Quest Detail Lens Types
 * 
 * Type definitions for the Quest Detail Lens component.
 * 
 * @since IV-Phase12-quest-detail-lens
 * @author Aurora-Quest
 */

/**
 * Props for the QuestDetailLens component
 */
export interface QuestDetailLensProps {
  /** Optional className for styling overrides */
  className?: string;
  /** Whether to run in test mode (uses test config) */
  testMode?: boolean;
  /** Optional callback when lens is closed */
  onClose?: () => void;
  /** Optional callback for risk stripe clicks */
  onRiskStripeClick?: (type: 'injury' | 'death', percentage: number) => void;
}
