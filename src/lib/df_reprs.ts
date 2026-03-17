import {
    BLOCK_CATEGORIES,
    CATEGORY_ATTRIBUTES,
    type Codeblock,
    TYPE_TYPES
} from "./diamondfire";
import { getColorHex } from "./minecraft_text";

export const CATEGORY_MAP = {
    event: 'PLAYER EVENT',
    player_action: 'PLAYER ACTION',
    entity_event: 'ENTITY EVENT',
    entity_action: 'ENTITY ACTION',
    set_var: 'SET VARIABLE',
    game_action: 'GAME ACTION',
    control: 'CONTROL',
    if_entity: 'IF ENTITY',
    if_game: 'IF GAME',
    if_player: 'IF PLAYER',
    if_var: 'IF VARIABLE',
    select_obj: 'SELECT OBJECT',
    repeat: 'REPEAT',
    else: 'ELSE',
    start_process: 'START PROCESS',
    call_func: 'CALL FUNCTION',
    func: 'FUNCTION',
    process: 'PROCESS',
    game_event: 'GAME EVENT'
};

export function firstLine(code: Codeblock): string {
    return CATEGORY_MAP[code.category as typeof BLOCK_CATEGORIES[number]];
}

export function secondLine(code: Codeblock): string {
    if (["func", "process", "start_process", "call_func"].includes(code.category)) {
        return code.data ?? "" as string;
    } else {
        return code.action;
    }
}

export function thirdLine(code: Codeblock): string | null {
    if (code.subAction != null) {
        return code.subAction as string;
    } else if (code.target != null) {
        return code.target as string;
    }
    return null;
}

export function fourthLine(code: Codeblock): string | null {
    return code.attribute ? CATEGORY_ATTRIBUTES.get(code.category)! : null;
}

export const TYPE_DISPLAY_MAP: { [key: typeof TYPE_TYPES[number] | 'g_val']: string } = {
    num: 'Number',
    txt: 'String',
    comp: 'Text',
    var: 'Variable',
    pn_el: 'Parameter',
    loc: 'Location',
    vec: 'Vector',
    pot: 'Potion',
    snd: 'Sound',
    g_val: 'Game Value',
    part: 'Particle',
    item: 'Item',
    bl_tag: 'Block Tag',
    hint: 'Hint',
    any: 'Any Value',
    list: 'List',
    dict: 'Dictionary',
    bucket_var: 'Bucket Variable'
} as const;

export const TYPE_DISPLAY_COLORS_MAP: { [key: typeof TYPE_TYPES[number] | 'g_val']: string } = {
    num: getColorHex('red'),
    txt: getColorHex('aqua'),
    comp: '#7fd42a',
    var: getColorHex('yellow'),
    pn_el: '#aaffaa',
    loc: getColorHex('green'),
    vec: '#2affaa',
    pot: '#ff557f',
    snd: '#54fb54',
    g_val: '#ffd47f',
    part: getColorHex('light_purple'),
    item: '#ffffff',
    bl_tag: getColorHex('gold'),
    any: '#ffd47f',
    list: getColorHex('dark_green'),
    dict: '#55AAff',
    bucket_var: '#D4AAFF'
} as const;

export const CATEGORY_COLOR_MAP = {
    event: '#6eeee5',
    player_action: '#838383',
    entity_event: '#f7d244',
    entity_action: '#717965',
    set_var: '#dddddd',
    game_action: '#632828',
    control: '#121212',
    if_entity: '#632828',
    if_game: '#490a0c',
    if_player: '#a58551',
    if_var: '#171023',
    select_obj: '#ab7faa',
    repeat: '#67a495',
    else: '#dce09f',
    start_process: '#758d79',
    call_func: '#737992',
    func: '#1f448d',
    process: '#37ce61',
    game_event: '#443f42'
} as const;

export const SELECTION_TARGETS_COLOR_MAP = {
    AllPlayers: getColorHex("aqua"),
    AllEntities: getColorHex("aqua"),
    AllMobs: getColorHex("aqua"),
    Victim: getColorHex("blue"),
    Shooter: getColorHex("yellow"),
    Damager: getColorHex("red"),
    Killer: getColorHex("dark_red"),
    Default: getColorHex("green"),
    Selection: getColorHex("green"),
    Projectile: getColorHex("blue"),
    LastEntity: getColorHex("gold")
}