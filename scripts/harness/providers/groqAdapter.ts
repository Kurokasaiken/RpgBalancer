/**
 * Harness provider adapter with multi-provider fallback.
 *
 * Supports OpenAI-compatible providers (Groq, Cerebras, OpenRouter) with
 * automatic fallback on timeout or error. Uses 120s timeout per provider to
 * quickly detect service unavailability.
 */

import type { HarnessConfig } from '../config.js';
import type {
  ChatMessage,
  CompletionResult,
  ProviderAdapter,
  ToolCall,
  ToolDefinition,
} from './types.js';
import { getAvailableProviders, type HarnessProviderConfig } from './harnessProviders.js';

/** Raw shape of a choice returned by the OpenAI-compatible endpoint. */
interface RawChoice {
  message: {
    content: string | null;
    tool_calls?: ToolCall[];
  };
  finish_reason: string;
}

interface RawResponse {
  choices?: RawChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: { message: string; type?: string; failed_generation?: string };
  failed_generation?: string;
}

/** Sleep helper for retry backoff. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try a single provider with timeout and retry logic.
 *
 * @param providerConfig Provider configuration
 * @param body Request body
 * @param providerName Provider name for logging
 * @returns Completion result with usedProvider set
 */
async function tryProvider(
  providerConfig: HarnessProviderConfig,
  body: Record<string, unknown>,
  providerName: string,
): Promise<CompletionResult> {
  const endpoint = `${providerConfig.baseUrl}/chat/completions`;
  const apiKey = process.env[providerConfig.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key for ${providerName}: ${providerConfig.apiKeyEnv} not set`);
  }

  const maxAttempts = 4;
  let lastError = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (networkError) {
      lastError = `network error: ${String(networkError)}`;
      await sleep(1000 * attempt);
      continue;
    }

    // Rate limited or transient server error: back off and retry.
    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get('retry-after') ?? '0');
      lastError = `HTTP ${response.status}`;
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 1500 * attempt);
      continue;
    }

    const json = (await response.json()) as RawResponse;

    // If provider returns a failed_generation but the request was otherwise OK,
    // surface it as assistant content so the text parser can try to recover.
    if (!response.ok || json.error) {
      const failedGeneration = json.failed_generation ?? json.error?.failed_generation;
      if (failedGeneration) {
        return {
          content: failedGeneration,
          toolCalls: [],
          finishReason: 'failed_generation',
          usage: json.usage
            ? {
                promptTokens: json.usage.prompt_tokens,
                completionTokens: json.usage.completion_tokens,
              }
            : undefined,
          usedProvider: providerName,
        };
      }
      throw new Error(
        `${providerName} API error: ${json.error?.message ?? `HTTP ${response.status}`}`,
      );
    }

    const choice = json.choices?.[0];
    if (!choice) {
      throw new Error(`${providerName} API returned no choices.`);
    }

    return {
      content: choice.message.content ?? null,
      toolCalls: choice.message.tool_calls ?? [],
      finishReason: choice.finish_reason,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.completion_tokens,
          }
        : undefined,
      usedProvider: providerName,
    };
  }

  throw new Error(
    `${providerName} API failed after ${maxAttempts} attempts. Last error: ${lastError}`,
  );
}

/**
 * Create a harness provider adapter with multi-provider fallback.
 *
 * Tries providers in priority order (Groq -> Cerebras -> OpenRouter) with
 * 120s timeout per provider. Falls back to next provider on timeout or error.
 *
 * @param config Resolved harness config (legacy compatibility).
 * @returns A provider adapter implementing `complete`.
 */
export function createGroqAdapter(config: HarnessConfig): ProviderAdapter {
  // Get available providers with API keys
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    throw new Error(
      'No harness providers with valid API keys found. Configure GROQ_API_KEY, CEREBRAS_API_KEY, or OPENROUTER_API_KEY.',
    );
  }

  return {
    async complete(
      messages: ChatMessage[],
      tools: ToolDefinition[],
    ): Promise<CompletionResult> {
      const body = {
        model: config.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      };

      let lastError = '';

      // Try each provider in priority order
      for (const providerConfig of availableProviders) {
        try {
          console.log(`[HARNESS] Trying provider: ${providerConfig.name}`);
          const result = await tryProvider(providerConfig, body, providerConfig.name);
          console.log(`[HARNESS] Success with provider: ${providerConfig.name}`);
          return result;
        } catch (error) {
          lastError = String(error);
          console.log(`[HARNESS] Provider ${providerConfig.name} failed: ${lastError}`);
          // Continue to next provider
        }
      }

      throw new Error(
        `All harness providers failed. Last error: ${lastError}`,
      );
    },
  };
}
