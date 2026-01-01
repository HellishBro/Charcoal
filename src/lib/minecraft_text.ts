import { Tag, TagByte, TagCompound, TagList, TagString } from "./nbt";
// @ts-ignore
import {Component, type IComponent} from "minimessage-js/dist/component/spec";

const colorMapping = {
    black: "#000000",
    dark_blue: "#0000AA",
    dark_green: "#00AA00",
    dark_aqua: "#00AAAA",
    dark_red: "#AA0000",
    dark_purple: "#AA00AA",
    gold: "#FFAA00",
    gray: "#AAAAAA",
    dark_gray: "#555555",
    blue: "#5555FF",
    green: "#55FF55",
    aqua: "#55FFFF",
    red: "#FF5555",
    light_purple: "#FF55FF",
    yellow: "#FFFF55",
    white: "#FFFFFF"
}

export function getColorHex(color: string): string {
    if (color.startsWith("#")) return color;
    if (color in colorMapping) return colorMapping[color as keyof typeof colorMapping];
    return "#ffffff";
}

class Formatting {
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;

    constructor(color?: string, bold?: boolean, italic?: boolean, underlined?: boolean, strikethrough?: boolean, obfuscated?: boolean) {
        this.color = color;
        this.bold = bold;
        this.italic = italic;
        this.underlined = underlined;
        this.strikethrough = strikethrough;
        this.obfuscated = obfuscated;
    }

    copyFrom(parent: Formatting): Formatting {
        return new Formatting(
            this.color ?? parent.color,
            this.bold ?? parent.bold,
            this.italic ?? parent.italic,
            this.underlined ?? parent.underlined,
            this.strikethrough ?? parent.strikethrough,
            this.obfuscated ?? parent.obfuscated,
        );
    }
}

export function validateText(text: TagString | TagList | TagCompound): TagCompound {
    if (text instanceof TagString) {
        return new TagCompound({
            "text": text
        });
    } else if (text instanceof TagList) {
        return new TagCompound({
            "text": new TagString(""),
            "color": new TagString("white"),
            "bold": new TagByte(0),
            "italic": new TagByte(0),
            "underlined": new TagByte(0),
            "strikethrough": new TagByte(0),
            "obfuscated": new TagByte(0),
            "extra": text
        });
    }
    return text;
}

