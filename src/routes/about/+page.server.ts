import * as fs from "fs/promises";

export const ssr = true;

export async function load() {
    let stats = await fs.stat("src/lib/misc/actiondump.json");
    let lastActiondumpUpdate = stats.mtime.getTime() / 1000;
    return {
        lastActiondumpUpdate: lastActiondumpUpdate
    }
}