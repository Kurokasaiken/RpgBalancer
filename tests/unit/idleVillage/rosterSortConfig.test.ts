import { describe, it, expect } from 'vitest';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { 
  sortResidents, 
  DEFAULT_ROSTER_SORT_MODE,
  type RosterSortMode 
} from '@/ui/idleVillage/config/rosterSortConfig';

// Mock test data
const mockResidents: ResidentState[] = [
  {
    id: 'resident-1',
    displayName: 'Alice',
    currentHp: 80,
    fatigue: 20,
    isHero: false,
    isInjured: false,
    survivalScore: 100,
    statSnapshot: { displayName: 'Alice' }
  },
  {
    id: 'resident-2', 
    displayName: 'Bob',
    currentHp: 100,
    fatigue: 10,
    isHero: false,
    isInjured: false,
    survivalScore: 90,
    statSnapshot: { displayName: 'Bob' }
  },
  {
    id: 'resident-3',
    displayName: 'Charlie',
    currentHp: 60,
    fatigue: 30,
    isHero: false,
    isInjured: false,
    survivalScore: 80,
    statSnapshot: { displayName: 'Charlie' }
  }
] as ResidentState[];

describe('Roster Sort Configuration', () => {
  it('should sort by name ascending (A -> Z) by default', () => {
    const sorted = sortResidents(mockResidents, DEFAULT_ROSTER_SORT_MODE);
    expect(sorted[0].displayName).toBe('Alice');
    expect(sorted[1].displayName).toBe('Bob');
    expect(sorted[2].displayName).toBe('Charlie');
  });

  it('should sort by name ascending (A -> Z)', () => {
    const sorted = sortResidents(mockResidents, 'name-asc');
    expect(sorted[0].displayName).toBe('Alice');
    expect(sorted[1].displayName).toBe('Bob');
    expect(sorted[2].displayName).toBe('Charlie');
  });

  it('should sort by name descending (Z -> A)', () => {
    const sorted = sortResidents(mockResidents, 'name-desc');
    expect(sorted[0].displayName).toBe('Charlie');
    expect(sorted[1].displayName).toBe('Bob');
    expect(sorted[2].displayName).toBe('Alice');
  });

  it('should sort by HP descending (highest first)', () => {
    const sorted = sortResidents(mockResidents, 'hp-desc');
    expect(sorted[0].currentHp).toBe(100); // Bob
    expect(sorted[1].currentHp).toBe(80);  // Alice
    expect(sorted[2].currentHp).toBe(60);  // Charlie
  });

  it('should sort by fatigue ascending (lowest first)', () => {
    const sorted = sortResidents(mockResidents, 'fatigue-asc');
    expect(sorted[0].fatigue).toBe(10);  // Bob
    expect(sorted[1].fatigue).toBe(20);  // Alice
    expect(sorted[2].fatigue).toBe(30);  // Charlie
  });

  it('should use displayName for alphabetical sorting', () => {
    // Test with residents that have different displayName vs id
    const residentsWithDifferentNames: ResidentState[] = [
      {
        id: 'z-resident',
        displayName: 'Alpha',
        currentHp: 50,
        fatigue: 15,
        isHero: false,
        isInjured: false,
        survivalScore: 70,
        statSnapshot: { displayName: 'Alpha' }
      },
      {
        id: 'a-resident',
        displayName: 'Zulu',
        currentHp: 50,
        fatigue: 15,
        isHero: false,
        isInjured: false,
        survivalScore: 70,
        statSnapshot: { displayName: 'Zulu' }
      }
    ] as ResidentState[];

    const sorted = sortResidents(residentsWithDifferentNames, 'name-asc');
    expect(sorted[0].displayName).toBe('Alpha');  // Should use displayName, not id
    expect(sorted[1].displayName).toBe('Zulu');
  });

  it('should handle empty resident array', () => {
    const sorted = sortResidents([], 'name-asc');
    expect(sorted).toEqual([]);
  });

  it('should handle single resident', () => {
    const singleResident = [mockResidents[0]];
    const sorted = sortResidents(singleResident, 'name-asc');
    expect(sorted).toEqual(singleResident);
  });
});
