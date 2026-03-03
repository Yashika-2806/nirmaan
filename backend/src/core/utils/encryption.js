const CryptoJS = require('crypto-js');
const config = require('../../config/env');

class Encryption {
    static encrypt(text) {
        if (!text) return null;
        return CryptoJS.AES.encrypt(text, config.encryptionKey).toString();
    }

    static decrypt(ciphertext) {
        if (!ciphertext) return null;
        const bytes = CryptoJS.AES.decrypt(ciphertext, config.encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}

module.exports = Encryption;
