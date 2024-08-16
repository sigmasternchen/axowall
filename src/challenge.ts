
export type Challenge = {
    algo: string,
    prefixBits: number,
    input: string,
}

export function validateChallenge(challenge: Challenge): boolean {
    return !!challenge.algo && challenge.prefixBits > 0 && !!challenge.input;
}