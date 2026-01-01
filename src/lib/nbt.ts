export class Tag<T> {
    data: T
    constructor(data: T) {
        this.data = data;
    }
}

export class TagByte extends Tag<number> {}
export class TagShort extends Tag<number> {}
export class TagInt extends Tag<number> {}
export class TagLong extends Tag<number> {}
export class TagFloat extends Tag<number> {}
export class TagDouble extends Tag<number> {}
export class TagString extends Tag<string> {}
export class TagList extends Tag<Tag<any>[]> {}
export class TagCompound extends Tag<{[key: string]: Tag<any>}> {}
export class TagByteArray extends Tag<number[]> {}
export class TagIntArray extends Tag<number[]> {}
export class TagLongArray extends Tag<number[]> {}

const alphaNumeric: string = "0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_-.+";

export class SNBTParser {
    snbtString: string;
    index: number;

    constructor(data: string) {
        this.snbtString = data;
        this.index = 0;
    }

    peek(skipWs: boolean = false): string {
        let i = this.index;
        if (skipWs) {
            while (" \n\r\t".includes(this.snbtString[i])) i++;
        }
        return this.snbtString[i];
    }

    consume(): string {
        while (" \n\r\t".includes(this.peek())) this.index++;
        let current = this.peek();
        this.index++;
        return current;
    }

    match<T, U>(expected: string, trueCb: (matched: string) => T, falseCb: () => U): T | U {
        if (expected.includes(this.peek(true))) return trueCb(this.consume());
        else return falseCb();
    }

    parseObject(): TagCompound {
        let keys: string[] = [];
        let values: Tag<any>[] = [];
        while (this.peek() != "}") {
            let key: string = this.parse().data.toString();
            this.consume();
            keys.push(key);
            values.push(this.parse());
            if (this.peek() == ',') this.consume();
        }
        this.consume();
        return new TagCompound(Object.fromEntries(keys.map((_, i) => [keys[i], values[i]])));
    }

    parseNumber(pre: string): TagByte | TagShort | TagInt | TagLong | TagFloat | TagDouble {
        let numberString = pre;
        let decimal = pre == '.';
        while ("1234567890.".includes(this.peek())) {
            let char = this.consume();
            if (decimal && char == '.') {
                continue;
            }
            if (char == '.') decimal = true;
            numberString += char;
        }
        let float = parseFloat(numberString);
        let int = Math.floor(float);
        return this.match('bB', _ => {
            return new TagByte(int);
        }, () => {
            return this.match('sS', _ => {
                return new TagShort(int);
            }, () => {
                return this.match('iI', _ => {
                    return new TagInt(int);
                }, () => {
                    return this.match('lL', _ => {
                        return new TagLong(int);
                    }, () => {
                        return this.match('fF', _ => {
                            return new TagFloat(float);
                        }, () => {
                            return this.match('dD', _ => {
                                return new TagDouble(float);
                            }, () => {
                                return new TagInt(int);
                            });
                        });
                    });
                });
            });
        });
    }

    parseString(pre: string): TagString {
        let quote = pre;
        let result = "";
        while (this.peek() != quote) {
            let current = this.peek();
            this.index++;

            if (current == "\\") {
                let next = this.peek();
                this.index++;

                if (next == "b") {
                    result += "\b";
                } else if (next == "f") {
                    result += "\f";
                } else if (next == "n") {
                    result += "\n";
                } else if (next == "r") {
                    result += "\r";
                } else if (next == "s") {
                    result += " ";
                } else if (next == "t") {
                    result += "\t";
                } else if (next == "\\") {
                    result += "\\";
                } else if (next == "'") {
                    result += "'";
                } else if (next == '"') {
                    result += '"';
                } else if (next == "x") {
                    let hex1 = this.peek();
                    this.index++;
                    let hex2 = this.peek();
                    this.index++;
                    let code = parseInt(hex1 + hex2, 16);
                    result += String.fromCharCode(code);
                } else if (next == "u") {
                    let hex = "";
                    for (let i = 0; i < 4; i++) {
                        hex += this.peek();
                        this.index++;
                    }
                    let code = parseInt(hex, 16);
                    result += String.fromCharCode(code);
                } else if (next == "U") {
                    let hex8 = this.snbtString.substring(this.index, this.index + 8);
                    this.index += 8;
                    let code = parseInt(hex8, 16);
                    if (code <= 0xFFFF) {
                        result += String.fromCharCode(code);
                    } else {
                        let high = Math.floor((code - 0x10000) / 0x400) + 0xD800;
                        let low = ((code - 0x10000) % 0x400) + 0xDC00;
                        result += String.fromCharCode(high, low);
                    }
                    break;
                } else {
                    result += "\\" + next;
                }
            } else result += current;
        }
        this.consume();
        return new TagString(result);
    }

