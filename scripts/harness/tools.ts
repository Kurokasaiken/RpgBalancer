/**
 * Tool layer for the executor harness.
 *
 * Provides a small, safe set of file/command tools that the cheap executor
 * model can call. Every path is sandboxed inside a workspace root to prevent
 * traversal, and shell commands are restricted to a whitelist.
 */

import { execSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import type { HarnessConfig } from './config.js';
import type { ToolDefinition } from './providers/types.js';

/** Result of executing a single tool. */
export interface ToolResult {
  ok: boolean;
  output: string;
}

/** Signals that the agent declared the task finished. */
export const TASK_COMPLETE_TOOL = 'task_complete';

/**
 * Tool catalog used by the agent loop. Kept as JSON-schema style definitions
 * for the native tool path, but the loop primarily renders them as text.
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        'Read a UTF-8 text file relative to the workspace root. Returns the file content with 1-indexed line numbers.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to workspace root.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'List files and directories at a path relative to the workspace root.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path relative to workspace root. Use "." for root.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description:
        'Create or fully overwrite a file relative to the workspace root. Parent directories are created automatically.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to workspace root.' },
          content: { type: 'string', description: 'Full file content to write.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description:
        'Replace an exact substring in a file. old_string must appear exactly once. Use for targeted edits.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to workspace root.' },
          old_string: { type: 'string', description: 'Exact text to replace (must be unique).' },
          new_string: { type: 'string', description: 'Replacement text.' },
        },
        required: ['path', 'old_string', 'new_string'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description:
        'Run a whitelisted command (lint/test/build:check/kanban:lint/tsc) from the workspace root. Returns combined stdout/stderr.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The exact command to run.' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: TASK_COMPLETE_TOOL,
      description:
        'Call when the task is fully implemented and you believe safeguards will pass. Provide a short summary of what changed.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Concise summary of the changes made.' },
        },
        required: ['summary'],
      },
    },
  },
];

/** Render tool definitions as a compact text catalog for the system prompt. */
export function buildToolHelpText(): string {
  return [
    'AVAILABLE TOOLS (call one per turn using the exact format below):',
    ...TOOL_DEFINITIONS.map((tool) => {
      const fn = tool.function;
      const params = Object.entries(fn.parameters.properties || {})
        .map(([name, spec]) => {
          const typed = spec as { description?: string };
          return `    ### ${name}\n    <${typed.description ?? ''}>`;
        })
        .join('\n');
      return `- ${fn.name}: ${fn.description}\n${params}`;
    }),
    '',
    'TOOL CALL FORMAT (output exactly this, nothing else; values can be multiline):',
    '### Tool: <tool_name>',
    '### <arg1_name>',
    '<arg1_value>',
    '### <arg2_name>',
    '<arg2_value>',
    '### End',
    '',
    'You can include multiple tool calls in a single message by repeating the block.',
    'Example:',
    '### Tool: write_file',
    '### path',
    'src/utils/hello.ts',
    '### content',
    'export function greet(name: string): string {\n  return `Hello, ${name}!`;\n}',
    '### End',
    '',
    'When done, call task_complete with a ### summary argument.',
  ].join('\n');
}

/**
 * Create a tool executor bound to a specific workspace root.
 *
 * @param workspaceRoot Absolute path all file ops are sandboxed to.
 * @param config Harness config (for the command whitelist).
 * @returns Object with an `execute` method and a `completed` accessor.
 */
export function createToolExecutor(workspaceRoot: string, config: HarnessConfig) {
  const root = path.resolve(workspaceRoot);
  let completedSummary: string | null = null;
  const touchedFiles = new Set<string>();

  /** Resolve + validate a path stays inside the workspace root. */
  function safeResolve(relative: string): string {
    const resolved = path.resolve(root, relative);
    const rel = path.relative(root, resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`Path "${relative}" escapes the workspace root.`);
    }
    return resolved;
  }

  function readFileTool(relative: string): ToolResult {
    const abs = safeResolve(relative);
    if (!existsSync(abs)) {
      return { ok: false, output: `File not found: ${relative}` };
    }
    const content = readFileSync(abs, 'utf8');
    const numbered = content
      .split('\n')
      .map((line, i) => `${i + 1}\t${line}`)
      .join('\n');
    return { ok: true, output: numbered };
  }

  function listDirTool(relative: string): ToolResult {
    const abs = safeResolve(relative);
    if (!existsSync(abs)) {
      return { ok: false, output: `Directory not found: ${relative}` };
    }
    const entries = readdirSync(abs).map((name) => {
      const isDir = statSync(path.join(abs, name)).isDirectory();
      return isDir ? `${name}/` : name;
    });
    return { ok: true, output: entries.join('\n') || '(empty)' };
  }

  function writeFileTool(relative: string, content: string): ToolResult {
    const abs = safeResolve(relative);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
    touchedFiles.add(relative);
    return { ok: true, output: `Wrote ${content.length} chars to ${relative}` };
  }

  function editFileTool(
    relative: string,
    oldString: string,
    newString: string,
  ): ToolResult {
    const abs = safeResolve(relative);
    if (!existsSync(abs)) {
      return { ok: false, output: `File not found: ${relative}` };
    }
    const content = readFileSync(abs, 'utf8');
    const occurrences = content.split(oldString).length - 1;
    if (occurrences === 0) {
      return { ok: false, output: `old_string not found in ${relative}.` };
    }
    if (occurrences > 1) {
      return {
        ok: false,
        output: `old_string appears ${occurrences} times in ${relative}; make it unique.`,
      };
    }
    writeFileSync(abs, content.replace(oldString, newString), 'utf8');
    touchedFiles.add(relative);
    return { ok: true, output: `Edited ${relative}` };
  }

  function runCommandTool(command: string): ToolResult {
    const allowed = config.allowedCommands.some((prefix) =>
      command.trim().startsWith(prefix),
    );
    if (!allowed) {
      return {
        ok: false,
        output: `Command not allowed: "${command}". Allowed prefixes: ${config.allowedCommands.join(', ')}`,
      };
    }
    try {
      const output = execSync(command, {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 20,
        timeout: config.commandTimeout,
      });
      return { ok: true, output: output.slice(-6000) || '(no output)' };
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string; code?: string };
      if (err.code === 'ETIMEDOUT') {
        return {
          ok: false,
          output: `Command timed out after ${config.commandTimeout}ms: "${command}". Consider a narrower scope or shorter command.`,
        };
      }
      const combined = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim();
      return { ok: false, output: (combined || err.message || 'command failed').slice(-6000) };
    }
  }

  return {
    /** Files created/modified during this session. */
    get touchedFiles(): string[] {
      return [...touchedFiles];
    },
    /** Non-null once the agent called task_complete. */
    get completed(): string | null {
      return completedSummary;
    },
    /**
     * Execute a tool by name with parsed arguments.
     *
     * @param name Tool function name.
     * @param args Parsed JSON arguments.
     * @returns Tool result serialized back to the model.
     */
    execute(name: string, args: Record<string, unknown>): ToolResult {
      try {
        switch (name) {
          case 'read_file':
            return readFileTool(String(args.path));
          case 'list_dir':
            return listDirTool(String(args.path));
          case 'write_file':
            return writeFileTool(String(args.path), String(args.content));
          case 'edit_file':
            return editFileTool(
              String(args.path),
              String(args.old_string),
              String(args.new_string),
            );
          case 'run_command':
            return runCommandTool(String(args.command));
          case TASK_COMPLETE_TOOL:
            completedSummary = String(args.summary ?? 'done');
            return { ok: true, output: 'Task marked complete.' };
          default:
            return { ok: false, output: `Unknown tool: ${name}` };
        }
      } catch (error) {
        return { ok: false, output: `Tool error: ${String(error)}` };
      }
    },
  };
}