export function escapeHtml(text: string): string {
    return text
        .replaceAll("&", '&amp;')
        .replaceAll("<", '&lt;')
        .replaceAll(">", '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export class ComponentHTMLConverter {
    static get<T>(component: Component, property: string, wrapper?: (data: any) => T): T | undefined {
        if (component.getProperty(property as keyof IComponent)) return (wrapper ?? (d => d))(component.getProperty(property as keyof IComponent));
        return undefined;
    }

    toSpan(component: Component, parentStyle: Formatting | null = null): string {
        let style = new Formatting(
            ComponentHTMLConverter.get(component, "color", getColorHex),
            ComponentHTMLConverter.get(component, "bold"),
            ComponentHTMLConverter.get(component, "italic"),
            ComponentHTMLConverter.get(component, "underlined"),
            ComponentHTMLConverter.get(component, "strikethrough"),
            ComponentHTMLConverter.get(component, "obfuscated")
        ).copyFrom(parentStyle ?? new Formatting("#FFFFFF", false, false, false, false, false));
        let textDecors: string[] = [];

        if (style.underlined) textDecors.push('underline');
        if (style.strikethrough) textDecors.push('line-through');
        let textDecor = textDecors.length == 0 ? 'none' : textDecors.join(' ');

        let doClass = '';
        if (style.obfuscated) doClass='data-mm-obfuscated="true"';

        let out = `<span style="color: ${style.color}; text-decoration-line: ${textDecor}" ${doClass}>`;
        if (style.bold) out += "<strong>";
        if (style.italic) out += "<em>";

        out += ComponentHTMLConverter.get(component, "text", d => escapeHtml(d as string)) ?? "";

        if (style.italic) out += "</em>";
        if (style.bold) out += "</strong>";

        ComponentHTMLConverter.get(component, "extra", extra => {
            for (let segment of extra) {
                console.log(segment);
                if (typeof segment == "string") {
                    out += escapeHtml(segment);
                } else {
                    out += this.toSpan(new Component(segment), style)
                }
            }
        });

        out += "</span>";
        return out;
    }
}

export class TextHTMLConverter {
    toSpan(text: TagCompound, parentStyle: Formatting | null = null): string {
        let data = text.data;
        let style = new Formatting(
            data.color ? getColorHex(data.color.data) : undefined,
            data.bold ? data.bold.data == 1 : undefined,
            data.italic ? data.italic.data == 1 : undefined,
            data.underlined ? data.underlined.data == 1 : undefined,
            data.strikethrough ? data.strikethrough.data == 1 : undefined,
            data.obfuscated ? data.obfuscated.data == 1 : undefined
        ).copyFrom(parentStyle ?? new Formatting("#FFFFFF", false, false, false, false, false));
        let textDecors: string[] = [];

        if (style.underlined) textDecors.push('underline');
        if (style.strikethrough) textDecors.push('line-through');
        let textDecor = textDecors.length == 0 ? 'none' : textDecors.join(' ');

        let doClass = '';
        if (style.obfuscated) doClass='data-mm-obfuscated="true"';

        let out = `<span style="color: ${style.color}; text-decoration-line: ${textDecor}" ${doClass}>`;
        if (style.bold) out += "<strong>";
        if (style.italic) out += "<em>";

        out += escapeHtml(data.text ? data.text.data as string : "");

        if (style.italic) out += "</em>";
        if (style.bold) out += "</strong>";

        if ("extra" in data) {
            for (let extra of data.extra.data) {
                out += this.toSpan(validateText(extra), style);
            }
        }

        out += "</span>";
        return out;
    }
}

export class ComponentTextConverter {
    static withDecoration(text: { [key: string]: Tag<any> }, component: Component, property: string): { [key: string]: Tag<any> } {
        if (component.getProperty(property as keyof IComponent)) text[property] = new TagByte(component.getProperty(property as keyof IComponent) ? 1 : 0);
        return text;
    }

    static resetStyles(text: TagCompound): TagCompound {
        return validateText(new TagList([text]));
    }

    toText(component: Component): TagCompound {
        let text: { [key: string]: Tag<any> } = {};
        if (component.getProperty("color")) text.color = new TagString(component.getProperty("color")!);
        text.text = new TagString(component.getProperty("text") ?? "");
        text = ComponentTextConverter.withDecoration(text, component, "italic");
        text = ComponentTextConverter.withDecoration(text, component, "bold");
        text = ComponentTextConverter.withDecoration(text, component, "underlined");
        text = ComponentTextConverter.withDecoration(text, component, "strikethrough");
        text = ComponentTextConverter.withDecoration(text, component, "obfuscated");
        if (component.getProperty("extra")) {
            let extras: (Component | string)[] = component.getProperty("extra")!;
            let extraParsed: (TagCompound | TagString)[] = [];
            for (let extra of extras) {
                if (typeof extra == "string") {
                    extraParsed.push(new TagString(extra));
                } else {
                    extraParsed.push(this.toText(new Component(extra)));
                }
            }
            text.extra = new TagList(extraParsed);
        }
        return new TagCompound(text);
    }
}

export class TextComponentConverter {
    static withField(text: TagCompound, component: Component, field: string, deserializer: (input: Tag<any>) => any): Component {
        if (text.data[field]) {
            component.setProperty(field, deserializer(text.data[field]));
        }
        return component;
    }

    toComponent(text: TagCompound): Component {
        let component = Component.empty();
        component = TextComponentConverter.withField(text, component, "text", (input: TagString) => input.data);
        component = TextComponentConverter.withField(text, component, "color", (input: TagString) => input.data);
        component = TextComponentConverter.withField(text, component, "bold", (input: TagByte) => input.data == 1);
        component = TextComponentConverter.withField(text, component, "italic", (input: TagByte) => input.data == 1);
        component = TextComponentConverter.withField(text, component, "strikethrough", (input: TagByte) => input.data == 1);
        component = TextComponentConverter.withField(text, component, "underlined", (input: TagByte) => input.data == 1);
        component = TextComponentConverter.withField(text, component, "obfuscated", (input: TagByte) => input.data == 1);
        component = TextComponentConverter.withField(text, component, "extra", (input: TagList) => input.data.map(element => this.toComponent(validateText(element))));
        return component;
    }
}

export class ComponentStringConverter {
    static appendIfExists(output: string, component: Component, field: string, inside: (data: any) => string): string {
        if (component.getProperty(field)) {
            output += inside(component.getProperty(field));
        }
        return output;
    }

    toString(component: Component, discardDefaultText: boolean = false): string {
        let output = "";
        let doStyles = !(
            discardDefaultText &&
            component.getProperty("color") == "white" &&
            component.getProperty("italic") == false &&
            component.getProperty("bold") == false &&
            component.getProperty("strikethrough") == false &&
            component.getProperty("underlined") == false &&
            component.getProperty("obfuscated") == false &&
            component.getProperty("text") == ""
        );
        if (doStyles) {
            output = ComponentStringConverter.appendIfExists(output, component, "color", (data: string) => "<" + data.toLowerCase() + ">");
            output = ComponentStringConverter.appendIfExists(output, component, "italic", (data: boolean) => data ? "<i>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "bold", (data: boolean) => data ? "<b>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "strikethrough", (data: boolean) => data ? "<strikethrough>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "underlined", (data: boolean) => data ? "<u>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "obfuscated", (data: boolean) => data ? "<obf>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "text", (data: string) => data);
        }
        output = ComponentStringConverter.appendIfExists(output, component, "extra", (data: (Component | string)[]) => {
            let t = "";
            for (let extra of data) {
                if (typeof extra == "string") {
                    t += extra;
                } else {
                    t += this.toString(extra);
                }
            }
            return t;
        });
        if (doStyles) {
            output = ComponentStringConverter.appendIfExists(output, component, "obfuscated", (data: boolean) => data ? "</obf>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "underlined", (data: boolean) => data ? "</u>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "strikethrough", (data: boolean) => data ? "</strikethrough>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "bold", (data: boolean) => data ? "</b>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "italic", (data: boolean) => data ? "</i>" : "");
            output = ComponentStringConverter.appendIfExists(output, component, "color", (data: string) => "</" + data + ">");
        }
        return output;
    }
}