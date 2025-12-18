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

// Vitest + jsdom pull in WHATWG URL polyfills that expect modern
// Resizable ArrayBuffer fields to exist. Older Node builds (and our
// test polyfills) do not yet expose them, so we provide minimal
// non-resizable shims to keep the modules happy.
function ensureTypedBufferDescriptors(proto, options) {
	if (!proto) return;

	const {
		resizableKey,
		maxLengthKey,
		resizeMethod,
	} = options;

	if (resizableKey && !Object.getOwnPropertyDescriptor(proto, resizableKey)) {
		Object.defineProperty(proto, resizableKey, {
			configurable: true,
			enumerable: false,
			get() {
				return false;
			},
		});
	}

	if (maxLengthKey && !Object.getOwnPropertyDescriptor(proto, maxLengthKey)) {
		Object.defineProperty(proto, maxLengthKey, {
			configurable: true,
			enumerable: false,
			get() {
				return this.byteLength;
			},
		});
	}

	if (resizeMethod && typeof proto[resizeMethod] !== 'function') {
		Object.defineProperty(proto, resizeMethod, {
			configurable: true,
			value() {
				throw new TypeError('Resizable ArrayBuffers are not supported in this environment.');
			},
		});
	}
}

ensureTypedBufferDescriptors(global.ArrayBuffer && global.ArrayBuffer.prototype, {
	resizableKey: 'resizable',
	maxLengthKey: 'maxByteLength',
	resizeMethod: 'resize',
});

if (typeof global.SharedArrayBuffer !== 'function') {
	function SharedArrayBufferShim(byteLength = 0) {
		const buffer = new ArrayBuffer(byteLength);
		// Mirror ArrayBuffer API surface minimally
		Object.defineProperty(this, 'byteLength', {
			value: buffer.byteLength,
			enumerable: false,
			configurable: false,
		});
		if (buffer.slice) {
			this.slice = buffer.slice.bind(buffer);
		}
		throw new TypeError('SharedArrayBuffer is not supported in this environment.');
	}

	SharedArrayBufferShim.prototype = Object.create(
		(global.ArrayBuffer && global.ArrayBuffer.prototype) || Object.prototype,
	);
	SharedArrayBufferShim.prototype.constructor = SharedArrayBufferShim;

	global.SharedArrayBuffer = SharedArrayBufferShim;
}

ensureTypedBufferDescriptors(global.SharedArrayBuffer && global.SharedArrayBuffer.prototype, {
	resizableKey: 'growable',
	maxLengthKey: 'maxGrowableByteLength',
	resizeMethod: 'grow',
});
