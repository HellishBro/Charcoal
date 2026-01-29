<script lang="ts">
    import {
        Codeblock,
        Bracket,
        BLOCK_CATEGORIES,
        Template,
        CATEGORY_ATTRIBUTES,
        BlockTagItem,
        CATEGORY_BRACKETS_MAP, Argument
    } from "$lib/diamondfire";
    import { firstLine, secondLine, thirdLine, fourthLine, CATEGORY_MAP } from '$lib/df_reprs';
    import { setInspectorObjects } from "$lib/components/editor/Inspector.svelte";
    import { ENTITY_SELECTION_TARGET_DROPDOWN, PLAYER_SELECTION_TARGET_DROPDOWN } from "$lib/components/editor/Item.svelte";
    import {T, useThrelte} from "@threlte/core";
    import { useTexture, useGltf, Text } from "@threlte/extras";
    import { interactivity } from '@threlte/extras';
    import { NearestFilter } from "three";
    import convert from "color-convert";
    import type { Tween } from "svelte/motion";
    import type { Option } from "$lib/components/ContextMenu.svelte";
    import { setContextMenu } from "$lib/components/ContextMenu.svelte";
    import {getContext, onMount} from "svelte";
    import {downloadBlob} from "$lib/utils";

    let allActions = getContext("actiondump").actiondump.actions;
    let actionCategoryMap = getContext("actiondump").actiondump.actions_category_reverse_map;
    let aliasActionMap = getContext("actiondump").actiondump.alias_reverse_map;

    let {
        template = $bindable(),
        maxX = $bindable(),
        cameraX,
        cameraY,
        cameraZ,
        cameraZoom,
        clickChest,
        editBlockIndex = $bindable(),
        divElement,
        updateTemplateJSON
    }: {
        template: Template,
        maxX: number,
        cameraX: Tween<number>,
        cameraY: Tween<number>,
        cameraZ: Tween<number>,
        cameraZoom: Tween<number>,
        clickChest: (index: number) => void,
        editBlockIndex: number,
        divElement: HTMLDivElement,
        updateTemplateJSON: () => void
    } = $props();

    let {
        renderer
    } = useThrelte();

    function saveImage() {
        let canvas = renderer.domElement;
        canvas.toBlob(blob => {
            let name = "empty";
            if (template.blocks[0]) {
                name = firstLine(template.blocks[0]) + "_" + secondLine(template.blocks[0]);
            }
            downloadBlob(blob, name + ".png");
        });
    }

    onMount(() => {
        divElement.addEventListener("contextmenu", event => {
            event.preventDefault();
            setContextMenu(event, [
                {
                    label: "Insert at start",
                    tooltip: "Insert a code block at the start of the template.",
                    callback: () => insertPosition(0)
                },
                {
                    label: "Insert at end",
                    tooltip: "Insert a code block at the end of the template.",
                    callback: () => insertPosition(template.blocks.length)
                },
                {
                    label: "Save image",
                    tooltip: "Save the current render as an image.",
                    callback: saveImage
                },
                {
                    label: "<red>Delete all",
                    tooltip: "Delete everything.",
                    callback: () => {
                        template.blocks = [];
                        selection = [];
                        movingSelection = false;
                        updateTemplateJSON();
                        renderQueue = updateRenderQueue();
                    }
                }
            ]);
        })
    });

    interactivity({
        target: (() => divElement)() // hack to disable the warning
    });

    let chest = useGltf("models/chest.gltf");
    let sign = useGltf("models/sign.gltf");
    let piston = useGltf("models/piston.gltf");
    let stickyPiston = useGltf("models/sticky_piston.gltf");

    let connector = useTexture("textures/connector.png", {
        transform: texture => {
            texture.magFilter = NearestFilter; return texture;
        }
    });

    let blockTextures = Object.fromEntries(BLOCK_CATEGORIES.map(category => {
        return [category, useTexture(
            "textures/" + category + ".png", {
                transform: texture => {
                    texture.magFilter = NearestFilter;
                    return texture;
                }
            }
        )];
    }));

    let renderQueue: ({
        block: Codeblock, connector: Bracket | null, indent: number, index: number
    } | {
        bracket: Bracket, indent: number, index: number
    })[] = $derived.by(updateRenderQueue);

    function updateRenderQueue() {
        let blocks = template.blocks;

        let queue = [];
        let index = 0;
        let indent = 0;

        for (let idx = 0; idx < blocks.length; idx++) {
            let block = blocks[idx];
            if (index + 1 < blocks.length - 1 && blocks[index + 1].isBracket() && blocks[index + 1].direction == "open") {
                queue.push({
                    block: block,
                    connector: blocks[index + 1] as Bracket,
                    indent: indent,
                    index: idx
                });
                indent++;
            } else if (block.isBracket()) {
                if (block.direction == "close") {
                    indent--;
                    queue.push({
                        bracket: block as Bracket,
                        indent: indent,
                        index: idx
                    });
                }
            } else {
                queue.push({
                    block: block,
                    connector: null,
                    indent: indent,
                    index: idx
                })
            }
            index++;
        }
        return queue;
    }

    const signLineYValues = [0.25, 0.12, 0, -0.12];

    function indentPosition(position: number[], indents: number): number[] {
        return [position[0] + indents * 0.5, position[1] - indents * 0.5, position[2] - indents * 0.5];
    }

    function getOutlineColor(color: number): number {
        let c: [number, number, number] = convert.hex.hsv.raw(color.toString(16));
        return parseInt(convert.hsv.hex(c[0], c[1], c[2] / 3), 16);
    }

    let cameraIndentOffset = $state(0);

    $effect(() => {
        maxX = renderQueue.length * 2;
        let index = Math.min(Math.max(0, Math.floor(cameraX.current / 2)), renderQueue.length - 1);
        cameraIndentOffset = renderQueue.length == 0 ? 0 : renderQueue[index].indent;
        let zoom = 10 / (1 + Math.exp(-0.25 * (cameraZoom.target - 8 * Math.log(2)))) + 5;
        cameraZ.target = zoom - cameraIndentOffset * 0.5;
        cameraY.target = 1 - cameraIndentOffset * 0.5;
    });

    function prepareArguments(block: Codeblock) {
        let indices = [];
        for (let i = 0; i < block.args.length; i++) {
            let item = block.args[i];
            if (item.item instanceof BlockTagItem) {
                indices.push(i);
            }
        }

        indices.sort((a, b) => b - a);
        for (let index of indices) {
            block.args.splice(index, 1);
        }

        let bts = allActions[block.category][block.action]?.block_tags ?? [];
        let a = block.action;
        let c = block.category;
        if (block.subAction) {
            let trueName = block.subAction in actionCategoryMap ? block.subAction : aliasActionMap[block.subAction];
            bts = allActions[actionCategoryMap[trueName]][trueName]?.block_tags ?? [];
            a = trueName;
            c = actionCategoryMap[trueName];
        }
        for (let tag of bts) {
            let { name, default: def, slot } = tag;
            block.args.push(new Argument(new BlockTagItem(def, name, a, c), slot));
        }
    }

    function sIO(block: Codeblock, index: number) {
        function update() {
            // update block tags
            if (block.args) {
                prepareArguments(block);
            }
            if (block.category in CATEGORY_BRACKETS_MAP) {
                if (!(index + 1 < template.blocks.length && template.blocks[index + 1].isBracket())) {
                    template.blocks.splice(index + 1, 0,
                        new Bracket("open", CATEGORY_BRACKETS_MAP[block.category]),
                        new Bracket("close", CATEGORY_BRACKETS_MAP[block.category])
                    );
                }
            } else {
                if (index + 1 < template.blocks.length && template.blocks[index + 1].isBracket() && template.blocks[index + 1].direction == "open") {
                    deleteAtIndex(index + 1);
                }
            }
            if (["func", "call_func", "process", "start_process"].includes(block.category)) {
                block.data = block.data ?? block.action;
                block.action = null;
            } else {
                block.action = block.data ?? block.action in allActions[block.category] ? block.data ?? block.action : "";
                block.data = null;
            }
            updateTemplateJSON();
            renderQueue = updateRenderQueue();
            sIO(block, index);
        }

        let secondLine;
        if (["func", "process", "call_func", "start_process"].includes(block.category)) {
            secondLine = [
                {
                    label: 'Name',
                    id: 'name',
                    type: 'StringField',
                    set: data => {
                        template.blocks[index].data = data;
                        update();
                    },
                    get: () => block.data
                }
            ];
        } else {
            let actions = Object.entries(allActions[block.category]).map(([id, data]) => {
                return {
                    text: data.name,
                    name: id
                }
            });
            secondLine = [
                {
                    label: 'Action',
                    id: 'action',
                    type: 'DropDown',
                    options: actions,
                    set: data => {
                        template.blocks[index].action = data;
                        update();
                    },
                    get: () => block.action
                }
            ];
        }

        let iO = [
            [
                {
                    label: 'Category',
                    id: 'category',
                    type: 'DropDown',
                    options: BLOCK_CATEGORIES.map(el => {
                        return {
                            text: CATEGORY_MAP[el],
                            name: el
                        }
                    }),
                    set: data => {
                        template.blocks[index].category = data;
                        update();
                    },
                    get: () => block.category
                }
            ],
            secondLine
        ];
        if (["if_entity", "entity_action"].includes(block.category)) {
            iO.push([
                {
                    label: 'Selector',
                    id: 'selector',
                    type: 'DropDown',
                    options: [{name: "", text: ""}].concat(ENTITY_SELECTION_TARGET_DROPDOWN),
                    set: data => {
                        template.blocks[index].target = data == "" ? null : data;
                        update();
                    },
                    get: () => block.target ?? ""
                }
            ]);
        }
        if (["if_player", "player_action"].includes(block.category)) {
            iO.push([
                {
                    label: 'Selector',
                    id: 'selector',
                    type: 'DropDown',
                    options: [{name: "", text: ""}].concat(PLAYER_SELECTION_TARGET_DROPDOWN),
                    set: data => {
                        template.blocks[index].target = data == "" ? null : data;
                        update();
                    },
                    get: () => block.target ?? ""
                }
            ]);
        }
        if (CATEGORY_ATTRIBUTES.has(block.category)) {
            iO.push([
                {
                    label: CATEGORY_ATTRIBUTES.get(block.category),
                    id: 'category',
                    type: 'BooleanField',
                    set: data => {
                        template.blocks[index].attribute = data;
                        update();
                    },
                    get: () => block.attribute
                }
            ]);
        }

        if (block.action && allActions[block.category][block.action].subactions.length) {
            let subactions: {name: str, text: str}[] = [];
            for (let cate of allActions[block.category][block.action].subactions) {
                subactions.push(...Object.keys(allActions[cate]).map(k => {
                    let act = allActions[cate][k];
                    return {
                        name: act.aliases?.length ? act.aliases[0] : k,
                        text: CATEGORY_MAP[cate] + " " + act.name
                    }
                }));
            }
            iO.push([
                {
                    label: 'Sub-action',
                    id: 'subaction',
                    type: 'DropDown',
                    options: subactions,
                    set: data => {
                        (template.blocks[index] as Codeblock).subAction = data;
                        update();
                    },
                    get: () => block.subAction ?? ""
                }
            ]);
        }
        setInspectorObjects(iO);
    }

    function insertPosition(index: number) {
        return {
            options: BLOCK_CATEGORIES.map(category => {
                return {
                    tooltip: "Insert " + CATEGORY_MAP[category],
                    image: "/textures/" + category + ".png",
                    callback: () => {
                        let blocks = [new Codeblock(category, "", [])];
                        if (category in CATEGORY_BRACKETS_MAP) {
                            blocks.push(new Bracket("open", CATEGORY_BRACKETS_MAP[category]));
                            blocks.push(new Bracket("close", CATEGORY_BRACKETS_MAP[category]));
                        }
                        template.blocks.splice(index, 0, ...blocks);
                        updateTemplateJSON();
                        renderQueue = updateRenderQueue();
                        return null;
                    }
                }
            }),
            flexDirection: "row"
        }
    }

    function moveBlocks(startingIndex: number) {
        let insertIndex = startingIndex;
        let cloned = [];
        for (let index of selection) {
            cloned.push(template.blocks[index]);
            if (index < startingIndex) {
                insertIndex--;
            }
        }
        for (let removingIndex of selection.toReversed()) {
            template.blocks.splice(removingIndex, 1);
        }
        template.blocks.splice(insertIndex, 0, ...cloned);
        selectBlocks(null);
        updateTemplateJSON();
        renderQueue = updateRenderQueue();
    }

    function insertAfter(thisIndex: number): Option {
        let callback = () => insertPosition(thisIndex + 1);
        let insertInBracket = template.blocks[thisIndex].isBracket() && (template.blocks[thisIndex] as Bracket).direction == "open";
        if (!template.blocks[thisIndex].isBracket()) {
            if ((template.blocks[thisIndex] as Codeblock).category in CATEGORY_BRACKETS_MAP) {
                callback = () => insertPosition(thisIndex + 2);
                insertInBracket = true;
            }
        }
        return {
            label: insertInBracket ? "Insert in brackets" : "Insert after",
            tooltip: insertInBracket ? "Insert a code block inside the following brackets." : "Insert a code block directly after this block.",
            callback: callback
        }
    }

    function setConnectorContextMenu(e, index: number) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let options = [insertAfter(index)];
        if (movingSelection && !selection.includes(index)) {
            options.push({
                label: "Move after",
                tooltip: "Move the selected blocks to after this block.",
                callback: () => moveBlocks(index + 1)
            });
        }
        setContextMenu(e, options);
    }

    function findMatchingBracketIndex(thisBracket: number): number {
        let bracketsCount = 1;
        let closingIndex = thisBracket;
        let direction = (template.blocks[thisBracket] as Bracket).direction
        if (direction == "open") {
            while (bracketsCount != 0) {
                closingIndex++;
                if (closingIndex == template.blocks.length) {
                    closingIndex = -1;
                    break;
                }
                if (template.blocks[closingIndex].isBracket()) {
                    bracketsCount += (template.blocks[closingIndex] as Bracket).direction == "open" ? 1 : -1;
                }
            }
        } else {
            while (bracketsCount != 0) {
                closingIndex--;
                if (closingIndex == -1) {
                    break;
                }
                if (template.blocks[closingIndex].isBracket()) {
                    bracketsCount += (template.blocks[closingIndex] as Bracket).direction == "close" ? 1 : -1;
                }
            }
        }
        return closingIndex;
    }

    function deleteAtIndex(index: number) {
        let removingIndices = [];
        if (template.blocks[index].isBracket()) {
            let closingIndex = findMatchingBracketIndex(index);
            if (closingIndex != -1) {
                removingIndices.push(closingIndex);
                let [deletedBracket]: [Bracket] = template.blocks.splice(closingIndex, 1);
                if (deletedBracket.direction == "open" && closingIndex > 0) {
                    removingIndices.push(closingIndex - 1);
                }
            }
        } else {
            if ((template.blocks[index] as Codeblock).category in CATEGORY_BRACKETS_MAP && index + 1 < template.blocks.length) {
                deleteAtIndex(index + 1);
            }
        }
        removingIndices.push(index);
        removingIndices.sort((a, b) => b - a);
        for (let index of removingIndices) template.blocks.splice(index, 1);
    }

    let selection = $state([]);
    let startSelection: boolean | number = $state(false);
    let movingSelection = $state(false);

    function selectBlocks(start: number | null, end?: number) {
        selection = [];
        startSelection = false;
        movingSelection = false;
        if (!start) return;

        for (let index = start; index <= end; index++) {
            selection.push(index);
            if (template.blocks[index + 1]?.isBracket()) {
                let closing = findMatchingBracketIndex(index + 1);
                if (start >= index + 1 || index + 1 >= end) {
                    selection.push(index + 1)
                }
                if (start >= closing || closing >= end) {
                    selection.push(closing);
                }
            }
            if (template.blocks[index].isBracket()) {
                let closing = findMatchingBracketIndex(index);
                if (start >= closing || closing >= end) {
                    selection.push(closing);
                }
            }
        }

        selection = Array.of(...new Set(selection).keys())
        selection.sort();
    }

    function setCM(e, block: Block, index: number) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let options = [];
        if (selection.length == 0) {
            if (!startSelection) {
                options.push({
                    label: "Select",
                    tooltip: "Select this code block.",
                    callback: () => {
                        selectBlocks(index, index);
                    }
                }, {
                    label: "Start selection",
                    tooltip: "Start selection",
                    callback: () => {
                        startSelection = index;
                    }
                });
            } else {
                options.push({
                    label: "End selection",
                    tooltip: "End selection",
                    callback: () => {
                        selectBlocks(startSelection, index);
                    }
                }, {
                    label: "Cancel selection",
                    tooltip: "Cancel selection",
                    callback: () => {
                        selectBlocks(null);
                    }
                });
            }
        } else {
            options.push({
                label: "Deselect",
                tooltip: "Deselect",
                callback: () => {
                    selection = [];
                    startSelection = false;
                    movingSelection = false;
                }
            });
            if (selection.includes(index)) {
                options.push({
                    label: "Move selection",
                    tooltip: "Move the selected code blocks.",
                    callback: () => {
                        movingSelection = true;
                    }
                });
            }
        }
        if (!block.isBracket() || (block as Bracket).direction == "close") {
            options.push({
                label: "Insert before",
                tooltip: "Insert a code block directly before this block.",
                callback: () => insertPosition(index)
            });
        }
        options.push(insertAfter(index));
        if (movingSelection && !selection.includes(index)) {
            if (!block.isBracket() || (block as Bracket).direction == "close") {
                options.push({
                    label: "Move before",
                    tooltip: "Move the selected blocks to before this block.",
                    callback: () => moveBlocks(index)
                });
            }
            options.push({
                label: "Move after",
                tooltip: "Move the selected blocks to after this block.",
                callback: () => moveBlocks(index + 1)
            });
        }
        options.push(
            {
                label: "Copy JSON",
                tooltip: "Copy block data to clipboard as JSON.",
                callback: () => {
                    navigator.clipboard.writeText(JSON.stringify(block.toJSON()));
                }
            },
            {
                label: "<red>Delete",
                tooltip: selection.includes(index) ? "Delete the current selection." : "Delete the current block.",
                callback: () => {
                    if (editBlockIndex == index) {
                        setInspectorObjects(null);
                    }
                    if (selection.length == 0) {
                        deleteAtIndex(index);
                    } else {
                        let sorted = selection.toReversed();
                        for (let index of sorted) {
                            template.blocks.splice(index, 1);
                        }
                        selection = [];
                    }
                    template.blocks = [...template.blocks];
                    updateTemplateJSON();
                    renderQueue = updateRenderQueue();
                }
            }
        );
        setContextMenu(e, options);
    }
