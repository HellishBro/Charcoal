import {fromURLSafeB64} from "$lib/utils";

export function load({ url }) {
    return {
        templateData: fromURLSafeB64(new URL(url).searchParams.get("template") ?? "")
    }
}