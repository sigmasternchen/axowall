const suffixCharset = [
    "0123456789",
    "abcdefghijklmnopqrstuvwxyz",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "+-",
].flatMap(set => set.split(""));
const suffixCharsetBits = 6;

export function makeSuffix(index) {
    let result = "";

    while (index > 0) {
        result += suffixCharset[index & ((1 << suffixCharsetBits) - 1)];
        index >>= suffixCharsetBits;
    }

    return result;
}