(function() {
    const crcTable = (() => {
        const table = new Uint32Array(256);

        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c >>> 0;
        }

        return table;
    })();

    const crc32 = function(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);

        let crc = 0xffffffff;

        for (const b of bytes) {
            crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
        }

        return (crc ^ 0xffffffff) >>> 0;
    }

    window.hash = crc32;
})();