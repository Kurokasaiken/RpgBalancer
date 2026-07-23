/**
 * Unit tests for the global session registry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  atomicUpdateRegistry,
  createDefaultRegistry,
  getRegistryFilePath,
  heartbeatSession,
  readRegistry,
  recoverStaleSessions,
  registerSession,
  releaseSession,
  writeRegistry,
  type SessionRegistry,
} from '../../../scripts/shutdownManager/sessionRegistry.js';

describe('sessionRegistry', () => {
  let tempDir: string;
  let registryPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'shutdown-registry-test-'));
    registryPath = path.join(tempDir, 'session-registry.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('path resolution', () => {
    it('prefers explicit override', () => {
      expect(getRegistryFilePath('/custom/path.json')).toBe('/custom/path.json');
    });

    it('falls back to the default home directory path', () => {
      const resolved = getRegistryFilePath();
      expect(resolved).toMatch(/\.rpg-shutdown\/session-registry\.json$/);
    });
  });

  describe('default registry', () => {
    it('creates a registry with safe defaults', () => {
      const registry = createDefaultRegistry('test-machine');
      expect(registry.version).toBe('1.0.0');
      expect(registry.machineId).toBe('test-machine');
      expect(registry.projects).toEqual({});
      expect(registry.policy.dryRun).toBe(true);
      expect(registry.policy.shutdownEnabled).toBe(false);
    });
  });

  describe('read/write round-trip', () => {
    it('returns a default registry when the file does not exist', async () => {
      const registry = await readRegistry(registryPath);
      expect(registry.machineId).toMatch(/^machine-/);
      expect(registry.projects).toEqual({});
    });

    it('creates the registry file on first read', async () => {
      await readRegistry(registryPath);
      const raw = readFileSync(registryPath, 'utf8');
      const parsed = JSON.parse(raw);
      expect(parsed.projects).toEqual({});
      expect(parsed.policy.shutdownEnabled).toBe(false);
    });

    it('reads back a previously written registry', async () => {
      const original = createDefaultRegistry('round-trip');
      await writeRegistry(original, registryPath);
      const read = await readRegistry(registryPath);
      expect(read.machineId).toBe('round-trip');
      expect(read.version).toBe(original.version);
    });

    it('fails when the registry JSON is invalid', async () => {
      writeFileSync(registryPath, '{ not valid json', 'utf8');
      await expect(readRegistry(registryPath)).rejects.toThrow();
    });

    it('fails when the registry data violates the schema', async () => {
      const invalid = { version: 1, machineId: 'x' } as unknown as SessionRegistry;
      await expect(writeRegistry(invalid, registryPath)).rejects.toThrow(/schema validation failed/i);
    });
  });

  describe('session lifecycle', () => {
    it('registers a new session', async () => {
      const registry = await registerSession(
        {
          projectId: 'RPG',
          sessionId: 'devin-1',
          pid: 12345,
          owner: 'tester',
        },
        registryPath,
      );

      expect(registry.projects.RPG).toBeDefined();
      expect(registry.projects.RPG.sessions['devin-1']).toMatchObject({
        pid: 12345,
        owner: 'tester',
        state: 'RUNNING',
        ttlSeconds: 60,
      });
    });

    it('renews a session heartbeat', async () => {
      await registerSession(
        { projectId: 'RPG', sessionId: 'devin-1', pid: 1, owner: 'tester' },
        registryPath,
      );

      const before = await readRegistry(registryPath);
      const beforeHeartbeat = before.projects.RPG.sessions['devin-1'].heartbeatAt;

      await new Promise((resolve) => setTimeout(resolve, 5));

      const after = await heartbeatSession(
        { projectId: 'RPG', sessionId: 'devin-1', state: 'IDLE' },
        registryPath,
      );

      expect(after.projects.RPG.sessions['devin-1'].heartbeatAt).not.toBe(beforeHeartbeat);
      expect(after.projects.RPG.sessions['devin-1'].state).toBe('IDLE');
    });

    it('rejects heartbeat for an unknown session', async () => {
      await expect(
        heartbeatSession({ projectId: 'RPG', sessionId: 'missing' }, registryPath),
      ).rejects.toThrow('Session not found');
    });

    it('releases a session with a terminal state', async () => {
      await registerSession(
        { projectId: 'RPG', sessionId: 'devin-1', pid: 1, owner: 'tester' },
        registryPath,
      );

      const registry = await releaseSession(
        { projectId: 'RPG', sessionId: 'devin-1', state: 'COMPLETED' },
        registryPath,
      );

      expect(registry.projects.RPG.sessions['devin-1'].state).toBe('COMPLETED');
    });

    it('rejects release for an unknown session', async () => {
      await expect(
        releaseSession({ projectId: 'RPG', sessionId: 'missing' }, registryPath),
      ).rejects.toThrow('Session not found');
    });
  });

  describe('stale session TTL', () => {
    it('transitions expired sessions to UNKNOWN', async () => {
      const registry = createDefaultRegistry('test');
      const now = new Date('2026-07-23T12:00:00.000Z');
      const expired = new Date(now.getTime() - 120_000).toISOString();

      registry.projects = {
        RPG: {
          status: 'active',
          sessions: {
            'devin-1': {
              pid: 1,
              heartbeatAt: expired,
              state: 'RUNNING',
              owner: 'tester',
              ttlSeconds: 60,
            },
          },
        },
      };

      const recovered = recoverStaleSessions(registry, now);
      expect(recovered.projects.RPG.sessions['devin-1'].state).toBe('UNKNOWN');
      expect(recovered.projects.RPG.sessions['devin-1'].blockingReason).toBe('heartbeat expired');
    });

    it('keeps fresh sessions unchanged', async () => {
      const registry = createDefaultRegistry('test');
      const now = new Date('2026-07-23T12:00:00.000Z');
      const fresh = new Date(now.getTime() - 10_000).toISOString();

      registry.projects = {
        RPG: {
          status: 'active',
          sessions: {
            'devin-1': {
              pid: 1,
              heartbeatAt: fresh,
              state: 'RUNNING',
              owner: 'tester',
              ttlSeconds: 60,
            },
          },
        },
      };

      const recovered = recoverStaleSessions(registry, now);
      expect(recovered.projects.RPG.sessions['devin-1'].state).toBe('RUNNING');
    });
  });

  describe('Zod validation', () => {
    it('rejects a session with an invalid state', async () => {
      const registry = createDefaultRegistry('test');
      registry.projects = {
        RPG: {
          status: 'active',
          sessions: {
            'devin-1': {
              pid: 1,
              heartbeatAt: new Date().toISOString(),
              state: 'INVALID_STATE' as any,
              owner: 'tester',
              ttlSeconds: 60,
            },
          },
        },
      };

      await expect(writeRegistry(registry, registryPath)).rejects.toThrow(/schema validation failed/i);
    });

    it('rejects a negative TTL', async () => {
      await expect(
        registerSession(
          {
            projectId: 'RPG',
            sessionId: 'devin-1',
            pid: 1,
            owner: 'tester',
            ttlSeconds: -1,
          },
          registryPath,
        ),
      ).rejects.toThrow();
    });

    it('rejects an invalid ISO datetime', async () => {
      const registry = createDefaultRegistry('test');
      registry.projects = {
        RPG: {
          status: 'active',
          sessions: {
            'devin-1': {
              pid: 1,
              heartbeatAt: 'not-a-date',
              state: 'RUNNING',
              owner: 'tester',
              ttlSeconds: 60,
            },
          },
        },
      };

      await expect(writeRegistry(registry, registryPath)).rejects.toThrow(/schema validation failed/i);
    });
  });

  describe('concurrent atomic writes', () => {
    it('does not corrupt the registry under concurrent registrations', async () => {
      const projectId = 'RPG';
      const promises: Promise<SessionRegistry>[] = [];

      for (let i = 0; i < 20; i += 1) {
        promises.push(
          registerSession(
            {
              projectId,
              sessionId: `session-${i}`,
              pid: 1000 + i,
              owner: 'tester',
            },
            registryPath,
          ),
        );
      }

      await Promise.all(promises);
      const registry = await readRegistry(registryPath);
      const sessionKeys = Object.keys(registry.projects[projectId].sessions);

      expect(sessionKeys.length).toBe(20);
      for (let i = 0; i < 20; i += 1) {
        expect(registry.projects[projectId].sessions[`session-${i}`]).toBeDefined();
      }
    });

    it('serialises overlapping register/heartbeat/release operations', async () => {
      const projectId = 'RPG';
      const sessionId = 'devin-1';

      await registerSession(
        { projectId, sessionId, pid: 1, owner: 'tester' },
        registryPath,
      );

      const operations: Promise<SessionRegistry>[] = [
        heartbeatSession({ projectId, sessionId, state: 'IDLE' }, registryPath),
        heartbeatSession({ projectId, sessionId, state: 'RUNNING' }, registryPath),
        releaseSession({ projectId, sessionId, state: 'COMPLETED' }, registryPath),
      ];

      await Promise.all(operations);
      const registry = await readRegistry(registryPath);
      expect(['IDLE', 'RUNNING', 'COMPLETED']).toContain(
        registry.projects[projectId].sessions[sessionId].state,
      );
    });
  });
});

describe('session registry CLI', () => {
  let tempDir: string;
  let registryPath: string;
  const repoRoot = process.cwd();

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'shutdown-cli-test-'));
    registryPath = path.join(tempDir, 'session-registry.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function runCli(script: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
    const childEnv = { ...process.env, PATH: process.env.PATH } as Record<string, string | undefined>;
    delete childEnv.NODE_OPTIONS;

    const result = spawnSync(
      'node',
      [path.join(repoRoot, 'node_modules/tsx/dist/cli.mjs'), path.join(repoRoot, 'scripts/shutdownManager', script), ...args, '--registry', registryPath],
      {
        cwd: tempDir,
        env: childEnv,
        encoding: 'utf8',
      },
    );
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  it('registers a session from a temp directory', () => {
    const result = runCli('registerSession.ts', [
      '--project',
      'RPG',
      '--session',
      'cli-1',
      '--pid',
      '42',
      '--owner',
      'tester',
    ]);

    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.session.pid).toBe(42);
  });

  it('renews a session heartbeat from a temp directory', () => {
    runCli('registerSession.ts', ['--project', 'RPG', '--session', 'cli-2']);
    const heartbeat = runCli('heartbeatSession.ts', ['--project', 'RPG', '--session', 'cli-2']);

    expect(heartbeat.status).toBe(0);
    const parsed = JSON.parse(heartbeat.stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.session.state).toBe('RUNNING');
  });

  it('releases a session from a temp directory', () => {
    runCli('registerSession.ts', ['--project', 'RPG', '--session', 'cli-3']);
    const release = runCli('releaseSession.ts', [
      '--project',
      'RPG',
      '--session',
      'cli-3',
      '--state',
      'COMPLETED',
    ]);

    expect(release.status).toBe(0);
    const parsed = JSON.parse(release.stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.session.state).toBe('COMPLETED');
  });
});
