const crypto = require('crypto');
if (!global.crypto) {
    global.crypto = {};
}
if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = function (buffer) {
        return crypto.randomFillSync(buffer);
    };
}
