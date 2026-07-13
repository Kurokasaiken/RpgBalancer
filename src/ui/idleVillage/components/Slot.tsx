import React, { forwardRef } from 'react';
import { SlotV12Renderer, type SlotV12RendererProps } from './SlotV12Renderer';
import { useV9Tooltip } from '@/ui/v9-skin/useV9Tooltip';

/**
 * Componente Slot componentizzato con tooltip integrato.
 * Ogni istanza di Slot eredita automaticamente il tooltip glassmorphic V9.
 * Fallback a title nativo se V9TooltipProvider non è montato.
 */
export interface SlotProps {
  /** Testo del tooltip; se assente non viene mostrato alcun tooltip. */
  tooltip?: string;
  /** Props passate al renderizzatore visivo SlotV12Renderer. */
  slotProps?: SlotV12RendererProps;
  /** Props passate al div wrapper (eventi, stili, data-*). */
  wrapperProps?: React.ComponentPropsWithoutRef<'div'> & { [key: `data-${string}`]: string | undefined };
  /** Contenuto overlay dello slot (es. token del personaggio). */
  children?: React.ReactNode;
}

export const Slot = forwardRef<HTMLDivElement, SlotProps>(({
  tooltip,
  slotProps,
  wrapperProps = {},
  children,
}, ref) => {
  const tooltipProps = useV9Tooltip(tooltip ?? '');

  return (
    <div
      ref={ref}
      {...wrapperProps}
      {...tooltipProps}
      className={['relative inline-block', wrapperProps.className].filter(Boolean).join(' ')}
      style={wrapperProps.style}
    >
      <SlotV12Renderer {...slotProps} />
      {children}
    </div>
  );
});

Slot.displayName = 'Slot';
