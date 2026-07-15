/**
 * Provider-agnostic types for the executor harness.
 *
 * All providers must map onto the OpenAI chat-completions + tool-calling shape.
 */

/** A single chat message in the conversation sent to the model. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  /** Present on assistant messages that request tool calls. */
  tool_calls?: ToolCall[];
  /** Present on tool-result messages: which call this answers. */
  tool_call_id?: string;
  /** Optional name (tool messages). */
  name?: string;
}

/** A tool call requested by the model. */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    /** JSON-encoded arguments string. */
    arguments: string;
  };
}

/** JSON-schema tool definition advertised to the model. */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** Normalized response from a single chat completion turn. */
export interface CompletionResult {
  /** Assistant text content (may be empty when only tool calls are returned). */
  content: string | null;
  /** Tool calls requested by the model this turn, if any. */
  toolCalls: ToolCall[];
  /** Finish reason reported by the provider. */
  finishReason: string;
  /** Token usage if the provider reports it. */
  usage?: { promptTokens: number; completionTokens: number };
  /** Name of the provider that successfully executed this completion. */
  usedProvider?: string;
}

/** Contract every provider adapter implements. */
export interface ProviderAdapter {
  /**
   * Run a single chat completion turn with tool support.
   *
   * @param messages Full conversation so far.
   * @param tools Tool definitions the model may call.
   * @returns Normalized completion result.
   */
  complete(
    messages: ChatMessage[],
    tools: ToolDefinition[],
  ): Promise<CompletionResult>;
}
