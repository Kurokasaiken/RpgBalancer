/**
 * Global session registry for the shutdown manager.
 *
 * Provides Zod-validated read/write/heartbeat operations for the machine-wide
 * session registry at `~/.rpg-shutdown/session-registry.json`.
 *
 * @module sessionRegistry
 */

import { z } from 'zod';
import { homedir } from 'node:os';
import path from 'node:path';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';

const DEFAULT_VERSION = '1.0.0';
const DEFAULT_REGISTRY_PATH = path.join(homedir(), '.rpg-shutdown', 'session-registry.json');

/** Valid session lifecycle states. */
export const SessionStateSchema = z.enum([
  'STARTING',
  'RUNNING',
  'IDLE',
  'WAITING_FOR_USER',
  'BLOCKED',
  'QUEUED',
  'COMPLETED',
  'FAILED',
  'STOPPING',
  'UNKNOWN',
]);

/** @typedef {z.infer<typeof SessionStateSchema>} SessionState */
export type SessionState = z.infer<typeof SessionStateSchema>;

/** ISO 8601 datetime string schema (Zod v4 compatible). */
export const IsoDateTimeSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid ISO datetime',
});

/** Single registered session. */
export const SessionSchema = z.object({
  pid: z.number().int().nonnegative(),
  heartbeatAt: IsoDateTimeSchema,
  state: SessionStateSchema,
  blockingReason: z.string().optional(),
  owner: z.string().min(1),
  ttlSeconds: z.number().int().positive(),
});

/** @typedef {z.infer<typeof SessionSchema>} Session */
export type Session = z.infer<typeof SessionSchema>;

/** Per-project session aggregation. */
export const ProjectSchema = z.object({
  status: z.string().min(1),
  sessions: z.record(z.string().min(1), SessionSchema),
});

/** @typedef {z.infer<typeof ProjectSchema>} Project */
export type Project = z.infer<typeof ProjectSchema>;

/** Shutdown policy embedded in the registry. */
export const ShutdownPolicySchema = z.object({
  dryRun: z.boolean().default(true),
  userIdleThresholdSeconds: z.number().int().nonnegative().default(300),
  shutdownEnabled: z.boolean().default(false),
});

/** @typedef {z.infer<typeof ShutdownPolicySchema>} ShutdownPolicy */
export type ShutdownPolicy = z.infer<typeof ShutdownPolicySchema>;

/** Root registry schema. */
export const SessionRegistrySchema = z.object({
  version: z.string().min(1),
  machineId: z.string().min(1),
  updatedAt: IsoDateTimeSchema,
  projects: z.record(z.string().min(1), ProjectSchema),
  policy: ShutdownPolicySchema,
});

/** @typedef {z.infer<typeof SessionRegistrySchema>} SessionRegistry */
export type SessionRegistry = z.infer<typeof SessionRegistrySchema>;

/**
 * Returns the resolved registry file path.
 *
 * Order of precedence:
 * 1. Explicit `override` argument.
 * 2. `REGISTRY_FILE` environment variable.
 * 3. `~/.rpg-shutdown/session-registry.json`.
 *
 * @param override - Optional explicit path override.
 * @returns Resolved registry file path.
 */
export function getRegistryFilePath(override?: string): string {
  return override ?? process.env.REGISTRY_FILE ?? DEFAULT_REGISTRY_PATH;
}

/**
 * Creates a new empty registry with safe defaults.
 *
 * @param machineId - Optional machine identifier; generated if omitted.
 * @returns A fresh {@link SessionRegistry} object.
 */
