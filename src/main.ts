import {digest} from "./hash";

import "./default-styles.css";
import {Challenge, validateChallenge} from "./challenge";

const CLASS_CHECKBOX = "checkbox";
const CLASS_LOADING = "loading";
const CLASS_CHECKED = "checked";
const CLASS_SILENT = "silent";

const DATA_CHALLENGE_URL = "data-challenge-url";
const DATA_SUCCESS_CALLBACK = "data-success-callback";
const DATA_INPUT_SELECTOR = "data-input-selector";
const DATA_TEXT = "data-text";

const DEFAULT_TEXT = "I am not a robot";

const _document = document; // for optimization
const classList = "classList"; // for optimization
const querySelectorAll = "querySelectorAll"; // for optimization
const createElement = "createElement"; // for optimization
const getAttribute = "getAttribute"; // for optimization

const findHashWithPrefix = async (algo: string, hashPrefixBits: number, inputPrefix: string): Promise<string> => {
    const hashPrefix = new Uint8Array(Array(Math.ceil(hashPrefixBits / 8)).map(_ => 0));
    let iteration = 0;

    let message: string;
    let hash: Uint8Array;
    
    do {
        message = inputPrefix + (iteration++).toString(36);
        hash = await digest(algo, message);
    } while (!hash.hasPrefix(hashPrefix, hashPrefixBits));
    
    return message;
}

const initCaptchaContentAndGetCheckbox = (captcha: Element): Element => {
    const checkbox = _document[createElement]("div");
    const text = _document[createElement]("span");

    checkbox[classList].add(CLASS_CHECKBOX, CLASS_LOADING);
    text.innerText = captcha[getAttribute](DATA_TEXT) || DEFAULT_TEXT;

    captcha.textContent = ""; // clear node
    captcha.append(checkbox, text);

    return checkbox;
}

const toggleChecked = (checkbox: Element) =>
    checkbox[classList].toggle(CLASS_CHECKED);

const toggleLoading = (checkbox: Element) =>
    checkbox[classList].toggle(CLASS_LOADING);

const executeChallenge = async (challenge: Challenge, challengeCompletedCallback: (response: string) => Promise<void>): Promise<void> => {
    await challengeCompletedCallback(await findHashWithPrefix(challenge.algo, challenge.prefixBits, challenge.input));
}

const prepareSilentCaptcha = (_: Element, challengeCompletedCallback: (response: string) => Promise<void>): (challenge: Challenge) => Promise<void> => {
    return async (challenge: Challenge) => await executeChallenge(challenge, challengeCompletedCallback);
}

const prepareInputCaptcha = (captcha: Element, challengeCompletedCallback: (response: string) => Promise<void>): (challenge: Challenge) => Promise<void> => {
    const checkbox = initCaptchaContentAndGetCheckbox(captcha);

    return async (challenge: Challenge) => {
        checkbox.addEventListener("click", async function() {
            const _this = this; // for optimization

            if (_this[classList].contains(CLASS_LOADING) || _this[classList].contains(CLASS_CHECKED)) {
                return;
            }

            toggleLoading(_this);
            await executeChallenge(challenge, challengeCompletedCallback);
            toggleLoading(_this);
            toggleChecked(_this);
        });
        toggleLoading(checkbox);
    }
}

const prepareCaptcha = async (captcha: Element, staticSuccessCallback?: (response: string) => Promise<void>) => {
    const challengeUrl = captcha[getAttribute](DATA_CHALLENGE_URL);
    const successCallback = captcha[getAttribute](DATA_SUCCESS_CALLBACK);
    const inputSelector = captcha[getAttribute](DATA_INPUT_SELECTOR);

    const setInputValue = (response: string) => {
        if (inputSelector) [..._document[querySelectorAll](inputSelector)].forEach((input: HTMLInputElement) => input.value = response)
    }

    const challengeCompletesCallback = async (response: string) => {
        if (staticSuccessCallback) await staticSuccessCallback(response);
        else if (successCallback) [eval][0](successCallback)(response);
        setInputValue(response);
    };

    if (!challengeUrl) {
        throw "No challenge";
    }

    // reset form input value
    setInputValue("");

    const initDoneCallback = (captcha[classList].contains(CLASS_SILENT)
            ? prepareSilentCaptcha
            : prepareInputCaptcha)
        (captcha, challengeCompletesCallback);

    const challengeResponse = await fetch(challengeUrl);
    const challenge = await challengeResponse.json() as Challenge;

    if (!validateChallenge(challenge)) {
        throw "Bad challenge";
    }

    await initDoneCallback(challenge);
}

window.addEventListener("load", () =>
    [..._document[querySelectorAll](".captcha")].forEach(prepareCaptcha)
);

declare global {
    interface Window {
        prepareCaptcha: (captcha: Element) => Promise<void>;
    }
}

window.prepareCaptcha = prepareCaptcha;
