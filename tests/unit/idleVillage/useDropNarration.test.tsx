/**
 * Drop Narration Hook Test Suite
 * 
 * Comprehensive testing for VoiceOver narration system
 * with multiple languages and moodboard token support.
 * 
 * @since NP-086 – Idle Village Drop VoiceOver Narration
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDropNarration, useDropNarrationMock } from '@/ui/idleVillage/hooks/useDropNarration';
import type { DropFeedbackEvent, DropOutcomeType, NarrationContext } from '@/ui/idleVillage/hooks/useDropNarration';
import {
  DEFAULT_DROP_NARRATION_CONFIG,
  ITALIAN_LOCALE_CONFIG,
  ENGLISH_LOCALE_CONFIG,
  getNarrationTemplates,
  substituteMoodboardTokens,
} from '@/ui/idleVillage/accessibility/dropNarrationConfig';

// Mock speech synthesis
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  pending: false,
  speaking: false,
};

// Mock SpeechSynthesisUtterance globally since the hook uses the browser constructor
class MockSpeechSynthesisUtterance {
  text: string;
  lang = 'it';
  rate = 1;
  pitch = 1;
  volume = 0.8;
  onstart: ((this: SpeechSynthesisUtterance) => void) | null = null;
  onend: ((this: SpeechSynthesisUtterance) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
  onpause: ((this: SpeechSynthesisUtterance) => void) | null = null;
  onresume: ((this: SpeechSynthesisUtterance) => void) | null = null;
  onmark: ((this: SpeechSynthesisUtterance, event: SpeechSynthesisEvent) => void) | null = null;
  onboundary: ((this: SpeechSynthesisUtterance, event: SpeechSynthesisEvent) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

(globalThis as unknown as { SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
});

// Mock global telemetry
Object.defineProperty(window, '__IDLE_VILLAGE_TELEMETRY', {
  value: {
    emit: vi.fn(),
  },
  writable: true,
});

const renderWithAct = (ui: React.ReactElement) => {
  let utils: ReturnType<typeof render> | undefined;
  act(() => {
    utils = render(ui);
  });
  return utils!;
};

describe('useDropNarration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset speech synthesis mock
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const TestComponent = () => {
        const { config } = useDropNarration();
        return <div data-testid="config">{JSON.stringify(config.enabled)}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('config')).toHaveTextContent('true');
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        enabled: false,
        currentLocale: 'en',
      };

      const TestComponent = () => {
        const { config } = useDropNarration({ config: customConfig });
        return <div data-testid="config">{JSON.stringify(config.enabled)}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('config')).toHaveTextContent('false');
    });

    it('should handle locale changes', () => {
      const TestComponent = () => {
        const { config, setLocale } = useDropNarration();
        React.useEffect(() => {
          setLocale('en');
        }, [setLocale]);
        return <div data-testid="locale">{config.currentLocale}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('locale')).toHaveTextContent('en');
    });
  });

  describe('Drop Feedback Processing', () => {
    it('should process valid drop feedback', async () => {
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock();
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro in Foresta', type: 'work' },
            location: { id: 'location-1', name: 'Foresta', type: 'forest', description: 'Una foresta antica con {wilderness.timber}' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toContain('Mario');
      expect(utterance.text).toContain('Lavoro in Foresta');
      expect(utterance.text).toContain('legno grezzo'); // Moodboard token substitution
    });

    it('should process invalid drop feedback', async () => {
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock();
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'invalid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Luigi' },
            activity: { id: 'activity-1', name: 'Lavoro in Miniera', type: 'work' },
            reason: 'Resident is too tired',
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toContain('Luigi');
      expect(utterance.text).toContain('Lavoro in Miniera');
      expect(utterance.text).toContain('Resident is too tired');
    });

    it('should process warning drop feedback', async () => {
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock();
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'warning',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Peach' },
            activity: { id: 'activity-1', name: 'Lavoro in Fattoria', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toContain('Peach');
      expect(utterance.text).toContain('Lavoro in Fattoria');
      expect(utterance.text).toContain('stanco');
    });

    it('should process blocked drop feedback', async () => {
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock();
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'blocked',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Bowser' },
            activity: { id: 'activity-1', name: 'Lavoro in Castello', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toContain('Bowser');
      expect(utterance.text).toContain('Lavoro in Castello');
      expect(utterance.text).toContain('non è disponibile');
    });
  });

  describe('Multi-language Support', () => {
    it('should handle Italian locale', async () => {
      const TestComponent = () => {
        const { processDropFeedback, setLocale } = useDropNarrationMock();
        React.useEffect(() => {
          setLocale('it');
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro in Foresta', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback, setLocale]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.lang).toBe('it');
      expect(utterance.text).toContain('Mario');
      expect(utterance.text).toContain('ha iniziato a lavorare');
    });

    it('should handle English locale', async () => {
      const TestComponent = () => {
        const { processDropFeedback, setLocale } = useDropNarrationMock();
        React.useEffect(() => {
          setLocale('en');
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Work in Forest', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback, setLocale]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.lang).toBe('en');
      expect(utterance.text).toContain('Mario');
      expect(utterance.text).toContain('started working');
    });

    it('should fallback to Italian for unknown locale', async () => {
      const TestComponent = () => {
        const { processDropFeedback, setLocale } = useDropNarrationMock();
        React.useEffect(() => {
          setLocale('unknown');
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro in Foresta', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback, setLocale]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.lang).toBe('it'); // Should fallback to Italian
    });
  });

  describe('Moodboard Token Substitution', () => {
    it('should substitute wilderness tokens', () => {
      const template = 'Il residente lavora nella {wilderness.forest} con {wilderness.timber}';
      const tokens = {};
      const result = substituteMoodboardTokens(template, tokens, 'it');
      
      expect(result).toBe('Il residente lavora nella foresta antica con legno grezzo');
    });

    it('should substitute empire tokens', () => {
      const template = 'Il castello è fatto di {empire.basalt} e {empire.bronze}';
      const tokens = {};
      const result = substituteMoodboardTokens(template, tokens, 'it');
      
      expect(result).toBe('Il castello è fatto di basalto nero venato e bronzo barocco');
    });

    it('should substitute custom tokens', () => {
      const template = '{residentName} lavora in {locationName}';
      const tokens = {
        residentName: 'Mario',
        locationName: 'Foresta',
      };
      const result = substituteMoodboardTokens(template, tokens, 'it');
      
      expect(result).toBe('Mario lavora in Foresta');
    });

    it('should handle mixed tokens', () => {
      const template = '{residentName} nella {wilderness.forest} con {wilderness.timber}';
      const tokens = {
        residentName: 'Mario',
      };
      const result = substituteMoodboardTokens(template, tokens, 'it');
      
      expect(result).toBe('Mario nella foresta antica con legno grezzo');
    });
  });

  describe('Queue Management', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should queue multiple narrations', async () => {
      const TestComponent = () => {
        const { processDropFeedback, state } = useDropNarrationMock();
        
        React.useEffect(() => {
          // Add multiple narrations
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro 1', type: 'work' },
            timestamp: Date.now(),
          });
          
          processDropFeedback({
            outcome: 'invalid',
            context: 'resident_to_activity',
            resident: { id: 'resident-2', name: 'Luigi' },
            activity: { id: 'activity-2', name: 'Lavoro 2', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        
        return <div data-testid="queue-length">{state.queue.length}</div>;
      };

      const { getByTestId } = renderWithAct(<TestComponent />);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      // Should have one in queue (first is being processed)
      expect(getByTestId('queue-length')).toHaveTextContent('1');
      
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should respect minimum interval between narrations', async () => {
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock({
          config: { timing: { minIntervalMs: 1000 } }
        });
        
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro 1', type: 'work' },
            timestamp: Date.now(),
          });
          
          // Add second narration immediately
          setTimeout(() => {
            processDropFeedback({
              outcome: 'invalid',
              context: 'resident_to_activity',
              resident: { id: 'resident-2', name: 'Luigi' },
              activity: { id: 'activity-2', name: 'Lavoro 2', type: 'work' },
              timestamp: Date.now(),
            });
          }, 100);
        }, [processDropFeedback]);
        
        return <div data-testid="test">Test</div>;
      };

      renderWithAct(<TestComponent />);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });
  });

  describe('Voice Configuration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    it('should use default voice settings', async () => {
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock();
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        return <div data-testid="test">Test</div>;
      };

      renderWithAct(<TestComponent />);

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(1); // normal rate
      expect(utterance.pitch).toBe(1); // medium pitch
      expect(utterance.volume).toBe(0.8); // default volume
    });

    it('should accept custom voice settings', async () => {
      const customVoice = {
        rate: 'slow' as const,
        pitch: 'high' as const,
        volume: 0.5,
      };

      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock({ voice: customVoice });
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        return <div data-testid="test">Test</div>;
      };

      renderWithAct(<TestComponent />);

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(0.8); // slow rate
      expect(utterance.pitch).toBe(1.2); // high pitch
      expect(utterance.volume).toBe(0.5); // custom volume
    });
  });

  describe('Telemetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should emit telemetry events', async () => {
      const mockTelemetry = (window as any).__IDLE_VILLAGE_TELEMETRY;
      
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock();
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(mockTelemetry.emit).toHaveBeenCalledWith('iv_drop_voiceover_played', expect.objectContaining({
          text: expect.stringContaining('Mario'),
          outcome: 'valid',
          context: 'resident_to_activity',
          locale: 'it',
          residentId: 'resident-1',
          activityId: 'activity-1',
        }));
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle missing templates gracefully', () => {
      const TestComponent = () => {
        const { processDropFeedback } = useDropNarrationMock();
        
        React.useEffect(() => {
          // This should not crash even if templates are missing
          processDropFeedback({
            outcome: 'valid',
            context: 'unknown_context' as NarrationContext,
            resident: { id: 'resident-1', name: 'Mario' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);

      act(() => {
        vi.runAllTimers();
      });
      
      // Should not speak anything due to missing templates
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should handle speech synthesis errors', async () => {
      // Mock speech synthesis error
      const mockUtterance = {
        text: 'test',
        lang: 'it',
        rate: 1,
        pitch: 1,
        volume: 0.8,
        onstart: null,
        onend: null,
        onerror: null,
      };

      // Simulate error
      setTimeout(() => {
        if (mockUtterance.onerror) {
          mockUtterance.onerror({ error: 'network' } as any);
        }
      }, 10);

      const TestComponent = () => {
        const { processDropFeedback, onNarrationError } = useDropNarrationMock({
          onNarrationError: vi.fn(),
        });
        
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro', type: 'work' },
            timestamp: Date.now(),
          });
        }, [processDropFeedback]);
        
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('Control Functions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should stop current narration', () => {
      const TestComponent = () => {
        const { processDropFeedback, stop } = useDropNarrationMock();
        
        React.useEffect(() => {
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro', type: 'work' },
            timestamp: Date.now(),
          });
          
          // Stop immediately
          setTimeout(() => stop(), 50);
        }, [processDropFeedback, stop]);
        
        return <div data-testid="test">Test</div>;
      };

      act(() => {
        render(<TestComponent />);
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should clear queue', async () => {
      const TestComponent = () => {
        const { processDropFeedback, state, clearQueue } = useDropNarrationMock();
        
        React.useEffect(() => {
          // Add multiple narrations
          processDropFeedback({
            outcome: 'valid',
            context: 'resident_to_activity',
            resident: { id: 'resident-1', name: 'Mario' },
            activity: { id: 'activity-1', name: 'Lavoro 1', type: 'work' },
            timestamp: Date.now(),
          });
          
          processDropFeedback({
            outcome: 'invalid',
            context: 'resident_to_activity',
            resident: { id: 'resident-2', name: 'Luigi' },
            activity: { id: 'activity-2', name: 'Lavoro 2', type: 'work' },
            timestamp: Date.now(),
          });
          
          clearQueue();
        }, [processDropFeedback, clearQueue]);
        
        return <div data-testid="queue-length">{state.queue.length}</div>;
      };

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => {
        expect(getByTestId('queue-length')).toHaveTextContent('0');
      });
    });

    it('should speak custom text', async () => {
      const TestComponent = () => {
        const { speak } = useDropNarration();
        
        React.useEffect(() => {
          speak('Custom narration message');
        }, [speak]);
        
        return <div data-testid="test">Test</div>;
      };

      render(<TestComponent />);

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toBe('Custom narration message');
    });
  });
});

describe('Drop Narration Configuration', () => {
  describe('Template Retrieval', () => {
    it('should get Italian templates', () => {
      const templates = getNarrationTemplates('valid', 'resident_to_activity', 'it');
      expect(templates).toHaveLength(2);
      expect(templates[0].template).toContain('{residentName}');
      expect(templates[0].priority).toBe('polite');
    });

    it('should get English templates', () => {
      const templates = getNarrationTemplates('valid', 'resident_to_activity', 'en');
      expect(templates).toHaveLength(2);
      expect(templates[0].template).toContain('{residentName}');
      expect(templates[0].priority).toBe('polite');
    });

    it('should fallback to Italian templates for unknown locale', () => {
      const templates = getNarrationTemplates('valid', 'resident_to_activity', 'unknown');
      expect(templates).toHaveLength(2);
      expect(templates[0].template).toContain('{residentName} ha iniziato a lavorare');
    });
  });

  describe('Locale Configuration', () => {
    it('should have Italian locale with moodboard tokens', () => {
      expect(ITALIAN_LOCALE_CONFIG.locale).toBe('it');
      expect(ITALIAN_LOCALE_CONFIG.displayName).toBe('Italiano');
      expect(ITALIAN_LOCALE_CONFIG.moodboardTokens).toBeDefined();
      expect(ITALIAN_LOCALE_CONFIG.moodboardTokens['wilderness.timber']).toBe('legno grezzo');
    });

    it('should have English locale with moodboard tokens', () => {
      expect(ENGLISH_LOCALE_CONFIG.locale).toBe('en');
      expect(ENGLISH_LOCALE_CONFIG.displayName).toBe('English');
      expect(ENGLISH_LOCALE_CONFIG.moodboardTokens).toBeDefined();
      expect(ENGLISH_LOCALE_CONFIG.moodboardTokens['wilderness.timber']).toBe('raw timber');
    });
  });

  describe('Default Configuration', () => {
    it('should have correct default settings', () => {
      expect(DEFAULT_DROP_NARRATION_CONFIG.enabled).toBe(true);
      expect(DEFAULT_DROP_NARRATION_CONFIG.currentLocale).toBe('it');
      expect(DEFAULT_DROP_NARRATION_CONFIG.locales).toHaveLength(2);
      expect(DEFAULT_DROP_NARRATION_CONFIG.timing.initialDelayMs).toBe(100);
      expect(DEFAULT_DROP_NARRATION_CONFIG.timing.minIntervalMs).toBe(500);
      expect(DEFAULT_DROP_NARRATION_CONFIG.features.enableMoodboardTokens).toBe(true);
    });
  });
});
