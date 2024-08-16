import {makeSuffix} from "./content";
import {digest, sha256} from "./hash";

async function findHashWithPrefix(hashPrefixBits: number, inputPrefix: string): Promise<string> {
    const hashPrefix = new Uint8Array(Array(Math.ceil(hashPrefixBits / 8)).map(_ => 0));
    let iteration = 0;
    
    do {
        var message = inputPrefix + makeSuffix(iteration++);
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
