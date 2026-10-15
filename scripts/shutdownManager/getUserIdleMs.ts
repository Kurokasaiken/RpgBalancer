/**
 * User-idle detection for macOS (OPS-SHUTDOWN-004).
 *
 * Reads `HIDIdleTime` from the I/O registry via `ioreg` — the same source
 * the WindowServer uses for display sleep. No sudo required.
 * Returns `'UNKNOWN'` on any failure so callers can fail closed.
 *
 * @module getUserIdleMs
 */

import { execFile } from 'node:child_process';

const IOREG_TIMEOUT_MS = 5_000;

/**
 * Queries the HID idle time.
 *
 * @returns Milliseconds since last user input, or `'UNKNOWN'`.
 */
export function getUserIdleMs(): Promise<number | 'UNKNOWN'> {
  return new Promise((resolve) => {
    execFile(
      'ioreg',
      ['-c', 'IOHIDSystem', '-d', '4', '-r', '-t', '500'],
      { timeout: IOREG_TIMEOUT_MS },
      (error, stdout) => {
        if (error) {
          resolve('UNKNOWN');
          return;
        }
        const match = /"HIDIdleTime"\s*=\s*(\d+)/.exec(stdout);
        if (!match) {
          resolve('UNKNOWN');
          return;
        }
        // HIDIdleTime is reported in nanoseconds.
        const idleNs = Number(match[1]);
        if (!Number.isFinite(idleNs)) {
          resolve('UNKNOWN');
          return;
        }
        resolve(Math.floor(idleNs / 1_000_000));
      },
    );
  });
}
