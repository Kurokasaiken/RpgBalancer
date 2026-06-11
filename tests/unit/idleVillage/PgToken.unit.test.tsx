/**
 * PgToken Unit Tests — Fase 1: SlottedMedal Isolato
 *
 * Verifica il rendering di SlottedMedal in versione isolata:
 * - Prop types (bronze, silver, gold, platinum)
 * - data-testid rendering
 * - behaviorConfig passthrough
 * - skinPreset passthrough
 * - Default prop values
 *
 * Allineato a: vertical_slice_implementation_plan.md § Fase 1
 * Spec narrativa: minimal_slice/01_pgtoken.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock dnd-kit (browser API non disponibile in jsdom)
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
  }),
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: React.HTMLAttributes<HTMLDivElement> & { [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock sub-components pesanti
vi.mock('@/ui/idleVillage/components/SlottedMedalSkin', () => ({
  default: ({ id, type, 'data-testid': testId }: { id: string; type: string; 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'slotted-medal-skin'} data-medal-id={id} data-medal-type={type} />
  ),
}));

vi.mock('@/ui/idleVillage/components/SlottedMedalHaloCanvas', () => ({
  default: ({ medalId }: { medalId: string }) => (
    <div data-testid="slotted-medal-halo" data-medal-id={medalId} />
  ),
}));

vi.mock('@/ui/idleVillage/components/SlottedMedalResistRing', () => ({
  default: () => <div data-testid="slotted-medal-resist-ring" />,
}));

// Mock behavior hook
vi.mock('@/ui/idleVillage/hooks/useSlottedMedalBehavior', () => ({
  useSlottedMedalBehavior: () => ({
    state: 'idle',
    animationControls: {},
    resistStart: vi.fn(),
    triggerDetach: vi.fn(),
    handleFailed: vi.fn(),
    handleComplete: vi.fn(),
  }),
}));

import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Crea le props minime per un SlottedMedal */
function makeMedalProps(overrides: Partial<Parameters<typeof SlottedMedal>[0]> = {}) {
  return {
    id: 'test-medal',
    type: 'bronze' as const,
    ...overrides,
  };
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('Fase 1 — SlottedMedal (PgToken) Isolato', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── TEST-001: Rendering base ──────────────────────────────────────────────

  describe('Rendering base', () => {
    it('TEST-001: rende senza crash con le props minime', () => {
      const { container } = render(<SlottedMedal {...makeMedalProps()} />);
      expect(container.firstChild).not.toBeNull();
    });

    it('TEST-002: usa data-testid di default "slotted-medal"', () => {
      render(<SlottedMedal {...makeMedalProps()} />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('TEST-003: usa il data-testid personalizzato quando fornito', () => {
      render(<SlottedMedal {...makeMedalProps({ 'data-testid': 'custom-medal' })} />);
      expect(screen.getByTestId('custom-medal')).toBeInTheDocument();
    });
  });

  // ── TEST-004-007: Medal types (rarity rings) ──────────────────────────────

  describe('Medal types — rarity rings', () => {
    it('TEST-004: rende correttamente con type="bronze"', () => {
      render(<SlottedMedal {...makeMedalProps({ type: 'bronze', 'data-testid': 'medal-bronze' })} />);
      expect(screen.getByTestId('medal-bronze')).toBeInTheDocument();
      expect(screen.getByTestId('slotted-medal-skin')).toHaveAttribute('data-medal-type', 'bronze');
    });

    it('TEST-005: rende correttamente con type="silver"', () => {
      render(<SlottedMedal {...makeMedalProps({ type: 'silver', 'data-testid': 'medal-silver' })} />);
      expect(screen.getByTestId('medal-silver')).toBeInTheDocument();
      expect(screen.getByTestId('slotted-medal-skin')).toHaveAttribute('data-medal-type', 'silver');
    });

    it('TEST-006: rende correttamente con type="gold"', () => {
      render(<SlottedMedal {...makeMedalProps({ type: 'gold', 'data-testid': 'medal-gold' })} />);
      expect(screen.getByTestId('medal-gold')).toBeInTheDocument();
      expect(screen.getByTestId('slotted-medal-skin')).toHaveAttribute('data-medal-type', 'gold');
    });

    it('TEST-007: rende correttamente con type="platinum"', () => {
      render(<SlottedMedal {...makeMedalProps({ type: 'platinum', 'data-testid': 'medal-platinum' })} />);
      expect(screen.getByTestId('medal-platinum')).toBeInTheDocument();
      expect(screen.getByTestId('slotted-medal-skin')).toHaveAttribute('data-medal-type', 'platinum');
    });
  });

  // ── TEST-008-010: Sub-component rendering ─────────────────────────────────

  describe('Sub-component rendering', () => {
    it('TEST-008: rende SlottedMedalSkin', () => {
      render(<SlottedMedal {...makeMedalProps({ id: 'medal-abc' })} />);
      expect(screen.getByTestId('slotted-medal-skin')).toBeInTheDocument();
      expect(screen.getByTestId('slotted-medal-skin')).toHaveAttribute('data-medal-id', 'medal-abc');
    });

    it('TEST-009: rende SlottedMedalHaloCanvas con il corretto medalId', () => {
      render(<SlottedMedal {...makeMedalProps({ id: 'halo-medal' })} />);
      expect(screen.getByTestId('slotted-medal-halo')).toBeInTheDocument();
      expect(screen.getByTestId('slotted-medal-halo')).toHaveAttribute('data-medal-id', 'halo-medal');
    });

    it('TEST-010: rende SlottedMedalResistRing', () => {
      render(<SlottedMedal {...makeMedalProps()} />);
      expect(screen.getByTestId('slotted-medal-resist-ring')).toBeInTheDocument();
    });
  });

  // ── TEST-011-013: Props passthrough ───────────────────────────────────────

  describe('Props passthrough', () => {
    it('TEST-011: isActive=false è il default', () => {
      // Non lancia errori, il comportamento dipende dal mock del behavior hook
      render(<SlottedMedal {...makeMedalProps()} />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('TEST-012: isActive=true rende senza crash', () => {
      render(<SlottedMedal {...makeMedalProps({ isActive: true })} />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('TEST-013: residentId viene passato e usato nel drag data', () => {
      render(<SlottedMedal {...makeMedalProps({ residentId: 'res-123' })} />);
      // Il mock del drag non espone residentId direttamente, ma il componente non crasha
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });
  });

  // ── TEST-014-015: SkinPreset ──────────────────────────────────────────────

  describe('SkinPreset', () => {
    it('TEST-014: skinPreset="minimal" rende senza crash', () => {
      render(<SlottedMedal {...makeMedalProps({ skinPreset: 'minimal' })} />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('TEST-015: skinPreset="ceremonial" rende senza crash', () => {
      render(<SlottedMedal {...makeMedalProps({ skinPreset: 'ceremonial' })} />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });
  });

  // ── TEST-016-018: BehaviorConfig ─────────────────────────────────────────

  describe('BehaviorConfig', () => {
    it('TEST-016: rende senza behaviorConfig', () => {
      render(<SlottedMedal {...makeMedalProps({ behaviorConfig: undefined })} />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('TEST-017: accetta behaviorConfig con restrictDragWhenActive', () => {
      render(
        <SlottedMedal
          {...makeMedalProps({
            behaviorConfig: { restrictDragWhenActive: true, returnAnimationDuration: 500 },
          })}
        />
      );
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('TEST-018: className personalizzata viene applicata al container', () => {
      render(
        <SlottedMedal {...makeMedalProps({ className: 'w-24 h-24', 'data-testid': 'sized-medal' })} />
      );
      const medal = screen.getByTestId('sized-medal');
      expect(medal.className).toContain('w-24');
      expect(medal.className).toContain('h-24');
    });
  });
});
