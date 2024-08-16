import {makeSuffix} from "./content";
import {digest, sha256} from "./hash";

import "./default-styles.css";
import {Challenge, validateChallenge} from "./challenge";

async function findHashWithPrefix(hashPrefixBits: number, inputPrefix: string): Promise<string> {
    const hashPrefix = new Uint8Array(Array(Math.ceil(hashPrefixBits / 8)).map(_ => 0));
    let iteration = 0;
    
    do {
        var message = inputPrefix + makeSuffix(iteration++);
        var hash = await digest(sha256, message);
    } while (!hash.hasPrefix(hashPrefix, hashPrefixBits));
    
    return message;
}

function initCaptchaContentAndGetCheckbox(captcha: Element): Element {
    const checkbox = document.createElement("div");
    checkbox.classList.add("checkbox");
    captcha.append(checkbox);

    const text = document.createElement("span");
    text.innerText = "I am not a robot";
    captcha.append(text);

    return checkbox;
}

function prepareChallengeExecution(challenge: Challenge): () => Promise<void> {
    return async function() {
        console.log("Calculating...");

        this.classList.add("loading");

        const response = await findHashWithPrefix(challenge.prefixBits, challenge.input);
        console.log("Challenge Response: " + response);

        this.classList.remove("loading");
        this.classList.add("checked");
    }
}

async function prepareCaptcha(captcha: Element) {
    const challengeUrl = captcha.getAttribute("data-challenge-url");
    if (!challengeUrl) {
        console.warn("No challenge URL found.");
        return;
    }

    const checkbox = initCaptchaContentAndGetCheckbox(captcha);
    checkbox.classList.add("loading");

    const challengeResponse = await fetch(challengeUrl);
    const challenge = await challengeResponse.json() as Challenge;

    if (!validateChallenge(challenge)) {
        console.warn("Challenge is invalid.");
        return;
    }

    checkbox.classList.remove("loading");

    checkbox.addEventListener("click", prepareChallengeExecution(challenge));
}

window.addEventListener("load", () => {
    console.log("load");
    [...document.getElementsByClassName("captcha")].forEach(prepareCaptcha);
});
