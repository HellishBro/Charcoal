import actiondump from "$lib/misc/actiondump.json"

export const ssr = true;

export async function load() {
    return {
        actiondump: actiondump
    }
}