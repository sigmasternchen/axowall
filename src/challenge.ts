
export type Challenge = {
    algo: string,
    prefixBits: number,
    input: string,
}

export const validateChallenge = (challenge: Challenge): boolean =>
    !!challenge.algo && challenge.prefixBits > 0 && !!challenge.input;