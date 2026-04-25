import { useState, useEffect, useMemo, useCallback } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const telemetryDiagnostics = createHeadlessDiagnostics('STSTelemetrySession');

/**
 * STS telemetry session data structure
 */
export interface STSTelemetrySession {
  /** Unique session identifier */
  sessionId: string;
  /** Session start timestamp */
  startTime: number;
  /** Session end timestamp (null if active) */
  endTime: number | null;
  /** Current run ID being recorded */
  currentRunId: string | null;
  /** All run IDs in this session */
  runIds: string[];
  /** Session metadata */
  metadata: {
    userAgent: string;
    platform: string;
    seed: number;
    deckId: string;
    enemyId: string;
  };
  /** Session events count */
  eventCount: number;
  /** Session duration in milliseconds */
  duration: number;
}

/**
 * Session persistence configuration
 */
export interface STSSessionConfig {
  /** Session storage key */
  storageKey: string;
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number;
  /** Maximum session duration in milliseconds */
  maxSessionDuration: number;
  /** Enable session recovery on app start */
  enableRecovery: boolean;
}

const DEFAULT_SESSION_CONFIG: STSSessionConfig = {
  storageKey: 'sts-telemetry-session',
  autoSaveInterval: 5000, // 5 seconds
  maxSessionDuration: 3600000, // 1 hour
  enableRecovery: true,
};

/**
 * Hook for managing STS telemetry session persistence
 * 
 * @param config - Session configuration options
 * @returns Session state and management functions
 */
export function useSTSTelemetryData(config: Partial<STSSessionConfig> = {}) {
  const sessionConfig = useMemo(() => ({ ...DEFAULT_SESSION_CONFIG, ...config }), [config]);
  
  const [session, setSession] = useState<STSTelemetrySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `sts-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize or recover session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (sessionConfig.enableRecovery) {
          // Try to recover existing session
          const recoveredSession = await loadData<STSTelemetrySession>(
            sessionConfig.storageKey,
            null
          );
          
          if (recoveredSession && recoveredSession.endTime === null) {
            // Check if session is still valid
            const sessionAge = Date.now() - recoveredSession.startTime;
            if (sessionAge < sessionConfig.maxSessionDuration) {
              setSession(recoveredSession);
              telemetryDiagnostics.info('session_recovered', {
                sessionId: recoveredSession.sessionId,
                age: sessionAge,
              });
              return;
            } else {
              // Session expired, end it
              const expiredSession = {
                ...recoveredSession,
                endTime: recoveredSession.startTime + sessionConfig.maxSessionDuration,
                duration: sessionConfig.maxSessionDuration,
              };
              await saveData(sessionConfig.storageKey, expiredSession);
              telemetryDiagnostics.info('session_expired', {
                sessionId: recoveredSession.sessionId,
                age: sessionAge,
              });
            }
          }
        }

        // Create new session
        const newSession: STSTelemetrySession = {
          sessionId: generateSessionId(),
          startTime: Date.now(),
          endTime: null,
          currentRunId: null,
          runIds: [],
          metadata: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            seed: 0, // Will be set when simulation starts
            deckId: '',
            enemyId: '',
          },
          eventCount: 0,
          duration: 0,
        };

        setSession(newSession);
        await saveData(sessionConfig.storageKey, newSession);
        telemetryDiagnostics.info('session_created', {
          sessionId: newSession.sessionId,
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        telemetryDiagnostics.error('session_init_failed', {
          error: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [sessionConfig, generateSessionId]);

  // Auto-save session
  useEffect(() => {
    if (!session || session.endTime !== null) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const updatedSession = {
          ...session,
          duration: Date.now() - session.startTime,
        };
        await saveData(sessionConfig.storageKey, updatedSession);
        setSession(updatedSession);
        telemetryDiagnostics.debug('session_auto_saved', {
          sessionId: session.sessionId,
          duration: updatedSession.duration,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        telemetryDiagnostics.error('session_auto_save_failed', {
          sessionId: session.sessionId,
          error: errorMessage,
        });
      }
    }, sessionConfig.autoSaveInterval);

    return () => clearInterval(autoSaveInterval);
  }, [session, sessionConfig]);

  // Start a new run
  const startRun = useCallback(async (runId: string, metadata: Partial<STSTelemetrySession['metadata']>) => {
    if (!session || session.endTime !== null) {
      throw new Error('Cannot start run: no active session');
    }

    try {
      const updatedSession = {
        ...session,
        currentRunId: runId,
        runIds: [...session.runIds, runId],
        metadata: {
          ...session.metadata,
          ...metadata,
        },
        eventCount: session.eventCount + 1,
      };

      setSession(updatedSession);
      await saveData(sessionConfig.storageKey, updatedSession);
      
      telemetryDiagnostics.info('run_started', {
        sessionId: session.sessionId,
        runId,
        totalRuns: updatedSession.runIds.length,
      });

      return updatedSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      telemetryDiagnostics.error('run_start_failed', {
        sessionId: session.sessionId,
        runId,
        error: errorMessage,
      });
      throw err;
    }
  }, [session, sessionConfig]);

  // End current run
  const endRun = useCallback(async () => {
    if (!session || !session.currentRunId) {
      return session;
    }

    try {
      const updatedSession = {
        ...session,
        currentRunId: null,
        eventCount: session.eventCount + 1,
      };

      setSession(updatedSession);
      await saveData(sessionConfig.storageKey, updatedSession);
      
      telemetryDiagnostics.info('run_ended', {
        sessionId: session.sessionId,
        runId: session.currentRunId,
      });

      return updatedSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      telemetryDiagnostics.error('run_end_failed', {
        sessionId: session.sessionId,
        runId: session.currentRunId,
        error: errorMessage,
      });
      throw err;
    }
  }, [session, sessionConfig]);

  // End session
  const endSession = useCallback(async () => {
    if (!session || session.endTime !== null) {
      return session;
    }

    try {
      const finalSession = {
        ...session,
        endTime: Date.now(),
        duration: Date.now() - session.startTime,
        currentRunId: null,
      };

      setSession(finalSession);
      await saveData(sessionConfig.storageKey, finalSession);
      
      telemetryDiagnostics.info('session_ended', {
        sessionId: session.sessionId,
        duration: finalSession.duration,
        totalRuns: finalSession.runIds.length,
        totalEvents: finalSession.eventCount,
      });

      return finalSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      telemetryDiagnostics.error('session_end_failed', {
        sessionId: session.sessionId,
        error: errorMessage,
      });
      throw err;
    }
  }, [session, sessionConfig]);

  // Get session statistics
  const sessionStats = useMemo(() => {
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      duration: session.endTime ? session.duration : Date.now() - session.startTime,
      runCount: session.runIds.length,
      eventCount: session.eventCount,
      is_active: session.endTime === null,
      current_run: session.currentRunId,
      metadata: session.metadata,
    };
  }, [session]);

  return {
    session,
    isLoading,
    error,
    sessionStats,
    startRun,
    endRun,
    endSession,
  };
}
