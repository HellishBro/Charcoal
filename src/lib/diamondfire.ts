import * as polyfill from "./polyfill";
import { SNBTWriter, TagByte, TagCompound, TagString } from "./nbt";

type Json = Record<string, any>;

function pruneNull(obj: Json): Json {
    let result: Json = {};

    for (const [key, val] of Object.entries(obj)) {
        if (val != null || val != undefined) {
            result[key] = val;
        }
    }

    return result;
}

export class Template {
    blocks: Block[];

    constructor(blocks: Block[]) {
        this.blocks = blocks;
    }

    toJSON(): Json {
        return {
            blocks: this.blocks.map(block => block.toJSON())
        }
    }

    static fromJSON(json: Json): Template {
        return new Template(json.blocks.map((block: Json) => Block.fromJSON(block)));
    }

    static decodeTemplate(base64data: string): Template {
        return Template.fromJSON(JSON.parse(polyfill.fromGzipB64(base64data)));
    }

    encodeTemplate(): string {
        return polyfill.toGzipB64(JSON.stringify(this.toJSON()));
    }
}

export abstract class Block {
    abstract id: string;
    abstract toJSON(): Json;
    static fromJSON(json: Json): Block {
        if (json.id == 'bracket') {
            return Bracket.fromJSON_(json);
        } else if (json.id == 'block') {
            return Codeblock.fromJSON_(json);
        }
        throw new Error();
    }
    abstract isBracket(): boolean;
}

export class Bracket extends Block {
    id = 'bracket';
    direction: 'open' | 'close';
    type: 'norm' | 'repeat';

    constructor(direction: 'open' | 'close', type: 'norm' | 'repeat') {
        super();
        this.direction = direction;
        this.type = type;
    }

    override toJSON(): Json {
        return {
            id: 'bracket',
            direct: this.direction,
            type: this.type
        }
    }

    static fromJSON_(json: Json): Bracket {
        return new Bracket(json.direct, json.type);
    }

    isBracket(): boolean {
        return true;
    }
}

export const BLOCK_CATEGORIES = [
    'event',
    'player_action',
    'entity_event',
    'entity_action',
    'set_var',
    'game_action',
    'game_event',
    'control',
    'if_entity',
    'if_game',
    'if_player',
    'if_var',
    'select_obj',
    'repeat',
    'else',
    'start_process',
    'call_func',
    'func',
    'process'
] as const;
export const ALL_SELECTION_TARGETS = [
    'AllPlayers',
    'AllEntities',
    'AllMobs',
    'Victim',
    'Shooter',
    'Damager',
    'Killer',
    'Default',
    'Selection',
    'Projectile',
    'LastEntity'
] as const;
export const PLAYER_SELECTION_TARGETS = [
    'AllPlayers',
    'Victim',
    'Shooter',
    'Damager',
    'Killer',
    'Default',
    'Selection'
] as const;
export const ENTITY_SELECTION_TARGETS = [
    'AllEntities',
    'AllMobs',
    'Victim',
    'Shooter',
    'Damager',
    'Killer',
    'Default',
    'Selection',
    'Projectile',
    'LastEntity'
] as const;
export const CATEGORY_ATTRIBUTES: Map<string, string> = new Map<string, string>(Object.entries(
    {
        event: 'LS-CANCEL',
        entity_event: 'LS-CANCEL',
        game_event: 'LS-CANCEL',
        if_entity: 'NOT',
        if_game: 'NOT',
        if_player: 'NOT',
        if_var: 'NOT',
        select_obj: 'NOT',
        repeat: 'NOT'
    }
));
export const CATEGORY_BRACKETS_MAP = {
    if_entity: "norm",
    if_game: "norm",
    if_player: "norm",
    if_var: "norm",
    repeat: "repeat"
} as const;

export class Codeblock extends Block {
    id = 'block';
    category: typeof BLOCK_CATEGORIES[number];
    action: string;
    target: typeof ALL_SELECTION_TARGETS[number] | null;
    attribute: boolean;
    subAction: string | null;
    data: string | null;
    args: Argument[];

    constructor(category: typeof BLOCK_CATEGORIES[number],
                action: string,
                args: Argument[],
                target: typeof ALL_SELECTION_TARGETS[number] | null = null,
                attribute: boolean = false,
                subAction: string | null = null,
                data: string | null = null
    ) {
        super();
        this.category = category;
        this.action = action;
        this.target = target;
        this.attribute = attribute;
        this.args = args;
        this.subAction = subAction;
        this.data = data;
    }

