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
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    model: 'llama-3.3-70b',
  },
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    model: 'qwen/qwen3-coder:free',
  },
];

/**
 * Get providers with valid API keys configured.
 *
 * @returns List of provider configs that have non-empty API keys in environment.
 */
export function getAvailableProviders(): HarnessProviderConfig[] {
  return HARNESS_PROVIDERS.filter((provider) => {
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
