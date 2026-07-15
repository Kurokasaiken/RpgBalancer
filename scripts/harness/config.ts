/**
 * Harness configuration.
 *
 * Central, config-first source of truth for the autonomous executor harness.
 * Everything tunable (provider, model, limits, whitelist) lives here so agents
 * and CLIs never hardcode values.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/** Supported executor providers. All must be OpenAI chat-completions compatible. */
export type HarnessProvider = 'groq';

/** Shape of the resolved harness configuration. */
export interface HarnessConfig {
  provider: HarnessProvider;
  /** Base URL for the OpenAI-compatible chat completions endpoint. */
  baseUrl: string;
  /** Model id used by the cheap executor agents. */
  model: string;
  /** Environment variable that holds the API key. */
  apiKeyEnv: string;
  /** Resolved API key (empty string if missing; callers must validate). */
  apiKey: string;
  /** Max agentic loop iterations before aborting a single task. */
  maxIterations: number;
  /** Max tokens per completion. */
  maxTokens: number;
  /** Sampling temperature. Low for deterministic edits. */
  temperature: number;
  /** Absolute repo root. */
  repoRoot: string;
  /**
   * Commands the executor is allowed to run. Anything not matching one of
   * these prefixes is rejected by the tool layer.
   */
  allowedCommands: string[];
  /** Max runtime for a single run_command tool in milliseconds. */
  commandTimeout: number;
  /** Max runtime for a full harness task in milliseconds. */
  taskTimeout: number;
}

/**
 * Minimal .env loader (no dependency). Loads KEY=VALUE pairs from a .env file
 * at the repo root into process.env without overwriting existing values.
 */
function loadDotEnv(repoRoot: string): void {
  const envPath = path.join(repoRoot, '.env');
  if (!existsSync(envPath)) {
    return;
  }
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/** Provider presets. Groq is OpenAI-compatible. */
const PROVIDER_PRESETS: Record<
  HarnessProvider,
  { baseUrl: string; model: string; apiKeyEnv: string }
> = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    apiKeyEnv: 'GROQ_API_KEY',
  },
};

/**
 * Resolve the harness configuration from env + presets.
 *
 * @param overrides Partial overrides (mostly for tests).
 * @returns The fully resolved harness config.
 */
export function loadHarnessConfig(
  overrides: Partial<HarnessConfig> = {},
): HarnessConfig {
  const repoRoot = overrides.repoRoot ?? process.cwd();
  loadDotEnv(repoRoot);

  const provider = overrides.provider ?? ('groq' as HarnessProvider);
  const preset = PROVIDER_PRESETS[provider];

  const apiKeyEnv = overrides.apiKeyEnv ?? preset.apiKeyEnv;
  const apiKey = overrides.apiKey ?? process.env[apiKeyEnv] ?? '';

  return {
    provider,
    baseUrl: overrides.baseUrl ?? process.env.HARNESS_BASE_URL ?? preset.baseUrl,
    model: overrides.model ?? process.env.HARNESS_MODEL ?? preset.model,
    apiKeyEnv,
    apiKey,
    maxIterations:
      overrides.maxIterations ??
      Number(process.env.HARNESS_MAX_ITERATIONS ?? '24'),
    maxTokens:
      overrides.maxTokens ?? Number(process.env.HARNESS_MAX_TOKENS ?? '4096'),
    temperature:
      overrides.temperature ??
      Number(process.env.HARNESS_TEMPERATURE ?? '0.1'),
    repoRoot,
    allowedCommands: overrides.allowedCommands ?? [
      'npm run lint',
      'npm run test',
      'npm run test:unit',
      'npm run build:check',
      'npm run kanban:lint',
      'npx tsc',
    ],
    commandTimeout:
      overrides.commandTimeout ??
      Number(process.env.HARNESS_COMMAND_TIMEOUT_MS ?? '300000'),
    taskTimeout:
      overrides.taskTimeout ??
      Number(process.env.HARNESS_TASK_TIMEOUT_MS ?? '600000'),
  };
}
