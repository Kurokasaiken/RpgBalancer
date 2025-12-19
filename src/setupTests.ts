// Polyfill for crypto.getRandomValues in Node environment (required by Vite/Vitest)
import { webcrypto } from 'node:crypto';

type GlobalWithCrypto = typeof globalThis & {
    crypto?: Crypto & { getRandomValues?: Crypto['getRandomValues'] };
};

const globalWithCrypto = globalThis as GlobalWithCrypto;

if (!globalWithCrypto.crypto) {
    globalWithCrypto.crypto = webcrypto as typeof globalWithCrypto.crypto;
} else if (!globalWithCrypto.crypto.getRandomValues) {
    globalWithCrypto.crypto.getRandomValues = webcrypto.getRandomValues.bind(
        webcrypto,
    ) as typeof globalWithCrypto.crypto.getRandomValues;
}
