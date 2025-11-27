// Polyfill for crypto.getRandomValues in Node environment (required by Vite/Vitest)
import { webcrypto } from 'node:crypto';

// @ts-ignore
if (typeof globalThis.crypto === 'undefined') {
    // @ts-ignore
    globalThis.crypto = webcrypto;
} else if (typeof globalThis.crypto.getRandomValues === 'undefined') {
    // @ts-ignore
    globalThis.crypto.getRandomValues = webcrypto.getRandomValues.bind(webcrypto);
}
