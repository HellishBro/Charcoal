import * as badWords from "./misc/bad_words.txt";

export function isJSON(s: string): boolean {
    try {
        JSON.parse(s);
        return true;
    } catch {
        return false;
    }
}

export function randomChoice(elements: string): string;
export function randomChoice<T>(elements: Array<T>): T;
export function randomChoice(elements: string | any[]) {
    return elements[Math.floor(Math.random() * elements.length)];
}

export function range(start: number, end: number, step: number = 1, excludes: number[] | null = null): number[] {
    let exclusions = excludes || [];
    let output: number[] = [];
    let i = start;
    while (step < 0 ? (i > end) : (i < end)) {
        if (!exclusions.includes(i)) {
            output.push(i);
        }
        i += step;
    }
    return output;
}

export function getMCItemRenderURI(itemID: string | undefined): string | undefined {
    if (itemID)
        return `https://raw.githubusercontent.com/Owen1212055/mc-assets/refs/heads/main/item-assets/${itemID.toUpperCase()}.png`;
    return undefined
}

export function downloadBlob(blob: Blob, filename: string) {
    try {
        let link = document.createElement('a');
        let url = window.URL.createObjectURL(blob);
        link.href = url;
        link.style.display = "none";
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
    } catch (e) {
        console.error(e);
    }
}

export function percentEncodeString(str: string): string {
    return str.split('')
        .map(char => '%' + char.charCodeAt(0).toString(16).toUpperCase())
        .join('');
}

function encodeSwearWords(str: string): string {
    const swearWords = badWords.default.split("\n");
    let result = str;

    swearWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        result = result.replace(regex, (match) => percentEncodeString(match));
    });

    return result;
}

export function toURLSafeB64(base64: string): string {
    return encodeSwearWords(base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""));
}

export function fromURLSafeB64(urlSafe: string): string {
    return urlSafe.replaceAll("_", "/").replaceAll("-", "+") + "=".repeat((4 - urlSafe.length % 4) % 4);
}