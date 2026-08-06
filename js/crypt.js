(function() {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    function toBase64(bytes) {
        return btoa(String.fromCharCode(...bytes));
    }

    function fromBase64(str) {
        return Uint8Array.from(atob(str), c => c.charCodeAt(0));
    }

    async function deriveKey(password, salt) {
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt", "decrypt"]
        );
    }

    async function encrypt(text, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const key = await deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv
            },
            key,
            encoder.encode(text)
        );

        return JSON.stringify({
            salt: toBase64(salt),
            iv: toBase64(iv),
            data: toBase64(new Uint8Array(encrypted))
        });
    }

    async function decrypt(encryptedJson, password) {
        const { salt, iv, data } = encryptedJson;

        const key = await deriveKey(password, fromBase64(salt));

        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: fromBase64(iv)
            },
            key,
            fromBase64(data)
        );

        return decoder.decode(decrypted);
    }

    window.crypt = {
        encrypt: async function(data, key) {
            return await encrypt(data, key);
        },
        decrypt: async function(data, prompt = true, key = '') {
            if (prompt) {
                key = window.prompt('Enter password', key);
            }

            return await decrypt(data, key);
        }
    };
})();