const hexCharset = "0123456789abcdef".split("");

export const sha256 = "SHA-256";

Uint8Array.prototype.toHex = function() {
    return [...this].map(c => hexCharset[c >> 4] + hexCharset[c & 15]).join("");
};

Uint8Array.prototype.hasPrefix = function(array, bits) {
    for(let i = 0; i < array.length && i * 8 < bits; i++) {
        const bitsForByte = Math.min(8, bits - i * 8);
        const bitMask = ((1 << bitsForByte) - 1) << (8 - bitsForByte);

        if ((this[i] & bitMask) != (array[i] & bitMask)) {
            return false;
        }
    }
    return true;
};

export async function digest(algo, input) {
    return new Uint8Array(await crypto.subtle.digest(algo, new TextEncoder().encode(input)));
}