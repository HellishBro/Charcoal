import MiniMessage from "minimessage-js";
import type { MiniMessageInstance } from "minimessage-js/types/spec";
import { randomChoice, range } from "./utils";
import en_us from "$lib/misc/en_us.json";

export let miniMessage: MiniMessageInstance | null = null;
export let translations: { [key: string]: string } | null = null;

export async function fetchTranslations() {
    if (!translations)
        translations = en_us;
}

export async function render(mm: string): Promise<string> {
    if (!miniMessage) {
        await fetchTranslations();
        miniMessage = MiniMessage.builder()
            .translations(translations!)
            .build();
    }

    return miniMessage.toHTML(miniMessage.deserialize(mm)).replaceAll("\n", "<br />");
}

export function fastRender(mm: string): string {
    let miniMessage = MiniMessage.miniMessage();
    return miniMessage.toHTML(miniMessage.deserialize(mm)).replaceAll("\n", "<br />");
}

let obfTextId = 0;
export function startObfuscateText() {
    function obfuscateElement(node: Node) {
        if (node.hasChildNodes()) {
            node.childNodes.forEach(obfuscateElement);
        } else {
            if (node.nodeValue != null) {
                let text = node.nodeValue as string;
                let outputText = "";
                for (let char of text) {
                    if (char == " ") { outputText += " "; continue; }
                    outputText += randomChoice(String.fromCharCode(...range(33, 256, 1,  [127, 129, 141, 143, 144, 160, 173])));
                }
                node.nodeValue = outputText;
            }
        }
    }

    let start = 0;

    function animation(timestamp: number) {
        let dt = timestamp - start;
        if (dt >= 50) {
            start = timestamp;
            let obfuscated = document.querySelectorAll("[data-mm-obfuscated='true']");
            obfuscated.forEach(node => {
                obfuscateElement(node);
            })
        }
        obfTextId = requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);
}

export function stopObfuscatedText() {
    if (typeof window == "undefined") return;
    cancelAnimationFrame(obfTextId);
}