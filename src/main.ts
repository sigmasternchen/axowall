import {digest} from "./hash";

import "./default-styles.css";
import {Challenge, validateChallenge} from "./challenge";

const CLASS_CHECKBOX = "checkbox";
const CLASS_LOADING = "loading";
const CLASS_CHECKED = "checked";

const findHashWithPrefix = async (algo: string, hashPrefixBits: number, inputPrefix: string): Promise<string> => {
    const hashPrefix = new Uint8Array(Array(Math.ceil(hashPrefixBits / 8)).map(_ => 0));
    let iteration = 0;
    
    do {
        var message = inputPrefix + (iteration++).toString(36);
        var hash = await digest(algo, message);
    } while (!hash.hasPrefix(hashPrefix, hashPrefixBits));
    
    return message;
}

function initCaptchaContentAndGetCheckbox(captcha: Element): Element {
    const checkbox = document.createElement("div");
    checkbox.classList.add(CLASS_CHECKBOX, CLASS_LOADING);

    const text = document.createElement("span");
    text.innerText = "I am not a robot";

    captcha.append(checkbox, text);

    return checkbox;
}

const toggleChecked = (checkbox: Element) =>
    checkbox.classList.toggle(CLASS_CHECKED);

const toggleLoading = (checkbox: Element) =>
    checkbox.classList.toggle(CLASS_LOADING);

function prepareChallengeExecution(challenge: Challenge, callback: (response: string) => void): () => Promise<void> {
    return async function() {
        toggleLoading(this);

        callback(await findHashWithPrefix(challenge.algo, challenge.prefixBits, challenge.input));

        toggleLoading(this);
        toggleChecked(this);
    }
}

const prepareCaptcha = async (captcha: Element) => {
    const challengeUrl = captcha.getAttribute("data-challenge-url");
    if (!challengeUrl) {
        throw "No challenge URL found.";
    }

    let successCallback = captcha.getAttribute("data-success-callback");
    let inputSelector = captcha.getAttribute("data-input-selector");

    const checkbox = initCaptchaContentAndGetCheckbox(captcha);

    const challengeResponse = await fetch(challengeUrl);
    const challenge = await challengeResponse.json() as Challenge;

    if (!validateChallenge(challenge)) {
        throw "Challenge is invalid.";
    }

    toggleLoading(checkbox);

    checkbox.addEventListener("click", prepareChallengeExecution(challenge, response => {
        if (successCallback) eval(successCallback)(response);
        if (inputSelector) [...document.querySelectorAll(inputSelector)].forEach((input: HTMLInputElement) => input.value = response)
    }));
}

window.addEventListener("load", () =>
    [...document.getElementsByClassName("captcha")].forEach(prepareCaptcha)
);