    override toJSON(): Json {
        return pruneNull({
            id: 'block',
            block: this.category,
            action: this.action ?? null,
            target: this.target ?? null,
            attribute: this.attribute ? CATEGORY_ATTRIBUTES.get(this.category) : null,
            subAction: this.subAction,
            data: this.data,
            args: {
                items: this.args == undefined || false ? null : this.args.map(arg => arg.toJSON())
            }
        });
    }

    static fromJSON_(json: Json): Codeblock {
        return new Codeblock(
            json.block,
            json.action,
            json.args?.items?.map((item: Json) => Argument.fromJSON(item)),
            json.target,
            "attribute" in json && json.attribute != "",
            json.subAction,
            json.data
        );
    }

    isBracket(): boolean {
        return false;
    }
}

export let ELSE = new Codeblock("else", "", []);

export class Argument {
    item: Item;
    slot: number;

    constructor(item: Item, slot: number) {
        this.item = item;
        this.slot = slot;
    }

    toJSON(): Json {
        return {
            item: this.item.toJSON(),
            slot: this.slot
        }
    }

    static fromJSON(json: Json): Argument {
        return new Argument(Item.fromJSON(json.item), json.slot);
    }
}

export const ITEM_TYPES: string[] = [
    'txt',
    'comp',
    'num',
    'var',
    'bucket_var',
    'pn_el',
    'loc',
    'vec',
    'pot',
    'snd',
    'g_val',
    'part',
    'item',
    'bl_tag',
    'hint'
] as const;

export const TYPE_TYPES: string[] = [
    'txt',
    'comp',
    'num',
    'var',
    'loc',
    'vec',
    'pot',
    'snd',
    'part',
    'item',
    'any',
    'list',
    'dict',
] as const;

export const VALUE_TYPES: string[] = [
    'txt',
    'comp',
    'num',
    'var',
    'bucket_var',
    'loc',
    'vec',
    'pot',
    'snd',
    'part',
    'item'
] as const;

export function itemFromType(type: typeof ITEM_TYPES[number]): unknown | undefined {
    return {
        num: NumberItem,
        txt: StringItem,
        comp: TextItem,
        var: VariableItem,
        pn_el: ParameterItem,
        loc: LocationItem,
        vec: VectorItem,
        pot: PotionItem,
        snd: SoundItem,
        g_val: GameValueItem,
        part: ParticleItem,
        item: MinecraftItem,
        bl_tag: BlockTagItem,
        hint: HintItem,
        bucket_var: BucketVarItem
    }[type];
}

export function itemDefaultValue(type: typeof ITEM_TYPES[number]): Item | undefined {
    return {
        num: new NumberItem("0"),
        txt: new StringItem(""),
        comp: new TextItem(""),
        var: new VariableItem("", "unsaved"),
        pn_el: new ParameterItem("", "any"),
        loc: new LocationItem(0, 0, 0),
        vec: new VectorItem(0, 0, 0),
        pot: new PotionItem("Speed", 1000000, 1),
        snd: new SoundItem("Pling", 1, 2, ""),
        g_val: new GameValueItem("Player Count", "Default"),
        part: new ParticleItem("Cloud"),
        item: new MinecraftItem(new SNBTWriter().write(new TagCompound({
            id: new TagString("minecraft:stone"),
            count: new TagByte(1)
        }))),
        bl_tag: new BlockTagItem("", "", "", "event"),
        hint: new HintItem(""),
        bucket_var: new BucketVarItem("", "", "")
    }[type];
}

export abstract class Item {
    abstract id: string;
    _data: Json = {};

    abstract package(): void;

    toJSON(): Json {
        this.package();
        return {
            id: this.id,
            data: pruneNull(this._data)
        }
    }

    static fromJSON(json: Json): Item {
        let itemId: string = json.id;
        let clazz = itemFromType(itemId);
        if (clazz == undefined) {
            throw new Error();
        }
        return (clazz as typeof Item).fromJSON(json.data);
    }
}

export class NumberItem extends Item {
    id = 'num';
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    package() {
        this._data = {name: this.name};
    }

    static fromJSON(json: Json): NumberItem {
        return new NumberItem(json.name);
    }
}

export class StringItem extends Item {
    id = 'txt';
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    package() {
        this._data = {name: this.name};
    }

    static fromJSON(json: Json): StringItem {
        return new StringItem(json.name);
    }
}

export class TextItem extends Item {
    id = 'comp';
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    package() {
        this._data = {name: this.name};
    }

    static fromJSON(json: Json): TextItem {
        return new TextItem(json.name);
    }
}

export class VariableItem extends Item {
    id = 'var';
    name: string;
    scope: 'saved' | 'unsaved' | 'local' | 'line';

    constructor(name: string, scope: 'saved' | 'unsaved' | 'local' | 'line') {
        super();
        this.name = name;
        this.scope = scope;
    }

