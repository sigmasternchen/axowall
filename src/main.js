const hexCharset = "0123456789abcdef".split("");
const suffixCharset = [
    "0123456789", 
    "abcdefghijklmnopqrstuvwxyz",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 
    "+-",
].flatMap(set => set.split(""));
const suffixCharsetBits = 6;

const sha256 = "SHA-256";

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

async function digest(algo, input) {
    return new Uint8Array(await crypto.subtle.digest(algo, new TextEncoder().encode(input)));
}

function makeSuffix(index) {
    let result = "";
    
    while (index > 0) {
        result += suffixCharset[index & ((1 << suffixCharsetBits) - 1)];
        index >>= suffixCharsetBits;
    }
    
    return result;
}

async function findHashWithPrefix(hashPrefixBits, inputPrefix) {
    const hashPrefix = new Uint8Array(Array(Math.ceil(hashPrefixBits / 8)).map(c => 0));
    let iteration = 0;
    
    do {
        var message = inputPrefix + makeSuffix(iteration++)
        var hash = await digest(sha256, message);
    } while (!hash.hasPrefix(hashPrefix, hashPrefixBits));
    
    return message;
}

window.addEventListener("load", () => {
    console.log("load");
    [...document.getElementsByClassName("captcha")].forEach(captcha => {
        console.dir(captcha);
        const checkbox = document.createElement("div");
        checkbox.classList.add("checkbox");
        captcha.append(checkbox);
        
        const text = document.createElement("span");
        text.innerText = "I am not a robot";
        captcha.append(text);
    
        checkbox.addEventListener("click", async function() {
            console.log("Calculating..."); 

            this.classList.add("loading");

            const challenge = makeSuffix(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) + ":" + makeSuffix(new Date().valueOf()) + ":";

            const response = await findHashWithPrefix(15, challenge);
            console.log("Challenge Response: " + response);

            this.classList.remove("loading");
            this.classList.add("checked");
        })
    });
});
