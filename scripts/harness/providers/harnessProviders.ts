/**
 * Harness provider configuration.
 *
 * Defines OpenAI-compatible providers for the harness executor with fallback support.
 * Shares base URLs and API key environment variables with ai-worker/providers.py.
 */

export interface HarnessProviderConfig {
  /** Provider identifier */
  name: string;
  /** Base URL for OpenAI-compatible chat completions endpoint */
  baseUrl: string;
  /** Environment variable holding the API key */
  apiKeyEnv: string;
  /** Default model for this provider */
  model: string;
}

/**
 * Provider presets in fallback priority order.
 * Matches ai-worker/providers.py configuration.
 */
export const HARNESS_PROVIDERS: HarnessProviderConfig[] = [
  {
    /* First in the chain (PLAN-041 model-arena): best free agentic/coding
     * tier right now — 1M ctx, ~1.5k req/day on AI Studio, native tool calls
     * via the OpenAI-compatible endpoint. Free tier may train on prompts
     * outside EU/UK/EEA — the workspace is EU, but treat prompts as public. */
    name: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKeyEnv: 'GOOGLE_API_KEY',
    model: 'gemini-3.8-flash',
  },
  {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    model: 'openai/gpt-oss-120b',
  },
  {
    name: 'cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    /* Cerebras hosts the same weights without the `openai/` prefix — model
     *  ids are per-provider, never send the Groq id to a fallback. */
    model: 'gpt-oss-120b',
  },
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    /* :free slugs rotate constantly — verified live 2026-10-16.
     *  nemotron-3-super is agentic-tuned; ultra-550b is the heavyweight
     *  fallback if this one disappears. */
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
  },
  {
    /* Mistral free "experiment" tier — small quota (~a few RPM), the API
     *  trains on free-tier data. Executor lane only, never trusted context. */
    name: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyEnv: 'MISTRAL_TINY_API_KEY',
    model: 'mistral-small-latest',
  },
];

/**
 * Get providers with valid API keys configured.
 *
 * @returns List of provider configs that have non-empty API keys in environment.
 */
export function getAvailableProviders(): HarnessProviderConfig[] {
  const pinned = process.env.HARNESS_PROVIDER;
  return HARNESS_PROVIDERS.filter((provider) => {
    if (pinned && provider.name !== pinned) return false;
    const apiKey = process.env[provider.apiKeyEnv];
    return apiKey && apiKey.length > 0;
  });
}

/**
 * Get provider config by name.
 *
 * @param name Provider name (e.g., 'groq', 'cerebras', 'openrouter')
 * @returns Provider config or undefined if not found
 */
export function getProviderConfig(name: string): HarnessProviderConfig | undefined {
  return HARNESS_PROVIDERS.find((p) => p.name === name);
}