export function createDefaultRegistry(machineId?: string): SessionRegistry {
  const id =
    machineId ??
    `machine-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    version: DEFAULT_VERSION,
    machineId: id,
    updatedAt: new Date().toISOString(),
    projects: {},
    policy: {
      dryRun: true,
      userIdleThresholdSeconds: 300,
      shutdownEnabled: false,
    },
  };
}

/**
 * Ensures the parent directory for the registry file exists.
 *
 * @param filePath - Registry file path.
 */
export async function ensureRegistryDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

/**
 * Reads and validates the registry from disk.
 *
 * Returns a default registry if the file does not yet exist.
 *
 * @param filePath - Optional explicit registry path.
 * @returns Parsed and validated {@link SessionRegistry}.
 */
export async function readRegistry(filePath?: string): Promise<SessionRegistry> {
  const target = getRegistryFilePath(filePath);
  try {
    const raw = await readFile(target, 'utf8');
    const parsed = JSON.parse(raw);
    return SessionRegistrySchema.parse(parsed);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      const registry = createDefaultRegistry();
      await ensureRegistryDir(target);
      await writeRegistry(registry, target);
      return registry;
    }
    if (error instanceof z.ZodError) {
      throw new Error(`Registry schema validation failed: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

/**
 * Validates and atomically writes the registry to disk.
 *
 * Uses a temp file + `rename` to minimise the chance of a partial write.
 *
 * @param registry - Registry object to persist.
 * @param filePath - Optional explicit registry path.
 */
export async function writeRegistry(registry: SessionRegistry, filePath?: string): Promise<void> {
  const target = getRegistryFilePath(filePath);
  let validated: SessionRegistry;
  try {
    validated = SessionRegistrySchema.parse({
      ...registry,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Registry schema validation failed: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
  const tempPath = `${target}.tmp`;
  await ensureRegistryDir(target);
  await writeFile(tempPath, `${JSON.stringify(validated, null, 2)}\n`);
  await rename(tempPath, target);
}

let atomicLock: Promise<unknown> = Promise.resolve();

/**
 * Runs an updater function against the registry while serialising concurrent
 * callers. The update is read-modify-write with atomic file persistence.
 *
 * @param updater - Function that receives the current registry and returns the updated one.
 * @param filePath - Optional explicit registry path.
 * @returns The updated {@link SessionRegistry}.
 */
export async function atomicUpdateRegistry(
  updater: (registry: SessionRegistry) => SessionRegistry | Promise<SessionRegistry>,
  filePath?: string,
): Promise<SessionRegistry> {
  const release = await acquireLock();
  try {
    const registry = await readRegistry(filePath);
    const updated = await updater(registry);
    await writeRegistry(updated, filePath);
    return updated;
  } finally {
    release();
  }
}

/**
 * Acquires the async write lock and returns a release function.
 *
 * @returns A function that releases the lock.
 */
async function acquireLock(): Promise<() => void> {
  const previous = atomicLock;
  let resolveRelease!: () => void;
  const next = new Promise<void>((resolve) => {
    resolveRelease = resolve;
  });
  atomicLock = previous.then(() => next);
  await previous;
  return resolveRelease;
}

/**
 * Marks sessions whose last heartbeat exceeded their TTL as `UNKNOWN`.
 *
 * UNKNOWN sessions are treated as shutdown blockers by the decision engine.
 *
 * @param registry - Registry to recover.
 * @param now - Optional timestamp; defaults to current time.
 * @returns A new registry with stale sessions recovered.
 */
export function recoverStaleSessions(registry: SessionRegistry, now = new Date()): SessionRegistry {
  const next: SessionRegistry = {
    ...registry,
    updatedAt: now.toISOString(),
    projects: {},
  };

  for (const [projectId, project] of Object.entries(registry.projects)) {
    const sessions: Record<string, Session> = {};
    for (const [sessionId, session] of Object.entries(project.sessions)) {
      const lastHeartbeat = new Date(session.heartbeatAt).getTime();
      const expiresAt = lastHeartbeat + session.ttlSeconds * 1000;
      if (now.getTime() > expiresAt) {
        sessions[sessionId] = {
          ...session,
          state: 'UNKNOWN',
          blockingReason: session.blockingReason ?? 'heartbeat expired',
          heartbeatAt: now.toISOString(),
        };
      } else {
        sessions[sessionId] = session;
      }
    }
    next.projects[projectId] = { ...project, sessions };
  }

  return next;
}

/**
 * Registers a new session in the registry.
 *
 * @param params - Session registration parameters.
 * @param filePath - Optional explicit registry path.
 * @returns Updated {@link SessionRegistry}.
 */
export async function registerSession(
  params: {
    projectId: string;
    sessionId: string;
    pid: number;
    owner: string;
    state?: SessionState;
    ttlSeconds?: number;
    blockingReason?: string;
  },
  filePath?: string,
): Promise<SessionRegistry> {
  const {
    projectId,
    sessionId,
    pid,
    owner,
    state = 'RUNNING',
    ttlSeconds = 60,
    blockingReason,
  } = params;

  return atomicUpdateRegistry((registry) => {
    const next: SessionRegistry = {
      ...registry,
      projects: { ...registry.projects },
    };

    if (!next.projects[projectId]) {
      next.projects[projectId] = { status: 'active', sessions: {} };
    }

    const project = next.projects[projectId];
    next.projects[projectId] = {
      ...project,
      sessions: {
        ...project.sessions,
        [sessionId]: {
          pid,
          heartbeatAt: new Date().toISOString(),
          state,
          owner,
          ttlSeconds,
          ...(blockingReason ? { blockingReason } : {}),
        },
      },
    };

    return next;
  }, filePath);
}

/**
 * Renews the heartbeat for an existing session and optionally updates its state.
 *
 * Also recovers stale sessions before updating.
 *
 * @param params - Heartbeat parameters.
 * @param filePath - Optional explicit registry path.
 * @returns Updated {@link SessionRegistry}.
 * @throws If the session does not exist.
 */
export async function heartbeatSession(
  params: {
    projectId: string;
    sessionId: string;
    state?: SessionState;
  },
  filePath?: string,
): Promise<SessionRegistry> {
  const { projectId, sessionId, state } = params;

  return atomicUpdateRegistry((registry) => {
    const recovered = recoverStaleSessions(registry);
    const project = recovered.projects[projectId];
    if (!project || !project.sessions[sessionId]) {
      throw new Error(`Session not found: ${projectId}/${sessionId}`);
    }

    const next: SessionRegistry = {
      ...recovered,
      projects: { ...recovered.projects },
    };
    const session = project.sessions[sessionId];

    next.projects[projectId] = {
      ...project,
      sessions: {
        ...project.sessions,
        [sessionId]: {
          ...session,
          heartbeatAt: new Date().toISOString(),
          ...(state ? { state } : {}),
        },
      },
    };

    return next;
  }, filePath);
}

/**
 * Releases (finalises) a session by setting it to a terminal state.
 *
 * @param params - Release parameters.
 * @param filePath - Optional explicit registry path.
 * @returns Updated {@link SessionRegistry}.
 * @throws If the session does not exist.
 */
export async function releaseSession(
  params: {
    projectId: string;
    sessionId: string;
    state?: SessionState;
  },
  filePath?: string,
): Promise<SessionRegistry> {
  const { projectId, sessionId, state = 'COMPLETED' } = params;

  return atomicUpdateRegistry((registry) => {
    const project = registry.projects[projectId];
    if (!project || !project.sessions[sessionId]) {
      throw new Error(`Session not found: ${projectId}/${sessionId}`);
    }

    const next: SessionRegistry = {
      ...registry,
      projects: { ...registry.projects },
    };
    const session = project.sessions[sessionId];

    next.projects[projectId] = {
      ...project,
      sessions: {
        ...project.sessions,
        [sessionId]: {
          ...session,
          state,
          heartbeatAt: new Date().toISOString(),
        },
      },
    };

    return next;
  }, filePath);
}

/**
 * Type guard for Node.js error objects.
 *
 * @param error - Unknown value.
 * @returns Whether the value is a Node.js error with a `code` property.
 */
function isNodeError(error: unknown): error is { code: string } & Error {
  return typeof error === 'object' && error !== null && 'code' in error;
}
