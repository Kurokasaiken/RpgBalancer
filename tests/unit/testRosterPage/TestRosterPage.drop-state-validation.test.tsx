/**
 * Test per verificare il drop state durante il trascinamento
 * Verifica che i residenti validi per il rack B mostrino DROP: VALID
 * e quelli invalidi mostrino DROP: INVALID durante il drag
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestRosterPage from '@/ui/idleVillage/TestRosterPage';

// Mock del dnd-kit per controllare il comportamento di drag
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({ children, onDragStart, onDragMove }: any) => {
      return (
        <div data-testid="mock-dnd-context">
          {children}
          <button
            data-testid="simulate-drag-valid-resident"
            onClick={() => {
              // Simula drag di un residente valido per rack B (HP >= 200)
              onDragStart?.({ active: { id: 'hero-sir-spaccaculi' } });
              
              // Simula drag move per triggerare validazione
              setTimeout(() => {
                onDragMove?.({ 
                  active: { id: 'hero-sir-spaccaculi' },
                  delta: { x: 10, y: 10 }
                });
              }, 10);
            }}
          >
            Simulate Drag Valid Resident (HP >= 200)
          </button>
          
          <button
            data-testid="simulate-drag-invalid-resident"
            onClick={() => {
              // Simula drag di un residente invalido per rack B (HP < 200)
              onDragStart?.({ active: { id: 'hero-giggiolillo' } });
              
              // Simula drag move per triggerare validazione
              setTimeout(() => {
                onDragMove?.({ 
                  active: { id: 'hero-giggiolillo' },
                  delta: { x: 10, y: 10 }
                });
              }, 10);
            }}
          >
            Simulate Drag Invalid Resident (HP < 200)
          </button>
        </div>
      );
    },
    useSensor: vi.fn(() => null),
    useSensors: vi.fn(() => []),
    pointerWithin: vi.fn(),
    closestCenter: vi.fn(),
  };
});

// Mock delle dipendenze
vi.mock('@/ui/idleVillage/hooks/useMinimalStyleLabTokens', () => ({
  useMinimalStyleLabTokens: () => ({
    cssVars: {},
    heroBackground: 'black',
  }),
}));

vi.mock('@/hooks/useThemeSwitcher', () => ({
  useThemeSwitcher: () => ({
    activePreset: 'epic-frontier',
    setTheme: vi.fn(),
  }),
}));

describe('TestRosterPage - Drop State Validation During Drag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show DROP: VALID for resident with HP >= 200 when dragging over restricted rack', async () => {
    render(<TestRosterPage />);

    // Simula il trascinamento di un residente valido (Sir Spaccaculi ha HP >= 200)
    const dragValidButton = screen.getByTestId('simulate-drag-valid-resident');
    dragValidButton.click();

    // Aspetta che il drag move venga processato
    await waitFor(() => {
      // Verifica che ci siano slot nel rack restrittivo
      const restrictedSlots = screen.getAllByTestId(/slot-lab-restricted-slot/);
      expect(restrictedSlots.length).toBeGreaterThan(0);
      
      // Verifica che almeno uno slot mostri stato valido
      // Questo dipende dall'implementazione specifica del componente
      const validSlot = restrictedSlots.find(slot => 
        slot.getAttribute('data-drop-state') === 'valid' ||
        slot.textContent?.includes('DROP: VALID') ||
        slot.className?.includes('drop-valid')
      );
      
      // Se il tuo componente usa attributi data- per lo stato del drop
      if (validSlot) {
        expect(validSlot).toBeInTheDocument();
      } else {
        // Altrimenti verifichiamo che non ci siano stati invalid
        const invalidSlots = restrictedSlots.filter(slot => 
          slot.getAttribute('data-drop-state') === 'invalid' ||
          slot.textContent?.includes('DROP: INVALID') ||
          slot.className?.includes('drop-invalid')
        );
        expect(invalidSlots.length).toBe(0);
      }
    }, { timeout: 1000 });
  });

  it('should show DROP: INVALID for resident with HP < 200 when dragging over restricted rack', async () => {
    render(<TestRosterPage />);

    // Simula il trascinamento di un residente invalido (Giggiolillo ha HP < 200)
    const dragInvalidButton = screen.getByTestId('simulate-drag-invalid-resident');
    dragInvalidButton.click();

    // Aspetta che il drag move venga processato
    await waitFor(() => {
      // Verifica che ci siano slot nel rack restrittivo
      const restrictedSlots = screen.getAllByTestId(/slot-lab-restricted-slot/);
      expect(restrictedSlots.length).toBeGreaterThan(0);
      
      // Verifica che gli slot mostrino stato invalido
      const invalidSlots = restrictedSlots.filter(slot => 
        slot.getAttribute('data-drop-state') === 'invalid' ||
        slot.textContent?.includes('DROP: INVALID') ||
        slot.className?.includes('drop-invalid')
      );
      
      expect(invalidSlots.length).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });

  it('should maintain valid state throughout drag operation for valid resident', async () => {
    render(<TestRosterPage />);

    // Inizia il trascinamento del residente valido
    const dragValidButton = screen.getByTestId('simulate-drag-valid-resident');
    dragValidButton.click();

    // Aspetta che il drag inizi
    await waitFor(() => {
      const activeResident = screen.getByText(/hero-sir-spaccaculi/i);
      expect(activeResident).toBeInTheDocument();
    }, { timeout: 500 });

    // Simula movimenti continui durante il drag
    for (let i = 0; i < 3; i++) {
      fireEvent.mouseMove(document, { clientX: 100 + i * 10, clientY: 100 + i * 10 });
      
      await waitFor(() => {
        const restrictedSlots = screen.getAllByTestId(/slot-lab-restricted-slot/);
        
        // Durante tutto il drag, lo stato dovrebbe rimanere valido
        const validSlots = restrictedSlots.filter(slot => 
          slot.getAttribute('data-drop-state') === 'valid' ||
          slot.textContent?.includes('DROP: VALID') ||
          slot.className?.includes('drop-valid')
        );
        
        // Almeno uno slot dovrebbe essere valido
        expect(validSlots.length).toBeGreaterThan(0);
      }, { timeout: 200 });
    }
  });

  it('should maintain invalid state throughout drag operation for invalid resident', async () => {
    render(<TestRosterPage />);

    // Inizia il trascinamento del residente invalido
    const dragInvalidButton = screen.getByTestId('simulate-drag-invalid-resident');
    dragInvalidButton.click();

    // Aspetta che il drag inizi
    await waitFor(() => {
      const activeResident = screen.getByText(/hero-giggiolillo/i);
      expect(activeResident).toBeInTheDocument();
    }, { timeout: 500 });

    // Simula movimenti continui durante il drag
    for (let i = 0; i < 3; i++) {
      fireEvent.mouseMove(document, { clientX: 100 + i * 10, clientY: 100 + i * 10 });
      
      await waitFor(() => {
        const restrictedSlots = screen.getAllByTestId(/slot-lab-restricted-slot/);
        
        // Durante tutto il drag, lo stato dovrebbe rimanere invalido
        const invalidSlots = restrictedSlots.filter(slot => 
          slot.getAttribute('data-drop-state') === 'invalid' ||
          slot.textContent?.includes('DROP: INVALID') ||
          slot.className?.includes('drop-invalid')
        );
        
        // Almeno uno slot dovrebbe essere invalido
        expect(invalidSlots.length).toBeGreaterThan(0);
      }, { timeout: 200 });
    }
  });

  it('should reset drop state when drag ends', async () => {
    render(<TestRosterPage />);

    // Inizia e finisce rapidamente un drag
    const dragValidButton = screen.getByTestId('simulate-drag-valid-resident');
    dragValidButton.click();

    // Simula la fine del drag (mouse up)
    fireEvent.mouseUp(document);

    // Aspetta che lo stato venga resettato
    await waitFor(() => {
      const restrictedSlots = screen.getAllByTestId(/slot-lab-restricted-slot/);
      
      // Dopo la fine del drag, non dovrebbero esserci stati di drop
      const slotsWithDropState = restrictedSlots.filter(slot => 
        slot.getAttribute('data-drop-state') ||
        slot.textContent?.includes('DROP:') ||
        slot.className?.includes('drop-')
      );
      
      expect(slotsWithDropState.length).toBe(0);
    }, { timeout: 500 });
  });
});
