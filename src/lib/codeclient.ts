import { SNBTWriter, TagByte, TagCompound, TagString } from "./nbt";

export class CodeClient {
    socket: WebSocket | undefined;

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket("ws://localhost:31375");
            this.socket.onopen = () => {resolve();};
            this.socket.onerror = () => {reject();}
        });
    }

    giveTemplate(templateCode: string, name: string, author: string) {
        const item = new TagCompound({
            "count": new TagByte(1),
            "id": new TagString("minecraft:ender_chest"),
            "components": new TagCompound({
                "minecraft:custom_name": new TagCompound({
                    "italic": new TagByte(0),
                    "text": new TagString(name)
                }),
                "minecraft:custom_data": new TagCompound({
                    "PublicBukkitValues": new TagCompound({
                        "hypercube:codetemplatedata": new TagString(JSON.stringify({
                            author: author,
                            name: name,
                            code: templateCode
                        }))
                    })
                })
            })
        });
        this.socket?.send("give " + new SNBTWriter().write(item) + "\n");
    }

    close() {
        this.socket?.close();
    }
}