    package() {
        this._data = {name: this.name, scope: this.scope};
    }

    static fromJSON(json: Json): VariableItem {
        return new VariableItem(json.name, json.scope);
    }
}

export class ParameterItem extends Item {
    id = 'pn_el';
    name: string;
    type: typeof TYPE_TYPES[number];
    plural: boolean;
    optional: boolean;
    note: string | null;
    description: string | null;
    defaultValue: Item | null;

    constructor(name: string,
                type: typeof TYPE_TYPES[number],
                plural: boolean = false,
                optional: boolean = false,
                note: string | null = null,
                description: string | null = null,
                defaultValue: Item | null = null
    ) {
        super();
        this.name = name;
        this.type = type;
        this.plural = plural;
        this.optional = optional;
        this.note = note;
        this.description = description;
        this.defaultValue = defaultValue;
    }

    package() {
        this._data = {name: this.name, type: this.type, plural: this.plural, optional: this.optional, note: this.note, description: this.description, default_value: this.defaultValue};
    }

    static fromJSON(json: Json): ParameterItem {
        return new ParameterItem(
            json.name,
            json.type,
            json.plural,
            json.optional,
            json.note ?? null,
            json.description ?? null,
            json.defaultValue ?? null
        );
    }
}

export class LocationItem extends Item {
    id = 'loc';
    x: number;
    y: number;
    z: number;
    pitch: number;
    yaw: number;

    constructor(x: number, y: number, z: number, pitch: number = 0, yaw: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.pitch = pitch;
        this.yaw = yaw;
    }

    package() {
        this._data = {isBlock: false, loc: {x: this.x, y: this.y, z: this.z, pitch: this.pitch, yaw: this.yaw}};
    }

    static fromJSON(json: Json): LocationItem {
        return new LocationItem(json.loc.x ?? 0, json.loc.y ?? 0, json.loc.z ?? 0, json.loc.pitch ?? 0, json.loc.yaw ?? 0);
    }
}

export class VectorItem extends Item {
    id = 'vec';
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }

    package() {
        this._data = {x: this.x, y: this.y, z: this.z};
    }

    static fromJSON(json: Json): VectorItem {
        return new VectorItem(json.x ?? 0, json.y ?? 0, json.z ?? 0);
    }
}

export class PotionItem extends Item {
    id = 'pot';
    effect: string;
    duration: number;
    amplifier: number;

    constructor(effect: string, duration: number, amplifier: number) {
        super();
        this.effect = effect;
        this.duration = duration;
        this.amplifier = amplifier;
    }

    package() {
        this._data = {pot: this.effect, dur: this.duration, amp: this.amplifier};
    }

    static fromJSON(json: Json): PotionItem {
        return new PotionItem(json.pot, json.dur, json.amp);
    }
}

export class SoundItem extends Item {
    id = 'snd';
    sound: string;
    pitch: number;
    volume: number;
    variant: string | null;

    constructor(sound: string, pitch: number, volume: number, variant: string | null) {
        super();
        this.sound = sound;
        this.pitch = pitch;
        this.volume = volume;
        this.variant = variant;
    }

    package() {
        this._data = {sound: this.sound, pitch: this.pitch, vol: this.volume, variant: this.variant};
    }

    static fromJSON(json: Json): SoundItem {
        return new SoundItem(json.sound, json.pitch ?? 1, json.vol ?? 1, json.variant);
    }
}

export const GAMEVALUE_TARGETS = [
    'Selection',
    'Default',
    'Victim',
    'Killer',
    'Damager',
    'Shooter',
    'Projectile',
    'LastEntity'
] as const;

export class GameValueItem extends Item {
    id = 'g_val';
    type: string;
    target: typeof GAMEVALUE_TARGETS[number];

    constructor(type: string, target: typeof GAMEVALUE_TARGETS[number]) {
        super();
        this.type = type;
        this.target = target;
    }

    package() {
        this._data = {type: this.type, target: this.target};
    }

    static fromJSON(json: Json): GameValueItem {
        return new GameValueItem(json.type, json.target);
    }
}

export class ParticleItem extends Item {
    id = 'part';
    particle: string;
    amount: number;
    spread: [number, number];
    variations: { motion: number | null, color: number | null, size: number | null };
    motion: [number, number, number] | null;
    color: [number, number, number] | null;
    fadeColor: [number, number, number] | null;
    size: number | null;
    material: string | null;
    opacity: number | null;
    duration: number | null;
    roll: number | null;

