<script module lang="ts">
    import { ALL_SELECTION_TARGETS, PLAYER_SELECTION_TARGETS, ENTITY_SELECTION_TARGETS } from "$lib/diamondfire";
    export const ALL_SELECTION_TARGET_DROPDOWN = ALL_SELECTION_TARGETS.map(s => { return { text: s, name: s } });
    export const PLAYER_SELECTION_TARGET_DROPDOWN = PLAYER_SELECTION_TARGETS.map(s => { return { text: s, name: s } });
    export const ENTITY_SELECTION_TARGET_DROPDOWN = ENTITY_SELECTION_TARGETS.map(s => { return { text: s, name: s } });
</script>

<script lang="ts">
    import {
        BlockTagItem,
        Item,
        StringItem,
        NumberItem,
        TextItem,
        VariableItem,
        GameValueItem,
        SoundItem,
        ParticleItem,
        VectorItem,
        LocationItem,
        MinecraftItem,
        PotionItem,
        ParameterItem,
        TYPE_TYPES, BucketVarItem
    } from "$lib/diamondfire";
    import { fetchTranslations, translations } from "$lib/minimessage";
    import {SELECTION_TARGETS_COLOR_MAP, TYPE_DISPLAY_COLORS_MAP, TYPE_DISPLAY_MAP} from "$lib/df_reprs";
    import convert from "color-convert";
    import { getMCItemRenderURI } from "$lib/utils";
    import {SNBTParser, SNBTWriter, TagCompound, TagString, TagList, TagByte} from "$lib/nbt";
    import {
        ComponentStringConverter,
        ComponentTextConverter,
        TextHTMLConverter,
        TextComponentConverter,
        validateText, getColorHex
    } from "$lib/minecraft_text";
    import { type InspectorObject } from "$lib/components/editor/Inspector.svelte";
    import { miniMessage } from "$lib/minimessage"
    import {getContext, onMount} from "svelte";
    import {ComponentHTMLConverter, escapeHtml} from "$lib/minecraft_text.ts";

    onMount(fetchTranslations);
    let actiondump = getContext("actiondump").actiondump;
    let actions = actiondump.actions;

    let {
        item,
        set: setParent,
        setTooltip: setTooltipParent,
        setInspectorObjects,
        clearItem
    }: {
        item: Item,
        set: (item: Item) => void;
        setTooltip: (data: string, spanColor: string | null, direct?: boolean) => void,
        setInspectorObjects: (inspectorObjects: InspectorObject[][], cond: boolean) => void,
        clearItem: () => void
    } = $props();

    let blTag = $derived.by(() => {
        if (item instanceof BlockTagItem) {
            let blockTags = actions[item.block][item.action]?.block_tags ?? [] as {}[];
            return blockTags.find(i => i.name == item.tag);
        } else {
            return null;
        }
    });

    function set(item: Item) {
        setParent(item);
        if (tooltipShowing) {
            renderTooltip();
        }
    }

    let tooltipShowing = $state(false);

    function setTooltip(data: string, spanColor: string | null, direct?: boolean) {
        if (tooltipShowing) {
            setTooltipParent(data, spanColor, direct);
        }
    }

    function attrtxt(label: string, data: any, dataCol: string = "white", prepend: boolean = true): string {
        return (prepend ? "<br>" : "") + `<gray>${label}: </gray><${dataCol}>${escapeHtml(data.toString())}</${dataCol}>`
    }

    function renderTooltip(doTooltip = true) {
        if (doTooltip) tooltipShowing = true;
        if (item instanceof StringItem) {
            setTooltip(escapeHtml(item.name), "#ffffff", true);
            setInspectorObjects([
                [
                    {
                        label: 'String data',
                        id: 'string_data',
                        type: 'StringField',
                        set: data => {
                            item.name = data;
                            set(item);
                        },
                        get: () => item.name
                    }
                ]
            ]);
        } else if (item instanceof NumberItem) {
            setTooltip(escapeHtml(item.name), getColorHex("red"), true);
            setInspectorObjects([
                [
                    {
                        label: "Number data",
                        id: "number_data",
                        type: "StringField",
                        set: (data) => {
                            item.name = data;
                            set(item);
                        },
                        get: () => item.name,
                    },
                ],
            ]);
        } else if (item instanceof TextItem) {
            setTooltip(new ComponentHTMLConverter().toSpan(miniMessage.deserialize(item.name)), "#ffffff", true);
            setInspectorObjects([
                [
                    {
                        label: "Text data",
                        id: "text_data",
                        type: "MiniMessageField",
                        set: (data) => {
                            item.name = data;
                            set(item);
                        },
                        get: () => item.name,
                    },
                ],
            ]);
        } else if (item instanceof VariableItem) {
            let colors = {unsaved: "#aaaaaa", saved: "#ffff55", local: "#55ff55", line: "#55aaff"};
            let color = colors[item.scope];
            let displayScopes = {unsaved: "GAME", saved: "SAVED", local: "LOCAL", line: "LINE"};
            let displayScope = displayScopes[item.scope];
            let scopes = ["unsaved", "saved", "local", "line"];
            setTooltip(`<white>${escapeHtml(item.name)}</white><br><${color}>${displayScope}</${color}>`);
            setInspectorObjects([
                [
                    {
                        label: "Scope",
                        id: "scope",
                        type: "DropDown",
                        options: scopes.map((k) => {
                            return { text: displayScopes[k], name: k };
                        }),
                        set: (scope) => {
                            item.scope = scope;
                            set(item);
                        },
                        get: () => item.scope,
                    },
                    {
                        label: "Variable name",
                        id: "variable_name",
                        type: "StringField",
                        set: (data) => {
                            item.name = data;
                            set(item);
                        },
                        get: () => item.name,
                    },
                ],
            ]);
        } else if (item instanceof GameValueItem) {
            let category = actiondump.gv_category_reverse_map[item.type]
            let haveSelection = !["Event Values", "Plot Values"].includes(category);
            let color = TYPE_DISPLAY_COLORS_MAP[actiondump.gvs[category][item.type].returns.type];
            if (haveSelection) {
                setTooltip(`<${color}>${escapeHtml(item.type)}</${color}>${attrtxt("Target", item.target, SELECTION_TARGETS_COLOR_MAP[item.target])}`);
            } else {
                setTooltip(`<${color}>${escapeHtml(item.type)}</${color}><br><gray>(No target)</gray>`);
            }
            let allGV = [];
            for (let category of Object.values(actiondump.gvs)) {
                allGV.push(...Object.keys(category).map(gv => {
                    return {
                        text: gv,
                        name: gv
                    }
                }));
            }
            let line = [{
                label: "Game value",
                id: "game_value",
                type: "DropDown",
                options: allGV,
                set: (data) => {
                    item.type = data;
                    set(item);
                    renderTooltip(false);
                },
                get: () => item.type,
            }];
            if (haveSelection) {
                line.push({
                    label: "Selection",
                    id: "selection",
                    type: "DropDown",
                    options: ALL_SELECTION_TARGET_DROPDOWN,
                    set: (selection) => {
                        item.target = selection;
                        set(item);
                    },
                    get: () => item.target,
                });
            }
            setInspectorObjects([line]);
        } else if (item instanceof SoundItem) {
            let variantText = item.variant ? attrtxt("Variant", item.variant) : ""
            setTooltip(`<white>${escapeHtml(item.sound)}</white>${escapeHtml(variantText)}${attrtxt("Pitch", item.pitch)}${attrtxt("Volume", item.volume)}`);
            let allSounds = Object.keys(actiondump.sounds).map(sound => {
                return {
                    text: sound,
                    name: sound
                }
            });
            let variants = actiondump.sounds[item.sound].variants.map(variant => {
                return {
                    text: variant,
                    name: variant
                }
            }) || [{
                text: "",
                name: null
            }];
            setInspectorObjects([
                [
                    {
                        label: "Sound",
                        id: "sound",
                        type: "DropDown",
                        options: allSounds,
                        set: (snd) => {
                            item.sound = snd;
                            set(item);
                        },
                        get: () => item.sound,
                    },
                    {
                        label: "Variant",
                        id: "variant",
                        type: "DropDown",
                        options: variants,
                        set: (variant) => {
                            item.variant = variant;
                            set(item);
                        },
                        get: () => item.variant,
                    },
                ],
                [
                    {
                        label: "Pitch",
                        id: "pitch",
                        type: "NumberField",
                        set: (pitch) => {
                            item.pitch = pitch;
                            set(item);
                        },
                        get: () => item.pitch,
                    },
                    {
                        label: "Volume",
                        id: "volume",
                        type: "NumberField",
                        set: (volume) => {
                            item.volume = volume;
                            set(item);
                        },
                        get: () => item.volume,
                    },
                ],
            ]);
        } else if (item instanceof ParticleItem) {
            let allowedAttributes: string[] = actiondump.particles[actiondump.particle_category_reverse_map[item.particle]][item.particle].fields;

            let attrText = attrtxt("Amount", item.amount) + attrtxt("Spread", (item.spread[0].toString()) + " " + (item.spread[1].toString()));
            if (allowedAttributes) {
                attrText += "<br>";
            }

            let attributeOptions = [];

            for (let attr of allowedAttributes) {
                if (attr == "Color") {
                    let col = convert.rgb.hex(item.color) ?? "ff0000";
                    attrText += attrtxt("Color", "#" + col.toUpperCase(), "#" + col);
                    attributeOptions.push([{
                        label: "Color",
                        id: "color",
                        type: "ColorField",
                        set: (data) => {
                            item.color = convert.hex.rgb(data);
                            set(item);
                        },
                        get: () => {
                            return item.color ? convert.rgb.hex(item.color) : "ff0000";
                        },
                    }]);
                } else if (attr == "Fade Color") {
                    let col = convert.rgb.hex(item.fadeColor) ?? "0000ff";
                    attrText += attrtxt("Fade Color", "#" + col.toUpperCase(), "#" + col);
                    attributeOptions.push([{
                        label: "Fade Color",
                        id: "fade_color",
                        type: "ColorField",
                        set: (data) => {
                            item.fadeColor = convert.hex.rgb(data);
                            set(item);
                        },
                        get: () => item.fadeColor ? convert.rgb.hex(item.fadeColor) : "0000ff",
                    }]);
                } else if (attr == "Color Variation") {
                    attrText += attrtxt("Color Variation", (item.variations.color ?? 0).toString() + "%");
                    attributeOptions.push([{
                        label: "Color Variation",
                        id: "color_variation",
                        type: "PercentageField",
                        set: (data) => {
                            item.variations.color = data * 100;
                            set(item);
                        },
                        get: () => item.variations.color / 100,
                    }]);
                } else if (attr == "Motion") {
                    let motion = item.motion ? [item.motion[0] ?? 0, item.motion[1] ?? 0, item.motion[2] ?? 0] : [0, 0, 0];
                    attrText += attrtxt("Motion", motion[0].toString() + ", " + motion[1].toString() + ", " + motion[2].toString(), TYPE_DISPLAY_COLORS_MAP.vec);
                    attributeOptions.push([
                        {
                            label: "Motion X",
                            id: "motion_x",
                            type: "NumberField",
                            set: (data) => {
                                item.motion = [
                                    data,
                                    item.motion ? item.motion[1] : 0,
                                    item.motion ? item.motion[2] : 0,
                                ];
                                set(item);
                            },
                            get: () => (item.motion ? item.motion[0] : null),
                        },
                        {
                            label: "Motion Y",
                            id: "motion_y",
                            type: "NumberField",
                            set: (data) => {
                                item.motion = [
                                    item.motion ? item.motion[0] : 0,
                                    data,
                                    item.motion ? item.motion[2] : 0,
                                ];
                                set(item);
                            },
                            get: () => (item.motion ? item.motion[1] : null),
                        },
                        {
                            label: "Motion Z",
                            id: "motion_z",
                            type: "NumberField",
                            set: (data) => {
                                item.motion = [
                                    item.motion ? item.motion[0] : 0,
                                    item.motion ? item.motion[1] : 0,
                                    data,
                                ];
                                set(item);
                            },
                            get: () => (item.motion ? item.motion[2] : null),
                        }
                    ]);
                } else if (attr == "Motion Variation") {
                    attrText += attrtxt("Motion Variation", (item.variations.motion ?? 0).toString() + "%");
                    attributeOptions.push([{
                        label: "Motion Variation",
                        id: "motion_variation",
                        type: "PercentageField",
                        set: (data) => {
                            item.variations.motion = data * 100;
                            set(item);
                        },
                        get: () => item.variations.motion / 100,
                    }]);
                } else if (attr == "Size") {
                    attrText += attrtxt("Size", item.size ?? 1);
                    attributeOptions.push([{
                        label: "Size",
                        id: "size",
                        type: "NumberField",
                        set: (data) => {
                            item.size = data;
                            set(item);
                        },
                        get: () => item.size,
                    }]);
                } else if (attr == "Size Variation") {
                    attrText += attrtxt("Size Variation", (item.variations.size ?? 0).toString() + "%");
                    attributeOptions.push([{
                        label: "Size Variation",
                        id: "size_variation",
                        type: "PercentageField",
                        set: (data) => {
                            item.variations.size = data * 100;
                            set(item);
                        },
                        get: () => item.variations.size / 100,
                    }]);
                } else if (attr == "Material") {
                    attrText += attrtxt("Material", (item.material ?? "stone").toLowerCase());
                    attributeOptions.push([{
                        label: "Material",
                        id: "material",
                        type: "StringField",
                        set: (data) => {
                            item.material = data.toUpperCase();
                            set(item);
                        },
                        get: () => (item.material ? item.material.toLowerCase() : null),
                    }]);
                } else if (attr == "Duration") {
                    attrText += attrtxt("Duration", item.duration ?? 0);
                    attributeOptions.push([{
                        label: "Duration",
                        id: "duration",
                        type: "NumberField",
                        set: (data) => {
                            item.duration = data;
                            set(item);
                        },
                        get: () => item.duration,
                    }]);
                } else if (attr == "Opacity") {
                    attrText += attrtxt("Opacity", (item.opacity ?? 0).toString() + "%");
                    attributeOptions.push([{
                        label: "Opacity",
                        id: "opacity",
                        type: "PercentageField",
                        set: (data) => {
                            item.opacity = data * 100;
                            set(item);
                        },
                        get: () => item.opacity / 100,
                    }]);
                } else if (attr == "Roll") {
                    attrText += attrtxt("Roll", item.roll ?? 0);
                    attributeOptions.push([{
                        label: "Roll",
                        id: "roll",
                        type: "NumberField",
                        set: (data) => {
                            item.roll = data;
                            set(item);
                        },
                        get: () => item.roll,
                    }]);
                }
            }

            let allParticles = [];
            for (let category of Object.values(actiondump.particles)) {
                for (let particle of Object.keys(category)) {
                    allParticles.push({
                        text: particle,
                        name: particle
                    });
                }
            }

            setTooltip(`<white>${escapeHtml(item.particle)}</white>${attrText}`);
            setInspectorObjects([
                [
                    {
                        label: "Particle",
                        id: "particle",
                        type: "DropDown",
                        options: allParticles,
                        set: (data) => {
                            let allowedAttributes: string[] = actiondump.particles[actiondump.particle_category_reverse_map[data]][data].fields;
                            for (let attr of allowedAttributes) {
                                if (attr == "Color") {
                                    item.color = convert.hex.rgb("ff0000");
                                } else if (attr == "Fade Color") {
                                    item.fadeColor = convert.hex.rgb("0000ff");
                                } else if (attr == "Color Variation") {
                                    item.variations.color = 0;
                                } else if (attr == "Motion") {
                                    item.motion = [0, 0, 0];
                                } else if (attr == "Motion Variation") {
                                    item.variations.motions = 0;
                                } else if (attr == "Size") {
                                    item.size = 1;
                                } else if (attr == "Size Variation") {
                                    item.variations.size = 0;
                                } else if (attr == "Material") {
                                    item.material = "STONE";
                                } else if (attr == "Duration") {
                                    item.duration = 0;
                                } else if (attr == "Opacity") {
                                    item.opacity = 0;
                                } else if (attr == "Roll") {
                                    item.roll = 0;
                                }
                            }

                            item.particle = data;
                            set(item);
                            renderTooltip(false);
                        },
                        get: () => item.particle,
                    },
                    {
                        label: "Amount",
                        id: "amount",
                        type: "NumberField",
                        set: (data) => {
                            item.amount = data;
                            set(item);
                        },
                        get: () => item.amount,
                    },
                ],
                [
                    {
                        label: "Spread XZ",
                        id: "spread_xz",
                        type: "NumberField",
                        set: (data) => {
                            item.spread = [data, item.spread[1]];
                            set(item);
                        },
                        get: () => item.spread[0],
                    },
                    {
                        label: "Spread Y",
                        id: "spread_y",
                        type: "NumberField",
                        set: (data) => {
                            item.spread = [item.spread[0], data];
                            set(item);
                        },
                        get: () => item.spread[1],
                    },
                ]
            ].concat(attributeOptions));
        } else if (item instanceof VectorItem) {
            setTooltip("<" + TYPE_DISPLAY_COLORS_MAP.vec + ">Vector<reset><br>" + attrtxt("X", item.x, "white", false) + attrtxt("Y", item.y) + attrtxt("Z", item.z));
            setInspectorObjects([
                [
                    {
                        label: "X",
                        id: "vec_x",
                        type: "NumberField",
                        set: (x) => {
                            item.x = x;
                            set(item);
                        },
                        get: () => item.x,
                    },
                    {
                        label: "Y",
                        id: "vec_y",
                        type: "NumberField",
                        set: (y) => {
                            item.y = y;
                            set(item);
                        },
                        get: () => item.y,
                    },
                    {
                        label: "Z",
                        id: "vec_z",
                        type: "NumberField",
                        set: (z) => {
                            item.z = z;
                            set(item);
                        },
                        get: () => item.z,
                    },
                ],
            ]);
        } else if (item instanceof LocationItem) {
            setTooltip("<green>Location</green><br>" + attrtxt("X", item.x, "white", false) + attrtxt("Y", item.y) + attrtxt("Z", item.z) + attrtxt("p", item.pitch) + attrtxt("y", item.yaw));
            setInspectorObjects([
                [
                    {
                        label: "X",
                        id: "loc_x",
                        type: "NumberField",
                        set: (x) => {
                            item.x = x;
                            set(item);
                        },
                        get: () => item.x,
                    },
                    {
                        label: "Y",
                        id: "loc_y",
                        type: "NumberField",
                        set: (y) => {
                            item.y = y;
                            set(item);
                        },
                        get: () => item.y,
                    },
                    {
                        label: "Z",
                        id: "loc_z",
                        type: "NumberField",
                        set: (z) => {
                            item.z = z;
                            set(item);
                        },
                        get: () => item.z,
                    },
                ],
                [
                    {
                        label: "Pitch",
                        id: "loc_pitch",
                        type: "NumberField",
                        set: (pitch) => {
                            item.pitch = pitch;
                            set(item);
                        },
                        get: () => item.pitch,
                    },
                    {
                        label: "Yaw",
                        id: "loc_yaw",
                        type: "NumberField",
                        set: (yaw) => {
                            item.yaw = yaw;
                            set(item);
                        },
                        get: () => item.yaw,
                    },
                ],
            ]);
        } else if (item instanceof PotionItem) {
            setTooltip("<white>" + escapeHtml(item.effect) + attrtxt("Amplifier", item.amplifier) + attrtxt("Duration", item.duration));
            let allPotions = Object.keys(actiondump.potions).map(potion => {
                return {
                    text: potion,
                    name: potion
                }
            });
            setInspectorObjects([
                [
                    {
                        label: "Potion effect",
                        id: "effect",
                        type: "DropDown",
                        options: allPotions,
                        set: (effect) => {
                            item.effect = effect;
                            set(item);
                        },
                        get: () => item.effect,
                    },
                    {
                        label: "Amplifier",
                        id: "amplifier",
                        type: "NumberField",
                        set: (amp) => {
                            item.amplifier = amp;
                            set(item);
                        },
                        get: () => item.amplifier,
                    },
                    {
                        label: "Duration",
                        id: "duration",
                        type: "NumberField",
                        set: (dur) => {
                            item.duration = dur;
                            set(item);
                        },
                        get: () => item.duration,
                    },
                ],
            ]);
        } else if (item instanceof BlockTagItem) {
            setTooltip(`<yellow>${escapeHtml(item.tag)}</yellow><br><white>${escapeHtml(item.option)}</white>`);
            let allBlockTags = actions[item.block][item.action].block_tags as {}[]

            let possibleOptions = Object.keys(blTag.options).map(option => {
                return {
                    text: option,
                    name: option
                }
            });
            let allTags = allBlockTags.map(tag => {
                return {
                    text: tag.name,
                    name: tag.name
                }
            });
            setInspectorObjects([
                [
                    {
                        label: "Tag",
                        id: "bl_tag",
                        type: "DropDown",
                        options: allTags,
                        set: (tag) => {
                            item.tag = tag;
                            let bt = allBlockTags.find(i => i.name == tag)
                            item.option = bt.default;
                            blTag = bt;
                            renderTooltip(false);
                            updateTexture();
                            set(item);
                        },
                        get: () => item.tag,
                    },
                    {
                        label: "Option",
                        id: "bl_option",
                        type: "DropDown",
                        options: possibleOptions,
                        set: (option) => {
                            item.option = option;
                            updateTexture();
                            set(item);
                        },
                        get: () => item.option,
                    },
                ],
            ]);
        } else if (item instanceof MinecraftItem) {
            let converter = new TextHTMLConverter();
            let dataRaw = new SNBTParser(item.snbt).parse();
            let data = dataRaw.data;
            let name = translations ? translations["item.minecraft." + itemID] ?? translations["block.minecraft." + itemID] : itemID.toUpperCase();
            let keys = "components" in data ? Object.keys(data.components.data) : [];

            if (keys.includes("minecraft:custom_name")) {
                name = converter.toSpan(validateText(data.components.data["minecraft:custom_name"]));
            }
            let lore: string[] = [];
            if (keys.includes("minecraft:lore")) {
                for (let loreLine of data.components.data["minecraft:lore"].data) {
                    lore.push(converter.toSpan(validateText(loreLine)));
                }
            }

            if (data.count.data != 1) {
                name += ` (x${data.count.data})`;
            }

            setTooltip(name + (lore.length == 0 ? "" : ("<br>" + lore.join("<br>"))), null, true);
            setInspectorObjects([
                [
                    {
                        label: 'Item ID',
                        id: 'item_id',
                        type: 'StringField',
                        set: newId => {
                            let parsed = new SNBTParser(item.snbt).parse();
                            parsed.data.id = new TagString(newId);
                            item = new MinecraftItem(new SNBTWriter().write(parsed));
                            set(item);
                        },
                        get: () => new SNBTParser(item.snbt).parse().data.id.data
                    },
                    {
                        label: 'Amount',
                        id: 'amount',
                        type: 'NumberField',
                        set: amount => {
                            let parsed = new SNBTParser(item.snbt).parse();
                            parsed.data.count = new TagByte(amount);
                            item = new MinecraftItem(new SNBTWriter().write(parsed));
                            set(item);
                        },
                        get: () => new SNBTParser(item.snbt).parse().data.count.data
                    }
                ],
                [
                    {
                        label: 'Name',
                        id: 'item_name',
                        type: 'MiniMessageField',
                        set: name => {
                            let parsed = new SNBTParser(item.snbt).parse();
                            if (!("components" in parsed.data)) {
                                parsed.data.components = new TagCompound({});
                            }
                            let components = parsed.data.components;
                            components.data["minecraft:custom_name"] = ComponentTextConverter.resetStyles(
                                new ComponentTextConverter().toText(
                                    miniMessage.deserialize(name)
                                )
                            );
                            if (!name) {
                                delete components.data["minecraft:custom_name"];
                            }
                            item = new MinecraftItem(new SNBTWriter().write(parsed));
                            item.previousName = name;
                            set(item);
                        },
                        get: () => {
                            if (item.previousName) return item.previousName;
                            let data = new SNBTParser(item.snbt).parse().data
                            if ("components" in data) {
                                if ("minecraft:custom_name" in data.components.data) {
                                    item.previousName = new ComponentStringConverter().toString(
                                        new TextComponentConverter().toComponent(
                                            validateText(data.components.data["minecraft:custom_name"])
                                        ),
                                        true
                                    );
                                    return item.previousName;
                                }
                            }
                            return null;
                        }
                    }
                ],
                [
                    {
                        label: 'Lore',
                        id: 'lore',
                        type: 'MiniMessageField',
                        multiline: true,
                        set: (data: string) => {
                            let parsed = new SNBTParser(item.snbt).parse();
                            if (!("components" in parsed.data)) {
                                parsed.data.components = new TagCompound({});
                            }
                            let components = parsed.data.components;
                            components.data["minecraft:lore"] = new TagList(data.split("\n").map(
                                element => ComponentTextConverter.resetStyles(
                                    new ComponentTextConverter().toText(
                                        miniMessage.deserialize(element)
                                    )
                                )
                            ));
                            if (!data) {
                                delete components.data["minecraft:lore"];
                            }
                            item = new MinecraftItem(new SNBTWriter().write(parsed));
                            item.previousLore = data;
                            set(item);
                        },
                        get: () => {
                            if (item.previousLore) return item.previousLore;
                            let data = new SNBTParser(item.snbt).parse().data
                            if ("components" in data) {
                                if ("minecraft:lore" in data.components.data) {
                                    let lore: any[] = data.components.data["minecraft:lore"].data;
                                    item.previousLore = lore.map(
                                        element => new ComponentStringConverter().toString(
                                            new TextComponentConverter().toComponent(
                                                validateText(element)
                                            ),
                                            true
                                        )
                                    ).join("\n");
                                    return item.previousLore;
                                }
                            }
                            return null;
                        }
                    }
                ]
            ]);
        } else if (item instanceof ParameterItem) {
            let lines = [
                `<${TYPE_DISPLAY_COLORS_MAP.pn_el}>${escapeHtml(item.name)}`,
                `<${TYPE_DISPLAY_COLORS_MAP[item.type]}>${TYPE_DISPLAY_MAP[item.type]}${item.plural ? "(s)" : ""}${item.optional ? "<white>*" : ""} <dark_gray>- <gray>${escapeHtml(item.description ?? item.name)}`
            ]
            if (item.note) {
                lines.push("<blue>⏵ <gray>" + item.note);
            }
            if (doTooltip) {
                setTooltip(lines.join("<reset><br>"));
            }
            let iO: InspectorObject[][] = [
                [
                    {
                        label: "Name",
                        id: "pn_name",
                        type: "StringField",
                        set: (data) => {
                            item.name = data;
                            set(item);
                        },
                        get: () => item.name,
                    },
                ],
                [
                    {
                        label: "Type",
                        id: "type",
                        type: "DropDown",
                        options: TYPE_TYPES.map((type) => {
                            return {
                                text: TYPE_DISPLAY_MAP[type],
                                name: type,
                            };
                        }),
                        set: (type) => {
                            item.type = type;
                            set(item);
                        },
                        get: () => item.type,
                    },
                    {
                        label: "Plural",
                        id: "plural",
                        type: "BooleanField",
                        set: (checked) => {
                            item.plural = checked;
                            set(item);
                        },
                        get: () => {
                            return item.plural;
                        },
                    },
                    {
                        label: "Optional",
                        id: "optional",
                        type: "BooleanField",
                        set: (checked) => {
                            item.optional = checked;
                            set(item);
                            renderTooltip(false);
                        },
                        get: () => item.optional,
                    },
                ],
                [
                    {
                        label: "Display Name",
                        id: "display_name",
                        type: "StringField",
                        set: (name) => {
                            item.description = name;
                            set(item);
                        },
                        get: () => item.description,
                    },
                ],
                [
                    {
                        label: "Notes",
                        id: "notes",
                        type: "MiniMessageField",
                        multiline: true,
                        set: (notes) => {
                            item.note = notes;
                            set(item);
                        },
                        get: () => item.note,
                    },
                ],
            ];
            if (item.optional) {
                iO.splice(2, 0, [
                    {
                        label: 'Default Value',
                        id: 'default',
                        type: 'ItemField',
                        set: i => {
                            item.defaultValue = i;
                            set(item);
                        },
                        get: () => {
                            return item.defaultValue;
                        }
                    }
                ]);
            }
            setInspectorObjects(iO);
        } else if (item instanceof BucketVarItem) {
            let nsAlias = `<${TYPE_DISPLAY_COLORS_MAP.bucket_var}>Default</${TYPE_DISPLAY_COLORS_MAP.bucket_var}>`;
            if (item.namespaceAlias != "") {
                nsAlias = `<aqua>"${escapeHtml(item.namespaceAlias)}"</aqua>`;
            }

            setTooltip(`${escapeHtml(item.name)}<br><gray>Key: </gray><aqua>"${escapeHtml(item.key)}"</aqua><br><gray>Namespace Alias: </gray>${nsAlias}`, TYPE_DISPLAY_COLORS_MAP.bucket_var);
            setInspectorObjects([
                [
                    {
                        label: "Bucket variable name",
                        id: "variable_name",
                        type: "StringField",
                        set: (data) => {
                            item.name = data;
                            set(item);
                        },
                        get: () => item.name,
                    }
                ],
                [
                    {
                        label: "Bucket variable key",
                        id: "variable_key",
                        type: "StringField",
                        set: (data) => {
                            item.key = data;
                            set(item);
                        },
                        get: () => item.key
                    }
                ],
                [
                    {
                        label: "Bucket variable namespace alias",
                        id: "variable_namespace",
                        placeholder: "Default",
                        type: "StringField",
                        set: (data) => {
                            item.namespaceAlias = data;
                            set(item);
                        },
                        get: () => item.namespaceAlias
                    }
                ]
            ]);
        } else {
            setTooltip(escapeHtml(JSON.stringify(item.toJSON(), null, 4)));
        }
    }

    let itemID = $derived(
        item instanceof MinecraftItem ?
            new SNBTParser(item.snbt).parse().data.id.data.replaceAll("minecraft:", "")
            : (
                item instanceof BlockTagItem ?
                blTag.options[item.option]?.material ?? null
                : null
            )
    );

    let textureSrc = $derived(
        (item instanceof MinecraftItem || item instanceof BlockTagItem) ?
            getMCItemRenderURI(itemID) ?? "/textures/placeholder.png" :
            ("/textures/" + item.id + ".png")
    );

    function updateTexture() {
        itemID = item instanceof MinecraftItem ?
            new SNBTParser(item.snbt).parse().data.id.data.replaceAll("minecraft:", "")
            : (
                item instanceof BlockTagItem ?
                    blTag.options[item.option]?.material ?? null
                    : null
            );
        textureSrc = (item instanceof MinecraftItem || item instanceof BlockTagItem) ?
            getMCItemRenderURI(itemID) ?? "/textures/placeholder.png" :
            ("/textures/" + item.id + ".png");
    }
</script>

<img
        src={textureSrc}
        alt={item.id}
        width="64"
        height="64"
        style="width: 75%; height: 75%"
        onpointerenter={renderTooltip}
        onpointerleave={() => {
            clearItem();
            tooltipShowing = false;
        }}
/>