</script>

{#snippet textLine(text, color, position)}
    <Text
            {text}
            {color}
            {position}
            font="/minecraft_seven.ttf"
            textAlign="center"
            anchorX="center"
            fontSize={0.09}
            outlineColor={getOutlineColor(color)}
            outlineWidth={0.01}
    />
{/snippet}

{#snippet renderBracket(bracket, positionX, index, indent)}
    {@const open = bracket.direction === "open" ? -1 : 1}
    {#if (selection.includes(index) || index === startSelection) && bracket.direction === "close"}
        <T.Mesh
                position={indentPosition([positionX, 0, 0], indent)}
        >
            <T.BoxGeometry
                    args={[-1.2, -1.2, -1.2]}
            />
            <T.MeshBasicMaterial color={selection.includes(index) ? movingSelection ? "ghostwhite" : "aqua" : "hotpink"} />
        </T.Mesh>
    {/if}
    {#await (bracket.type === "norm" ? piston : stickyPiston) then model}
        <T
                is={model.scene.clone()}
                position={indentPosition([positionX - 0.5, -0.5, open * 0.5], indent)}
                rotation={[0, open * Math.PI / 2, 0]}
                oncontextmenu={e => {
                    setCM(e.nativeEvent, bracket, index);
                }}
        />
    {/await}
{/snippet}

<T.PerspectiveCamera makeDefault position={[cameraX.current, cameraY.current, cameraZ.current]} oncreate={ref => {ref.lookAt(cameraX.current, 0, 0)}}/>
<T.AmbientLight />
<T.DirectionalLight position={[cameraX.current, 1, 0]} />
{#each renderQueue as blockRenderData, index}
    {#if "bracket" in blockRenderData}
        {@render renderBracket(blockRenderData.bracket, index * 2 + 1, blockRenderData.index, blockRenderData.indent)}
    {:else}
        {#if selection.includes(blockRenderData.index) || blockRenderData.index === startSelection}
            <T.Mesh
                    position={indentPosition([index * 2 + 0.5, 0, 0], blockRenderData.indent)}
            >
                <T.BoxGeometry
                        args={[-2.2, -1.2, -1.2]}
                />
                <T.MeshBasicMaterial color={selection.includes(blockRenderData.index) ? movingSelection ? "ghostwhite" : "aqua" : "hotpink"} />
            </T.Mesh>
        {/if}
        <T.Mesh
                position={indentPosition([index * 2, 0, 0], blockRenderData.indent)}
                oncontextmenu={e => {
                    setCM(e.nativeEvent, blockRenderData.block, blockRenderData.index);
                }}
        >
            <T.BoxGeometry  />
            {#await blockTextures[blockRenderData.block.category] then texture}
                <T.MeshStandardMaterial map={texture} />
            {/await}
        </T.Mesh>
        {#if blockRenderData.connector !== null}
            {@render renderBracket(blockRenderData.connector, index * 2 + 2, blockRenderData.index + 1, blockRenderData.indent)}
        {:else}
            <T.Mesh
                    position={indentPosition([index * 2 + 1, 0, 0], blockRenderData.indent)}
                    oncontextmenu={e => {
                        setConnectorContextMenu(e.nativeEvent, blockRenderData.index);
                    }}
            >
                <T.BoxGeometry />
                {#await connector then texture}
                    <T.MeshStandardMaterial map={texture} />
                {/await}
            </T.Mesh>
        {/if}
        {#if !(["event", "entity_event", "game_event", "else"].includes(blockRenderData.block.category))}
            {#await chest then model}
                <T
                        is={model.scene.clone()}
                        position={indentPosition([index * 2 - 0.5, 0.5, 0.5], blockRenderData.indent)}
                        rotation={[0, Math.PI / 2, 0]}
                        onclick={() => clickChest(blockRenderData.index)}
                        onpointerenter={() => document.body.style.cursor = 'pointer'}
                        onpointerleave={() => document.body.style.cursor = 'default'}
                ></T>
            {/await}
        {/if}
        {#if blockRenderData.block.category !== "else"}
            {#await sign then model}
                <T
                        is={model.scene.clone()}
                        position={indentPosition([index * 2 - 0.5, -0.5, -0.4], blockRenderData.indent)}
                        onclick={e => {
                            e.nativeEvent.stopImmediatePropagation();
                            editBlockIndex = blockRenderData.index;
                            sIO(blockRenderData.block, blockRenderData.index);
                        }}
                        oncontextmenu={e => {
                            setCM(e.nativeEvent, blockRenderData.block, blockRenderData.index);
                        }}
                        onpointerenter={() => document.body.style.cursor = 'pointer'}
                        onpointerleave={() => document.body.style.cursor = 'default'}
                />
                {@render textLine(firstLine(blockRenderData.block), 0xaaaaaa, indentPosition([index * 2, signLineYValues[0], 0.63], blockRenderData.indent))}
                {@render textLine(secondLine(blockRenderData.block), 0xffffff, indentPosition([index * 2, signLineYValues[1], 0.63], blockRenderData.indent))}
                {#if thirdLine(blockRenderData.block) != null}
                    {@render textLine(thirdLine(blockRenderData.block), 0xaaffaa, indentPosition([index * 2, signLineYValues[2], 0.63], blockRenderData.indent))}
                {/if}
                {#if fourthLine(blockRenderData.block) != null}
                    {@render textLine(fourthLine(blockRenderData.block), 0xff8800, indentPosition([index * 2, signLineYValues[3], 0.63], blockRenderData.indent))}
                {/if}
            {/await}
        {/if}
    {/if}
{/each}