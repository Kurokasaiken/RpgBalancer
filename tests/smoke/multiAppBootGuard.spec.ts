import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const targetId = process.env.BOOT_GUARD_TARGET ?? 'unknown-target';
const route = process.env.BOOT_GUARD_ROUTE ?? '/';
const successLocator = process.env.BOOT_GUARD_SUCCESS_LOCATOR ?? '[data-testid="app-root"]';
const errorSignatureTokens = (process.env.BOOT_GUARD_ERROR_SIGNATURES ?? '')
  .split('|')
  .map((token) => token.trim())
  .filter((token) => token.length > 0);
const artifactDir = process.env.BOOT_GUARD_ARTIFACT_DIR ?? 'test-results/boot-guard-artifacts';
const captureSelector = process.env.BOOT_GUARD_CAPTURE_SELECTOR ?? '';

mkdirSync(artifactDir, { recursive: true });

const describeLabel = `Multi-App Boot Guard smoke – ${targetId}`;

test.describe(describeLabel, () => {
  test('page boots without error overlays', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'error' || containsSignature(text, errorSignatureTokens)) {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', (error) => {
      const text = error?.message ?? 'Unknown pageerror';
      pageErrors.push(text);
    });

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok(), `Failed to load ${route}`).toBeTruthy();

    await expect(page.locator(successLocator)).toBeVisible({ timeout: 30000 });

    const overlayMatches = await detectOverlayMatches(page, errorSignatureTokens);
    const failureMessages: string[] = [];

    if (overlayMatches.length > 0) {
      failureMessages.push(`Overlay signatures detected: ${overlayMatches.join(', ')}`);
    }
    if (consoleErrors.length > 0) {
      failureMessages.push(`Console errors: ${consoleErrors.join(' | ')}`);
    }
    if (pageErrors.length > 0) {
      failureMessages.push(`Page errors: ${pageErrors.join(' | ')}`);
    }

    if (failureMessages.length > 0) {
      await captureArtifacts(page, testInfo.title);
      writeEvidence(testInfo.title, failureMessages);
      throw new Error(failureMessages.join('\n'));
    }

    if (captureSelector) {
      const captureTarget = page.locator(captureSelector).first();
      if (await captureTarget.isVisible({ timeout: 5000 }).catch(() => false)) {
        const screenshotPath = join(artifactDir, `${sanitizeFileName(`${targetId}-success`)}.png`);
        await captureTarget.screenshot({ path: screenshotPath });
      }
    }

    console.log(`OK – ${targetId}`);
  });
});

async function detectOverlayMatches(
  page: Parameters<typeof test>[0]['page'],
  signatures: string[],
): Promise<string[]> {
  const matches: string[] = [];
  if (signatures.length === 0) {
    return matches;
  }

  const bodyText = await page.locator('body').innerText();
  signatures.forEach((signature) => {
    if (bodyText.includes(signature)) {
      matches.push(signature);
    }
  });

  for (const signature of signatures) {
    const textLocator = page.getByText(signature, { exact: false });
    if (await textLocator.first().isVisible({ timeout: 100 }).catch(() => false)) {
      if (!matches.includes(signature)) {
        matches.push(signature);
      }
    }
  }

  return matches;
}

async function captureArtifacts(page: Parameters<typeof test>[0]['page'], title: string): Promise<void> {
  const screenshotPath = join(artifactDir, `${sanitizeFileName(`${targetId}-${title}`)}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

function writeEvidence(testTitle: string, messages: string[]): void {
  const evidencePath = join(artifactDir, `${sanitizeFileName(`${targetId}-${testTitle}`)}.log`);
  const payload = {
    targetId,
    route,
    successLocator,
    errorSignatures: errorSignatureTokens,
    timestamp: Date.now(),
    failures: messages,
  };
  writeFileSync(evidencePath, JSON.stringify(payload, null, 2), 'utf8');
}

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
}

function containsSignature(text: string, signatures: string[]): boolean {
  return signatures.some((signature) => signature.length > 0 && text.includes(signature));
}
