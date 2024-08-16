const hexCharset = "0123456789abcdef".split("");

export const sha256: AlgorithmIdentifier = "SHA-256";

declare global {
    interface Uint8Array {
        toHex(): string;
        hasPrefix(prefix: Uint8Array, bits: number): boolean;
    }
}

Uint8Array.prototype.toHex = function(): string {
    return [...this].map(c => hexCharset[c >> 4] + hexCharset[c & 15]).join("");
};

Uint8Array.prototype.hasPrefix = function(prefix: Uint8Array, bits: number): boolean {
    for(let i = 0; i < prefix.length && i * 8 < bits; i++) {
        const bitsForByte = Math.min(8, bits - i * 8);
        const bitMask = ((1 << bitsForByte) - 1) << (8 - bitsForByte);
        const currentBits = this[i] & bitMask;
        const prefixBits = prefix[i] & bitMask;

        if (currentBits != prefixBits) {
            return false;
        }
    }
    return true;
};

export async function digest(algo: AlgorithmIdentifier, input: string): Promise<Uint8Array> {
    return new Uint8Array(await crypto.subtle.digest(algo, new TextEncoder().encode(input)));
}
