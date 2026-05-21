/**
 * useActivityCardState Hook
 *
 * State machine for activity card lifecycle:
 * empty → occupied → timer → skill check → victory → reset
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type ActivityCardState =
  | 'empty'          // No residents assigned
  | 'occupied'       // Resident(s) assigned, timer not started
  | 'timer'          // Timer running, progress bar filling
  | 'skill_check'    // Dice roll animation
  | 'victory'        // Victory overlay shown
  | 'awaiting_claim' // Victory shown, waiting for player to dismiss
  | 'reset';         // Transitioning back to empty

export interface ActivityCardStateData {
  state: ActivityCardState;
  occupancy: number;
  maxSlots: number;
  timerProgress: number; // 0 to 1
  skillCheckResult?: {
    rolled: number;
    skill: number;
    dc: number;
    total: number;
    success: boolean;
  };
  victory?: {
    title: string;
    rewards: Record<string, number>;
  };
  error?: string;
}

export interface UseActivityCardStateReturn {
  data: ActivityCardStateData;
  assignResident: (residentId: string) => void;
  removeResident: (residentId: string) => void;
  startTimer: (durationMs: number) => void;
  updateTimerProgress: (progress: number) => void;
  triggerSkillCheck: (rolled: number, skill: number, dc: number) => void;
  showVictory: (title: string, rewards: Record<string, number>) => void;
  claimVictory: () => void;
  reset: () => void;
  setError: (message: string) => void;
}

export const useActivityCardState = (
  initialOccupancy: number = 0,
  maxSlots: number = 2,
): UseActivityCardStateReturn => {
  const [data, setData] = useState<ActivityCardStateData>({
    state: 'empty',
    occupancy: initialOccupancy,
    maxSlots,
    timerProgress: 0,
  });

  const residentIdsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const assignResident = useCallback((residentId: string) => {
    residentIdsRef.current.add(residentId);
    setData((prev) => {
      const newOccupancy = Math.min(prev.occupancy + 1, prev.maxSlots);
      return {
        ...prev,
        occupancy: newOccupancy,
        state: newOccupancy > 0 ? 'occupied' : 'empty',
      };
    });
  }, []);

  const removeResident = useCallback((residentId: string) => {
    residentIdsRef.current.delete(residentId);
    setData((prev) => {
      const newOccupancy = Math.max(prev.occupancy - 1, 0);
      return {
        ...prev,
        occupancy: newOccupancy,
        state: newOccupancy === 0 ? 'empty' : 'occupied',
      };
    });
  }, []);

  const startTimer = useCallback((durationMs: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setData((prev) => ({
      ...prev,
      state: 'timer',
      timerProgress: 0,
    }));

    const startTime = Date.now();
    const tickInterval = 50; // Update every 50ms

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      setData((prev) => ({
        ...prev,
        timerProgress: progress,
      }));

      if (progress < 1) {
        timerRef.current = setTimeout(updateProgress, tickInterval);
      }
    };

    timerRef.current = setTimeout(updateProgress, tickInterval);
  }, []);

  const updateTimerProgress = useCallback((progress: number) => {
    setData((prev) => ({
      ...prev,
      timerProgress: Math.min(Math.max(progress, 0), 1),
    }));
  }, []);

  const triggerSkillCheck = useCallback((rolled: number, skill: number, dc: number) => {
    const total = rolled + skill;
    const success = total >= dc;

    setData((prev) => ({
      ...prev,
      state: 'skill_check',
      skillCheckResult: {
        rolled,
        skill,
        dc,
        total,
        success,
      },
    }));

    // Auto-transition to victory if successful (after skill check animation)
    if (success) {
      timerRef.current = setTimeout(() => {
        setData((prev) => ({
          ...prev,
          state: 'victory',
        }));
      }, 2000); // Animation duration
    } else {
      timerRef.current = setTimeout(() => {
        setData((prev) => ({
          ...prev,
          state: 'reset',
        }));
      }, 2000);
    }
  }, []);

  const showVictory = useCallback((title: string, rewards: Record<string, number>) => {
    setData((prev) => ({
      ...prev,
      state: 'awaiting_claim',
      victory: {
        title,
        rewards,
      },
    }));
  }, []);

  const claimVictory = useCallback(() => {
    setData((prev) => ({
      ...prev,
      state: 'reset',
    }));

    timerRef.current = setTimeout(() => {
      setData((prev) => ({
        ...prev,
        state: 'empty',
        occupancy: 0,
        timerProgress: 0,
        skillCheckResult: undefined,
        victory: undefined,
      }));
      residentIdsRef.current.clear();
    }, 500);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setData((prev) => ({
      ...prev,
      state: 'empty',
      occupancy: 0,
      timerProgress: 0,
      skillCheckResult: undefined,
      victory: undefined,
    }));

    residentIdsRef.current.clear();
  }, []);

  const setError = useCallback((message: string) => {
    setData((prev) => ({
      ...prev,
      error: message,
    }));
  }, []);

  return {
    data,
    assignResident,
    removeResident,
    startTimer,
    updateTimerProgress,
    triggerSkillCheck,
    showVictory,
    claimVictory,
    reset,
    setError,
  };
};
