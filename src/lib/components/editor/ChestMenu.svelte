<script lang="ts">
    import { Argument, BlockTagItem, Codeblock, Item, ITEM_TYPES, Template } from "$lib/diamondfire";
    import MiniMessageRenderer from "$lib/components/MiniMessageRenderer.svelte";
    import { range } from "$lib/utils";
    import { startObfuscateText, stopObfuscatedText } from "$lib/minimessage";
    import { getContext, onDestroy, onMount } from "svelte";
    import { secondLine } from "$lib/df_reprs";
    import type { InspectorObject } from "$lib/components/editor/editor-state";
    import ChestMenuItem from "$lib/components/editor/ChestMenuItem.svelte";

    let {
        blockIndex,
        templateObject = $bindable(),
        inspectingItem = $bindable(),
        freezeInDepthView = $bindable(),
        inspectingItemItem = $bindable(),
        dismiss: dismissPassed,
        setInspectorObjects,
        updateTemplateJSON,
        visible = false,
        inspectorSpecialCase = false
    }: {
        blockIndex: number,
        templateObject: Template,
        inspectingItem: number,
        freezeInDepthView: boolean,
        inspectingItemItem: Item | null,
        dismiss: () => void,
        setInspectorObjects: (iO: InspectorObject[][] | null) => void,
        updateTemplateJSON: () => void,
        visible: boolean,
        inspectorSpecialCase: boolean
    } = $props();

    let block: Codeblock = $derived(templateObject.blocks[blockIndex]);

    let tooltip: string | null = $state(null);
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    let spanColor: string | null = $state(null);
    let ttDirect = $state(false);
    let tooltipElement: HTMLElement | null = $state(null);
    let chestMenuElement: HTMLDivElement | null = $state(null);

    let actions = getContext("actiondump").actiondump.actions;
    let actionCategoryMap = getContext("actiondump").actiondump.actions_category_reverse_map;
    let aliasActionMap = getContext("actiondump").actiondump.alias_reverse_map;

    function setTooltip(tt: string | null, sC: string | null, direct: boolean = false) {
        tooltip = tt;
        spanColor = sC;
        ttDirect = direct;
    }

    function pointerMove(event: PointerEvent) {
        if (tooltip !== null && chestMenuElement !== null && tooltipElement !== null) {
            tooltipX = event.clientX + 5;
            let openLeft = (event.clientX - chestMenuElement.offsetLeft) > chestMenuElement.offsetWidth / 2;
            if (openLeft) {
                tooltipX = event.clientX - tooltipElement.offsetWidth - 5;
            }
            tooltipY = event.clientY - 5;
        }
    }

    function dismiss() {
        freezeInDepthView = false;
        setInspectorObjects(null);
        dismissPassed();
    }

    function clearItem() {
        tooltip = null;
        if (!freezeInDepthView) {
            setInspectorObjects(null);
        }
    }

    let chestItems: (null | Argument)[] = $state(range(0, 27).map(() => null));

    function updateChestItems() {
        if (!block || block.isBracket()) {
            chestItems = range(0, 27).map(() => null);
            return;
        }
        let contents = block.args;
        chestItems = range(0, 27).map(() => null);
        for (let arg of contents) {
            if (arg.slot > 27) continue;
            chestItems[arg.slot] = arg;
        }
    }

    onMount(() => {
        startObfuscateText();
    });
    onDestroy(stopObfuscatedText);

    let previousVisible = $state(false);

    $effect(() => {
        if (visible && !previousVisible) {
            updateChestItems();
        }
        previousVisible = visible;
    });

    function getItemIndex(index: number): number {
        return block.args.findIndex(v => v.slot == index);
    }
</script>

{#if visible}
    <div
            role="presentation"
            style="width: 100%; height: 100%; background: rgba(0, 0, 0, 0.25); position: absolute; top: 0px; left: 0px; cursor: pointer;"
            onclick={dismiss}
    >
        <div role="presentation" class="container chestmenu" bind:this={chestMenuElement} onclick={e => {
            setInspectorObjects(null);
            freezeInDepthView = false;
            e.stopPropagation();
        }}>
            <p style="grid-column: 1 / 10; font-size: 20px; color: var(--text-cool); cursor: text;">
                Chest: {block == null || block.isBracket() ? "" : actions[block.category][block.action]?.name ?? (secondLine(block) ?? "<empty>")}
            </p>
            {#each chestItems as item, index}
                {@const workableName = block.subAction ? Object.keys(actionCategoryMap).includes(block.subAction) ? block.subAction : aliasActionMap[block.subAction] : block.action}
                {@const workableCategory = block.subAction ? Object.keys(actionCategoryMap).includes(block.subAction) ? actionCategoryMap[block.subAction] : actionCategoryMap[aliasActionMap[block.subAction]] : block.category}
                {@const blTags = actions[workableCategory][workableName]?.block_tags ?? []}
                <ChestMenuItem
                        bind:freezeInDepthView
                        deleteItemCb={() => {
                            chestItems[index] = null;
                            chestItems = chestItems;
                            setInspectorObjects(null);
                            inspectingItem = -1;
                            freezeInDepthView = false;
                            block.args.splice(getItemIndex(index), 1);
                            updateChestItems();
                            updateTemplateJSON();
                        }}
                        newItemCb={(value: Item) => {
                            if (value instanceof BlockTagItem) {
                                let a = block.action;
                                let c = block.category;
                                if (block.subAction) {
                                    a = workableName;
                                    c = workableCategory;
                                }
                                value.block = c;
                                value.action = a;
                                let matching = blTags.find(v => v.slot === index);
                                value.tag = matching.name;
                                value.option = matching.default;
                            }
                            let arg = new Argument(value, index);
                            chestItems[index] = arg;
                            block.args.push(arg);
                            block.args.sort((a, b) => a.slot - b.slot);
                            chestItems = [...chestItems];
                            updateChestItems();
                            updateTemplateJSON();
                        }}
                        setItemCb={newItem => templateObject.blocks[blockIndex].args[getItemIndex(index)].item = newItem}
                        setThisToInspectingItem={() => {
                            inspectingItem = getItemIndex(index);
                            inspectingItemItem = block.args[inspectingItem].item;
                        }}
                        doInspect={() => (!freezeInDepthView || getItemIndex(index) === inspectingItem) && !inspectorSpecialCase}
                        innerItem={item ? item.item : null}
                        nullItemBehavior={() => setInspectorObjects(null)}
                        allowedItemsList={blTags.find(v => v.slot === index) ? ITEM_TYPES : ITEM_TYPES.toSpliced(ITEM_TYPES.indexOf("bl_tag"), 1)}
                        {pointerMove}
                        {setInspectorObjects}
                        {setTooltip}
                        {clearItem}
                ></ChestMenuItem>
            {/each}
        </div>

        {#if tooltip !== null}
            <p
                    class="tooltip"
                    style="left: {tooltipX}px; top: {tooltipY}px; {spanColor ? ('color: ' + spanColor) : ''};"
                    bind:this={tooltipElement}
            >
                {#if ttDirect === false}
                    <MiniMessageRenderer mm={tooltip}></MiniMessageRenderer>
                {:else}
                    {@html tooltip}
                {/if}
            </p>
        {/if}
    </div>
{/if}

<style>
    .container {
        background: var(--cool-dark);
        position: absolute;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.25);
        cursor: default;
        color: var(--text-cool);
    }

    .chestmenu {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
        grid-template-rows: 40px 1fr 1fr 1fr;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        gap: min(10px, 1vw);
    }
</style>
