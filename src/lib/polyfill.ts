// @ts-nocheck
let zlib = null;
let pako = null;

if (typeof window == "undefined") {
    zlib = await import("zlib");
} else {
    pako = await import("pako");
}

export function toGzipB64(data: string): string {
    if (typeof window == "undefined") {
        return zlib.gzipSync(data).toString("base64");
    } else {
        let data2 = pako.gzip(data);
        let data3 = String.fromCharCode.apply(null, [...new Uint16Array(data2)]);
        return btoa(data3);
    }
}

export function fromGzipB64(data: string): string {
    if (typeof window == "undefined") {
        return zlib.gunzipSync(Buffer.from(data, "base64")).toString();
    } else {
        let compressData = atob(data);
        let uint = compressData.split('').map(function (e) {
            return e.charCodeAt(0);
        });
        let binData = new Uint8Array(uint);
        return pako.inflate(binData, {to: 'string'});
    }
}