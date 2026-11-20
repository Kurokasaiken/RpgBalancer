/** TEMP (slice-kit conversion run 2026-11-19): probe dev server with file
 *  watching disabled — another session actively edits this shared worktree
 *  and its writes trigger full-page reloads mid-assertion (T-13). Wraps the
 *  callback-form base config; modules still transform on demand. */
import { defineConfig, type ConfigEnv, type UserConfig } from 'vite';
import baseFactory from './vite.config';

export default defineConfig(async (env: ConfigEnv): Promise<UserConfig> => {
  const base = typeof baseFactory === 'function'
    ? await (baseFactory as (e: ConfigEnv) => UserConfig | Promise<UserConfig>)(env)
    : (baseFactory as UserConfig);
  return {
    ...base,
    server: {
      ...base.server,
      watch: { ignored: ['**/*'] },
      hmr: false,
    },
  };
});
