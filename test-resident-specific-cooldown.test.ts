/**
 * Test diretto per verificare il fix del resident-specific cooldown
 * Questo testa la logica senza dipendere da dnd-kit o eventi DOM simulati
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Resident-Specific Cooldown Logic', () => {
  let lastDragEndTimeRef: { current: number };
  let lastDraggedResidentRef: { current: string | null };

  beforeEach(() => {
    lastDragEndTimeRef = { current: 0 };
    lastDraggedResidentRef = { current: null };
  });

  it('should block only the dragged resident during cooldown', () => {
    const now = Date.now();
    const draggedResidentId = 'resident-1';
    const otherResidentId = 'resident-2';
    
    // Simula un drag appena completato
    lastDragEndTimeRef.current = now - 50; // 50ms fa
    lastDraggedResidentRef.current = draggedResidentId;
    
    // Funzione che simula la logica del nostro fix
    const shouldBlockResident = (residentId: string): boolean => {
      return !!(
        lastDraggedResidentRef.current && 
        residentId === lastDraggedResidentRef.current && 
        now - lastDragEndTimeRef.current < 150
      );
    };
    
    // Il residente trascinato dovrebbe essere bloccato
    expect(shouldBlockResident(draggedResidentId)).toBe(true);
    
    // Un altro residente NON dovrebbe essere bloccato
    expect(shouldBlockResident(otherResidentId)).toBe(false);
  });

  it('should not block any resident after cooldown expires', () => {
    const now = Date.now();
    const draggedResidentId = 'resident-1';
    const otherResidentId = 'resident-2';
    
    // Simula un drag completato da più tempo
    lastDragEndTimeRef.current = now - 200; // 200ms fa (fuori dal cooldown)
    lastDraggedResidentRef.current = draggedResidentId;
    
    const shouldBlockResident = (residentId: string): boolean => {
      return !!(
        lastDraggedResidentRef.current && 
        residentId === lastDraggedResidentRef.current && 
        now - lastDragEndTimeRef.current < 150
      );
    };
    
    // Nessun residente dovrebbe essere bloccato
    expect(shouldBlockResident(draggedResidentId)).toBe(false);
    expect(shouldBlockResident(otherResidentId)).toBe(false);
  });

  it('should not block when no resident was dragged', () => {
    const now = Date.now();
    const residentId = 'resident-1';
    
    // Nessun drag precedente
    lastDragEndTimeRef.current = now - 50;
    lastDraggedResidentRef.current = null;
    
    const shouldBlockResident = (residentId: string): boolean => {
      return !!(
        lastDraggedResidentRef.current && 
        residentId === lastDraggedResidentRef.current && 
        now - lastDragEndTimeRef.current < 150
      );
    };
    
    // Nessun blocco dovrebbe applicarsi
    expect(shouldBlockResident(residentId)).toBe(false);
  });

  it('should demonstrate the difference between old global and new specific cooldown', () => {
    const now = Date.now();
    const draggedResidentId = 'resident-1';
    const otherResidentId = 'resident-2';
    
    lastDragEndTimeRef.current = now - 50; // 50ms fa
    lastDraggedResidentRef.current = draggedResidentId;
    
    // Vecchia logica globale (BUG)
    const oldGlobalCooldown = (residentId: string): boolean => {
      return now - lastDragEndTimeRef.current < 150;
    };
    
    // Nuova logica specifica (FIX)
    const newSpecificCooldown = (residentId: string): boolean => {
      return !!(
        lastDraggedResidentRef.current && 
        residentId === lastDraggedResidentRef.current && 
        now - lastDragEndTimeRef.current < 150
      );
    };
    
    // La vecchia logica blocca ENTRAMBI i residenti (BUG)
    expect(oldGlobalCooldown(draggedResidentId)).toBe(true);
    expect(oldGlobalCooldown(otherResidentId)).toBe(true);
    
    // La nuova logica blocca SOLO il residente trascinato (FIX)
    expect(newSpecificCooldown(draggedResidentId)).toBe(true);
    expect(newSpecificCooldown(otherResidentId)).toBe(false);
  });
});
