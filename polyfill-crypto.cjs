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

// Minimal WHATWG Fetch polyfills for environments lacking them (Node < 18).
if (typeof global.Headers !== 'function') {
	class HeadersPolyfill {
		constructor(init) {
			this.map = new Map();
			if (init instanceof HeadersPolyfill) {
				init.forEach((value, key) => this.map.set(key, value));
			} else if (Array.isArray(init)) {
				init.forEach(([key, value]) => this.map.set(String(key).toLowerCase(), String(value)));
			} else if (init && typeof init === 'object') {
				Object.entries(init).forEach(([key, value]) => this.map.set(String(key).toLowerCase(), String(value)));
			}
		}
		append(key, value) {
			this.map.set(String(key).toLowerCase(), String(value));
		}
		get(key) {
			return this.map.get(String(key).toLowerCase()) ?? null;
		}
		has(key) {
			return this.map.has(String(key).toLowerCase());
		}
		set(key, value) {
			this.map.set(String(key).toLowerCase(), String(value));
		}
		delete(key) {
			this.map.delete(String(key).toLowerCase());
		}
		forEach(callback) {
			this.map.forEach((value, key) => callback(value, key, this));
		}
	}
	global.Headers = HeadersPolyfill;
}

if (typeof global.Request !== 'function') {
	class RequestPolyfill {
		constructor(input, init = {}) {
			this.url = typeof input === 'string' ? input : input?.url ?? '';
			this.method = init.method ?? 'GET';
			this.headers = init.headers instanceof global.Headers ? init.headers : new global.Headers(init.headers);
			this.body = init.body ?? null;
		}
	}
	global.Request = RequestPolyfill;
}

if (typeof global.Response !== 'function') {
	class ResponsePolyfill {
		constructor(body = null, init = {}) {
			this.body = body;
			this.status = init.status ?? 200;
			this.statusText = init.statusText ?? 'OK';
			this.headers = init.headers instanceof global.Headers ? init.headers : new global.Headers(init.headers);
		}
		async json() {
			return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
		}
		async text() {
			return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
		}
	}
	global.Response = ResponsePolyfill;
}

if (typeof global.fetch !== 'function') {
	global.fetch = async () => {
		throw new Error('fetch is not implemented in this environment. Provide a custom polyfill if needed.');
	};
}
