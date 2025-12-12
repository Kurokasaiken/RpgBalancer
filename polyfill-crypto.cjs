const nodeCrypto = require('crypto');

// Ensure the Node crypto module itself exposes getRandomValues so that
// libraries importing 'crypto' can call crypto.getRandomValues(...).
if (typeof nodeCrypto.getRandomValues !== 'function') {
	(nodeCrypto).getRandomValues = function (buffer) {
		return nodeCrypto.randomFillSync(buffer);
	};
}

// Also expose a Web Crypto–like object on globalThis.crypto, reusing
// nodeCrypto.webcrypto when available.
if (!global.crypto) {
	// Prefer the built-in webcrypto implementation when present.
	global.crypto = nodeCrypto.webcrypto || {};
}

if (typeof global.crypto.getRandomValues !== 'function') {
	global.crypto.getRandomValues = nodeCrypto.getRandomValues;
}
