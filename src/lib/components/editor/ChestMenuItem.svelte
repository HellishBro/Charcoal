<script lang="ts">
    import Item from "$lib/components/editor/Item.svelte";
    import {itemDefaultValue} from "$lib/diamondfire";
    import {TYPE_DISPLAY_MAP} from "$lib/df_reprs";
    import type {InspectorObject} from "$lib/components/editor/Inspector.svelte";
    import {setContextMenu} from "$lib/components/ContextMenu.svelte";

    let {
        freezeInDepthView = $bindable(),
        innerItem,
        pointerMove,
        setInspectorObjects,
        setTooltip,
        clearItem,
        deleteItemCb,
        newItemCb,
        setItemCb,
        setThisToInspectingItem,
        doInspect,
        nullItemBehavior,
        allowedItemsList
    } = $props();

    let inspectorObjects: InspectorObject[][] | null = $state(null);
</script>

<button
        class="item"
        onpointermove={pointerMove}
        onclick={e => {
            freezeInDepthView = innerItem !== null;
            if (freezeInDepthView) {
                setThisToInspectingItem();
                setInspectorObjects(inspectorObjects);
            } else {
                nullItemBehavior();
            }
            e.stopPropagation();
        }}
        style="display: flex; align-items: center; justify-content: center; color: var(--text-cool)"
        oncontextmenu={(e: PointerEvent) => {
            e.preventDefault();
            if (innerItem) {
                setContextMenu(e, [
                    {
                        label: "Copy JSON",
                        tooltip: "Copy item data to clipboard as JSON.",
                        callback: () => {
                            navigator.clipboard.writeText(JSON.stringify(innerItem.toJSON()));
                        }
                    }, {
                        label: "<red>Delete",
                        tooltip: "Delete the current item.",
                        callback: deleteItemCb
                    }
                ]);
            } else {
                setContextMenu(
                    e,
                    allowedItemsList.filter(t => t !== "hint").map(itemType => {
                        let callback = () => {
                            let value = itemDefaultValue(itemType);
                            newItemCb(value);
                        }
                        if (["item", "bl_tag"].includes(itemType)) {
                            return {
                                label: TYPE_DISPLAY_MAP[itemType],
                                tooltip: "New " + TYPE_DISPLAY_MAP[itemType],
                                callback: callback
                            }
                        } else {
                            return {
                                image: "/textures/" + itemType + ".png",
                                tooltip: "New " + TYPE_DISPLAY_MAP[itemType],
                                callback: callback
                            }
                        }
                    }),
                    "row"
                );
            }
        }}
>
    {#if innerItem !== null}
        <Item
                item={innerItem}
                set={setItemCb}
                {setTooltip}
                setInspectorObjects={iO => {
                    inspectorObjects = iO;
                    if (doInspect()) {
                        setThisToInspectingItem();
                        setInspectorObjects(iO);
                    }
                }}
                {clearItem}
        ></Item>
    {/if}
</button>

<style>
    .item {
        width: 75px;
        height: 75px;
        background: var(--cool);
        border-radius: 10px;
        cursor: pointer;
        padding: 0;
        margin: 0;
    }
</style>