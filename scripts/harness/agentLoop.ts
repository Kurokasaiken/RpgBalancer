/**
 * Agentic loop for the cheap executor.
 *
 * Drives a provider through read/write/edit/run tool calls until it either
 * calls task_complete or the iteration budget is exhausted. Deliberately small:
 * the executor is "dumb", so the loop stays strict and observable.
 */

import type { HarnessConfig } from './config.js';
import type { ChatMessage, ProviderAdapter, ToolCall } from './providers/types.js';
import { createToolExecutor, buildToolHelpText, TASK_COMPLETE_TOOL } from './tools.js';

/** Outcome of a single executor run. */
export interface AgentRunResult {
  completed: boolean;
  summary: string | null;
  touchedFiles: string[];
  iterations: number;
  transcript: ChatMessage[];
  /** Name of the provider that successfully executed the task. */
  usedProvider?: string;
}

/** System prompt: baseline rules + strict operating contract for the executor. */
function buildSystemPrompt(): string {
  return [
    'You are a focused coding executor working inside an existing TypeScript/React repository.',
    'You act through tools only. Never output code in prose; use write_file/edit_file.',
    'Output every action as a tool call block. Do not write conversational text.',
    '',
    'HARD RULES (non-negotiable, from .windsurf/rules/):',
    '- Persistence ONLY via @/shared/persistence/PersistenceService (no direct localStorage).',
    '- Config-first + Zod for config/schemas. No magic values in components.',
    '- i18n via react-i18next (namespaces common/idleVillage). No hardcoded user-facing strings.',
    '- UI: use the default skin system (useSkinPreferences / DEFAULT_SKIN_PRESET_ID) and Gilded Observatory theme. dnd-kit only for drag & drop.',
    '- Keep files small and modular. JSDoc public functions.',
    '',
    'PLACEHOLDER POLICY: If something required is NOT clearly defined, do NOT invent new systems or components.',
    'Create a minimal placeholder with an explicit TODO comment and note it in your final summary.',
    '',
    buildToolHelpText(),
    '',
    'WORKFLOW:',
    '1. Read only the files you need (read_file/list_dir).',
    '2. Make the smallest change that satisfies the task.',
    '3. Run relevant safeguards with run_command when useful (e.g. "npm run build:check").',
    '4. When done, call task_complete with a concise summary.',
    '',
    'Stay strictly within the task scope and the listed target files. Do not refactor unrelated code.',
  ].join('\n');
}

/**
 * Parse tool-call blocks from text output. Format expected:
 *
 *   ### Tool: <tool_name>
 *   ### <arg_name>
 *   <arg_value (can be multiline)>
 *   ### <arg_name>
 *   <arg_value>
 *   ### End
 *
 * Multiple blocks can appear in a single message.
 */
function parseToolCalls(content: string | null): ToolCall[] {
  if (!content) return [];
  const calls: ToolCall[] = [];
  const blockRegex = /### Tool:\s*(\w+)\s*\n([\s\S]*?)\n\s*### End/g;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(content)) !== null) {
    const name = blockMatch[1];
    const body = blockMatch[2];
    const args: Record<string, string> = {};

    // Split the body into argument blocks. Each block starts with a line
    // matching "### <arg_name>". The value continues until the next
    // "### <arg_name>" line or the end of the body.
    const argRegex = /^###\s+(\w+)\s*\n/gm;
    const positions: { name: string; start: number; end: number }[] = [];
    let argMatch;
    while ((argMatch = argRegex.exec(body)) !== null) {
      positions.push({ name: argMatch[1], start: argMatch.index, end: argMatch.index + argMatch[0].length });
    }

    for (let i = 0; i < positions.length; i += 1) {
      const current = positions[i];
      const next = positions[i + 1];
      const rawValue = next
        ? body.slice(current.end, next.start)
        : body.slice(current.end);
      args[current.name] = rawValue.replace(/\n+$/, '');
    }

    if (Object.keys(args).length === 0) {
      continue;
    }

    calls.push({
      id: `text-${Date.now()}-${calls.length}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    });
  }
  return calls;
}

/** Stable key for a tool call used to detect duplicate actions. */
function toolCallKey(call: ToolCall): string {
  return `${call.function.name}:${call.function.arguments || ''}`;
}

/**
 * Run the executor agent loop for a single task.
 *
 * @param promptText Fully expanded task prompt (from Coordinator/Kanban).
 * @param provider Provider adapter to drive.
 * @param config Harness config.
 * @param workspaceRoot Absolute sandbox root for file operations.
 * @param onEvent Optional progress callback for logging.
 * @returns The run result.
 */
export async function runAgentLoop(
  promptText: string,
  provider: ProviderAdapter,
  config: HarnessConfig,
  workspaceRoot: string,
  onEvent?: (event: string) => void,
): Promise<AgentRunResult> {
  const tools = createToolExecutor(workspaceRoot, config);
  const log = (msg: string): void => onEvent?.(msg);

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: promptText },
  ];

  let iterations = 0;
  let lastToolCallKey = '';
  let duplicateCount = 0;
  let usedProvider: string | undefined;

  while (iterations < config.maxIterations) {
    iterations += 1;
    log(`iteration ${iterations}/${config.maxIterations}`);

    const result = await provider.complete(messages, []);

    // Capture the provider that successfully executed this completion
    if (result.usedProvider && !usedProvider) {
      usedProvider = result.usedProvider;
    }

    // Record the assistant turn.
    const parsedToolCalls = result.toolCalls.length > 0
      ? result.toolCalls
      : parseToolCalls(result.content);
    messages.push({
      role: 'assistant',
      content: result.content,
      tool_calls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined,
    });

    if (parsedToolCalls.length === 0) {
      // No tool call. If the model thinks it is done, nudge once, else stop.
      log('no tool calls returned; nudging to use tools or complete');
      messages.push({
        role: 'user',
        content:
          'Continue using tools. If the task is fully implemented, call task_complete with a summary. Otherwise perform the next edit.',
      });
      continue;
    }

    // Check for duplicated tool calls. Cheap models can get stuck repeating the same action.
    const nonCompleteCalls = parsedToolCalls.filter((c) => c.function.name !== TASK_COMPLETE_TOOL);
    const allSameKey =
      nonCompleteCalls.length > 0 &&
      nonCompleteCalls.every((c) => toolCallKey(c) === lastToolCallKey);

    if (nonCompleteCalls.length > 0 && allSameKey) {
      duplicateCount += 1;
      if (duplicateCount >= 1) {
        log('duplicate tool call detected; nudging to complete');
        messages.push({
          role: 'user',
          content:
            'You already performed this exact action. Do not repeat it. If the task is complete, call task_complete now. Otherwise make a different edit.',
        });
        continue;
      }
    } else {
      duplicateCount = 0;
    }

    // Execute tool calls.
    for (const call of parsedToolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        args = {};
      }
      const toolResult = tools.execute(call.function.name, args);
      log(`tool ${call.function.name} -> ${toolResult.ok ? 'ok' : 'error'}`);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        name: call.function.name,
        content: toolResult.output.slice(0, 8000),
      });
    }

    if (nonCompleteCalls.length > 0) {
      lastToolCallKey = toolCallKey(nonCompleteCalls[0]);
    }

    if (tools.completed !== null) {
      log('task_complete called');
      return {
        completed: true,
        summary: tools.completed,
        touchedFiles: tools.touchedFiles,
        iterations,
        transcript: messages,
        usedProvider,
      };
    }
  }

  return {
    completed: false,
    summary: null,
    touchedFiles: tools.touchedFiles,
    iterations,
    transcript: messages,
    usedProvider,
  };
}