    constructor(
        particle: string,
        amount: number = 1,
        spread: [number, number] = [0, 0],
        variations: { motion: number | null, color: number | null, size: number | null } = { motion: null, color: null, size: null },
        motion: [number, number, number] | null = null,
        color: [number, number, number] | null = null,
        fadeColor: [number, number, number] | null = null,
        size: number | null = null,
        material: string | null = null,
        opacity: number | null = null,
        duration: number | null = null,
        roll: number | null = null,
    ) {
        super();
        this.particle = particle;
        this.amount = amount;
        this.spread = spread;
        this.variations = variations;
        this.motion = motion;
        this.color = color;
        this.fadeColor = fadeColor;
        this.size = size;
        this.material = material;
        this.opacity = opacity;
        this.duration = duration;
        this.roll = roll;
    }

    package() {
        this._data = {
            particle: this.particle,
            cluster: {
                amount: this.amount,
                horizontal: this.spread[0],
                vertical: this.spread[1]
            },
            data: pruneNull({
                motionVariation: this.variations.motion,
                colorVariation: this.variations.color,
                sizeVariation: this.variations.size,
                x: (this.motion ?? [null, null, null])[0],
                y: (this.motion ?? [null, null, null])[1],
                z: (this.motion ?? [null, null, null])[2],
                rgb: this.color == null ? null : this.color[0] << 16 | this.color[1] << 8 | this.color[2],
                rgb_fade: this.fadeColor == null ? null : this.fadeColor[0] << 16 | this.fadeColor[1] << 8 | this.fadeColor[2],
                size: this.size,
                material: this.material,
                opacity: this.opacity,
                time: this.duration,
                roll: this.roll
            })
        };
    }

    static fromJSON(json: Json): ParticleItem {
        return new ParticleItem(
            json.particle,
            json.cluster.amount,
            [json.cluster.horizontal, json.cluster.vertical],
            {
                motion: json.data.motionVariation ?? null,
                color: json.data.colorVariation ?? null,
                size: json.data.sizeVariation ?? null,
            },
            'x' in json.data ? [
                json.data.x,
                json.data.y,
                json.data.z
            ] : null,
            'rgb' in json.data ? [
                json.data.rgb >> 16 & 0xff,
                json.data.rgb >> 8 & 0xff,
                json.data.rgb & 0xff,
            ] : null,
            'rgb_fade' in json.data ? [
                json.data.rgb_fade >> 16 & 0xff,
                json.data.rgb_fade >> 8 & 0xff,
                json.data.rgb_fade & 0xff,
            ] : null,
            json.data.size,
            json.data.material,
            json.data.opacity,
            json.data.time,
            json.data.roll
        );
    }
}

export class MinecraftItem extends Item {
    id = 'item';
    snbt: string;

    constructor(snbt: string) {
        super();
        this.snbt = snbt;
    }

    package() {
        this._data = {item: this.snbt};
    }

    static fromJSON(json: Json): MinecraftItem {
        return new MinecraftItem(json.item);
    }
}

export class BlockTagItem extends Item {
    id = 'bl_tag';
    option: string;
    tag: string;
    action: string;
    block: typeof BLOCK_CATEGORIES[number];
    variable: VariableItem | null;

    constructor(option: string, tag: string, action: string, block: typeof BLOCK_CATEGORIES[number], variable: VariableItem | null = null) {
        super();
        this.option = option;
        this.tag = tag;
        this.action = action;
        this.block = block
        this.variable = variable;
    }

    package() {
        this._data = {option: this.option, tag: this.tag, action: this.action, block: this.block, variable: this.variable};
    }

    toJSON(): Json {
        return {
            id: this.id,
            data: pruneNull({
                option: this.option,
                tag: this.tag,
                action: this.action,
                block: this.block,
                variable: this.variable == null ? null : this.variable.toJSON(),
            })
        };
    }

    static fromJSON(json: Json): BlockTagItem {
        return new BlockTagItem(json.option, json.tag, json.action, json.block, json.variable ?? null);
    }
}

export class HintItem extends Item {
    id = 'hint';
    hintId: string;

    constructor(id: string) {
        super();
        this.hintId = id;
    }

    package() {
        this._data = {id: this.hintId};
    }

    static fromJSON(json: Json): HintItem {
        return new HintItem(json.id);
    }
}

export class BucketVarItem extends Item {
    id = 'bucket_var';
    name: string;
    key: string;
    namespaceAlias: string;

    constructor(name: string, key: string, namespaceAlias: string) {
        super();
        this.name = name;
        this.key = key;
        this.namespaceAlias = namespaceAlias;
    }

    package() {
        this._data = {name: this.name, key: this.key, namespace_alias: this.namespaceAlias};
    }

    static fromJSON(json: Json): BucketVarItem {
        return new BucketVarItem(json.name, json.key, json.namespace_alias);
    }
}