import {digest} from "./hash";

import "./default-styles.css";
import {Challenge, validateChallenge} from "./challenge";

const CLASS_CHECKBOX = "checkbox";
const CLASS_LOADING = "loading";
const CLASS_CHECKED = "checked";
const CLASS_SILENT = "silent";

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

const executeChallenge = async (challenge: Challenge, challengeCompletedCallback: (response: string) => void): Promise<void> => {
    challengeCompletedCallback(await findHashWithPrefix(challenge.algo, challenge.prefixBits, challenge.input));
}

const prepareSilentCaptcha = (_: Element, challengeCompletedCallback: (response: string) => void): (challenge: Challenge) => Promise<void> => {
    return async (challenge: Challenge) => await executeChallenge(challenge, challengeCompletedCallback);
}

const prepareInputCaptcha = (captcha: Element, challengeCompletedCallback: (response: string) => void): (challenge: Challenge) => Promise<void> => {
    const checkbox = initCaptchaContentAndGetCheckbox(captcha);

    return async (challenge: Challenge) => {
        checkbox.addEventListener("click", async function() {
            toggleLoading(this);
            await executeChallenge(challenge, challengeCompletedCallback);
            toggleLoading(this);
            toggleChecked(this);
        });
        toggleLoading(checkbox);
    }
}

const prepareCaptcha = async (captcha: Element) => {
    const challengeUrl = captcha.getAttribute("data-challenge-url");
    if (!challengeUrl) {
        throw "No challenge URL found.";
    }

    const challengeCompletesCallback = (response: string) => {
        const successCallback = captcha.getAttribute("data-success-callback");
        const inputSelector = captcha.getAttribute("data-input-selector");

        if (successCallback) eval(successCallback)(response);
        if (inputSelector) [...document.querySelectorAll(inputSelector)].forEach((input: HTMLInputElement) => input.value = response)
    };

    const initDoneCallback = (captcha.classList.contains(CLASS_SILENT)
            ? prepareSilentCaptcha
            : prepareInputCaptcha)
        (captcha, challengeCompletesCallback);

    const challengeResponse = await fetch(challengeUrl);
    const challenge = await challengeResponse.json() as Challenge;

    if (!validateChallenge(challenge)) {
        throw "Challenge is invalid.";
    }

    await initDoneCallback(challenge);
}

window.addEventListener("load", () =>
    [...document.getElementsByClassName("captcha")].forEach(prepareCaptcha)
);