    parseUnquotedString(pre: string): TagString {
        let result = pre;
        while (alphaNumeric.includes(this.peek())) {
            result += this.peek();
            this.index++;
        }
        return new TagString(result);
    }

    parseListOrArray(): TagList | TagByteArray | TagIntArray | TagLongArray {
        let t: string = '';
        this.match('B', _ => {
            t = 'B';
            this.consume();
        }, () => {
            this.match('I', _ => {
                t = 'I';
                this.consume();
            }, () => {
                this.match('L', _ => {
                    t = 'L';
                    this.consume();
                }, () => {});
            });
        });
        if (t == '') {
            let array: any[] = [];
            while (this.peek() != ']') {
                array.push(this.parse());
                if (this.peek() == ',') this.consume();
            }
            this.consume();
            return new TagList(array);
        }
        let array: number[] = [];
        while (this.peek() != ']') {
            array.push(this.parse().data as number);
            if (this.peek() == ',') this.consume();
        }
        this.consume();
        if (t == 'B') return new TagByteArray(array);
        else if (t == 'I') return new TagIntArray(array);
        else if (t == 'L') return new TagLongArray(array);
        throw new Error('unreachable');
    }

    parse(): TagCompound | TagByte | TagShort | TagInt | TagLong | TagFloat | TagDouble | TagString | TagList | TagByteArray | TagIntArray | TagLongArray {
        return this.match("{", _ => {
            return this.parseObject();
        }, () => {
            return this.match("1234567890.-", matched => {
                return this.parseNumber(matched);
            }, () => {
                return this.match('"\'', matched => {
                    return this.parseString(matched);
                }, () => {
                    return this.match('[', _ => {
                        return this.parseListOrArray();
                    }, () => {
                        return this.match(alphaNumeric, matched => {
                            return this.parseUnquotedString(matched);
                        }, () => {
                            throw new Error("Cannot parse character '" + this.peek() + "'");
                        });
                    });
                });
            });
        });
    }
}

export class SNBTWriter {
    write(tree: Tag<any>): string {
        if (tree instanceof TagCompound) {
            let entries: string[] = [];
            for (let [key, value] of Object.entries(tree.data)) {
                entries.push(this.write(new TagString(key)) + ": " + this.write(value));
            }
            return "{" + entries.join(", ") + "}";
        } else if (tree instanceof TagList) {
            let entries: string[] = [];
            for (let element of tree.data) {
                entries.push(this.write(element));
            }
            return "[" + entries.join(", ") + "]";
        } else if (tree instanceof TagByteArray) {
            let entries: string[] = [];
            for (let element of tree.data) {
                entries.push(this.write(new TagByte(element)));
            }
            return "[B;" + entries.join(", ") + "]";
        } else if (tree instanceof TagIntArray) {
            let entries: string[] = [];
            for (let element of tree.data) {
                entries.push(this.write(new TagInt(element)));
            }
            return "[I;" + entries.join(", ") + "]";
        } else if (tree instanceof TagLongArray) {
            let entries: string[] = [];
            for (let element of tree.data) {
                entries.push(this.write(new TagLong(element)));
            }
            return "[L;" + entries.join(", ") + "]";
        } else if (tree instanceof TagString) {
            return '"' + tree.data
                    .replaceAll("\\", "\\\\")
                    .replaceAll("\b", "\\b")
                    .replaceAll("\f", "\\f")
                    .replaceAll("\n", "\\n")
                    .replaceAll("\r", "\\r")
                    .replaceAll("\t", "\\t")
                    .replaceAll("'", "\\'")
                    .replaceAll('"', '\\"')
                + '"';
        } else if (tree instanceof TagByte) {
            return tree.data.toString() + "b";
        } else if (tree instanceof TagShort) {
            return tree.data.toString() + "s";
        } else if (tree instanceof TagInt) {
            return tree.data.toString();
        } else if (tree instanceof TagLong) {
            return tree.data.toString() + "l";
        } else if (tree instanceof TagFloat) {
            return tree.data.toString() + "f";
        } else if (tree instanceof TagDouble) {
            return tree.data.toString() + "d";
        }
        throw new Error('unreachable');
    }
}