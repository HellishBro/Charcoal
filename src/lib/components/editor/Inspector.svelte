<script lang="ts">
    import { Item, VALUE_TYPES } from "$lib/diamondfire";
    import Checkbox from "$lib/components/Checkbox.svelte";
    import ChestMenuItem from "$lib/components/editor/ChestMenuItem.svelte";
    import MiniMessageRenderer from "$lib/components/MiniMessageRenderer.svelte";
    import { fastRender } from "$lib/minimessage";
    import DropDown from "$lib/components/DropDown.svelte";
    import { getContext } from "svelte";
    import type { InspectorObject } from "$lib/components/editor/editor-state";

    let {
        inspectingItem = $bindable(),
        inspectingItemItem = $bindable(),
        freezeInDepthView = $bindable(),
        inspectorObjects = $bindable<InspectorObject[][] | null>(null),
        inspectorSpecialCase = $bindable(false),
        updateTemplateJSON,
        inspectingTitle
    }: {
        inspectingItem: number,
        inspectingItemItem: Item | null,
        freezeInDepthView: boolean,
        inspectorObjects: InspectorObject[][] | null,
        inspectorSpecialCase: boolean,
        updateTemplateJSON: () => void,
        inspectingTitle: string
    } = $props();

    let inDepthElement: HTMLDivElement | null = $state(null);
    let isMobile: boolean = $derived(getContext("editorMobile").isMobile);

    function getPlaceholder(inspectorObject: InspectorObject) {
        if (inspectorObject.placeholder) return inspectorObject.placeholder;
        let dataType = { StringField: "string", NumberField: "number", MiniMessageField: "minimessage", ColorField: "color", PercentageField: "percent" }[inspectorObject.type];
        return `${inspectorObject.label} (${dataType})`;
    }

    let tooltip: string | null = $state(null);
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    let spanColor: string | null = $state(null);
    let ttDirect = $state(false);
    let tooltipElement: HTMLElement | null = $state(null);

    function setTooltipThis(tt: string | null, sC: string | null, direct: boolean = false) {
        tooltip = tt;
        spanColor = sC;
        ttDirect = direct;
    }

    function pointerMove(event: PointerEvent) {
        if (tooltip !== null && tooltipElement !== null) {
            tooltipX = event.clientX - tooltipElement.offsetWidth - 5;
            tooltipY = event.clientY - 5;
        }
    }

    $effect(() => {
        if (!freezeInDepthView) {
            inspectorSpecialCase = false;
        }
    });
</script>

<div
        class="container coolContainer"
        oncreate={ref => inDepthElement = ref}
        style="display: flex; flex-direction: column; position: relative; cursor: auto; overflow-y: auto; min-height: 0; min-width: 0;"
>
    <div style="display: flex; justify-content: space-between; align-items: {isMobile ? 'flex-start' : 'center'}; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 20px; display: inline">Inspector</span>
        {#if freezeInDepthView}
            <span style="font-size: 13px; display: inline; text-align: right;">Click elsewhere to unfocus.</span>
        {:else}
            <span style="font-size: 13px; display: inline; text-align: right;">Click an item to focus inspector.</span>
        {/if}
        {#if inspectorObjects !== null}
            <div style="margin-top: 10px; font-size: 20px; width: 100%;">{@html fastRender(inspectingTitle)}</div>
        {/if}
    </div>
    <form onsubmit={e => e.preventDefault()} style="display: flex; gap: 10px; flex-direction: column; margin-top: 25px;">
        {#each inspectorObjects as inspectorObjectRow}
            <div style="display: flex; gap: 10px;">
                {#each inspectorObjectRow as inspectorObject}
                    <div style="flex-grow: 1">
                        <label for={inspectorObject.id} style="cursor: auto;">{inspectorObject.label}</label>
                        {#if inspectorObject.type === 'StringField' || inspectorObject.type === 'MiniMessageField'}
                            {#if inspectorObject.multiline}
                                <textarea
                                        id={inspectorObject.id}
                                        name={inspectorObject.id}
                                        oninput={e => {
                                            inspectorObject.set((e.target as HTMLTextAreaElement).value);
                                            updateTemplateJSON();
                                        }}
                                        placeholder={getPlaceholder(inspectorObject)}
                                        style="resize: vertical; max-height: 250px;"
                                >{inspectorObject.get() ?? ""}</textarea>
                            {:else}
                                <input
                                        type="text"
                                        id={inspectorObject.id}
                                        name={inspectorObject.id}
                                        bind:value={
                                            () => inspectorObject.get() ?? "",
                                            v => {
                                                inspectorObject.set(v);
                                                updateTemplateJSON();
                                            }
                                        }
                                        placeholder={getPlaceholder(inspectorObject)}
                                />
                            {/if}
                        {:else if inspectorObject.type === 'NumberField'}
                            <input
                                    type="number"
                                    id={inspectorObject.id}
                                    name={inspectorObject.id}
                                    value={inspectorObject.get() ?? ""}
                                    oninput={e => {
                                        const value = (e.target as HTMLInputElement).value;
                                        // Solo actualizar si no está vacío
                                        if (value !== "") {
                                            inspectorObject.set(parseFloat(value));
                                            updateTemplateJSON();
                                        }
                                    }}
                                    onblur={e => {
                                        const value = (e.target as HTMLInputElement).value;
                                        // Si quedó vacío después de salir, guardar como 0
                                        if (value === "") {
                                            inspectorObject.set(0);
                                            updateTemplateJSON();
                                        }
                                    }}
                                    placeholder={getPlaceholder(inspectorObject)}
                            />
                        {:else if inspectorObject.type === 'ColorField'}
                            <input
                                    type="text"
                                    data-coloris
                                    id={inspectorObject.id}
                                    name={inspectorObject.id}
                                    bind:value={
                                        () => "#" + (inspectorObject.get() ?? "000000"),
                                        v => {
                                            inspectorObject.set(v.replaceAll("#", ""));
                                            updateTemplateJSON();
                                        }
                                    }
                                    placeholder={getPlaceholder(inspectorObject)}
                            />
                        {:else if inspectorObject.type === 'PercentageField'}
                            <input
                                    type="number"
                                    id={inspectorObject.id}
                                    name={inspectorObject.id}
                                    value={(inspectorObject.get() * 100).toString()}
                                    oninput={e => {
                                        const value = (e.target as HTMLInputElement).value;
                                        // Solo actualizar si no está vacío
                                        if (value !== "") {
                                            inspectorObject.set(parseFloat(value) / 100);
                                            updateTemplateJSON();
                                        }
                                    }}
                                    placeholder={getPlaceholder(inspectorObject)}
                                    min="0"
                                    max="100"
                                    style="min-width: 75px"
                            />
                        {:else if inspectorObject.type === 'BooleanField'}
                            <Checkbox
                                    type="checkbox"
                                    id={inspectorObject.id}
                                    name={inspectorObject.id}
                                    bind:checked={
                                        () => inspectorObject.get(),
                                        value => {
                                            inspectorObject.set(value);
                                            updateTemplateJSON();
                                        }
                                    }
                            ></Checkbox>
                        {:else if inspectorObject.type === 'DropDown'}
                            <DropDown
                                    name={inspectorObject.id}
                                    id={inspectorObject.id}
                                    options={inspectorObject.options.map(opt => {
                                        return {
                                            text: opt.text,
                                            name: opt.name,
                                            selected: opt.name === inspectorObject.get()
                                        }
                                    })}
                                    oninput={name => {
                                        inspectorObject.set(name);
                                        updateTemplateJSON();
                                    }}
                            ></DropDown>
                        {:else if inspectorObject.type === 'ItemField'}
                            <ChestMenuItem
                                    bind:freezeInDepthView={inspectorSpecialCase}
                                    deleteItemCb={() => {
                                        inspectorObject.set(null);
                                        inspectorObjects = inspectorObjects.map(row =>
                                            row.map(io =>
                                                io === inspectorObject
                                                    ? { ...io }
                                                    : io
                                            )
                                        );
                                        updateTemplateJSON();
                                    }}
                                    newItemCb={(value: Item) => {
                                        inspectorObject.set(value);
                                        inspectorObjects = inspectorObjects.map(row =>
                                            row.map(io =>
                                                io === inspectorObject
                                                    ? { ...io }
                                                    : io
                                            )
                                        );
                                        updateTemplateJSON();
                                    }}
                                    setItemCb={newItem => {
                                        inspectorObject.set(newItem);
                                        inspectorObjects = inspectorObjects.map(row =>
                                            row.map(io =>
                                                io === inspectorObject
                                                    ? { ...io }
                                                    : io
                                            )
                                        );
                                        updateTemplateJSON();
                                    }}
                                    setThisToInspectingItem={() => {
                                        inspectingItem = -1;
                                        inspectingItemItem = inspectorObject.get();
                                        setTooltipThis(null, null);
                                    }}
                                    doInspect={() => inspectorSpecialCase}
                                    innerItem={inspectorObject.get()}
                                    nullItemBehavior={() => null}
                                    allowedItemsList={VALUE_TYPES}
                                    {pointerMove}
                                    setInspectorObjects={iO => {
                                        inspectorObjects = iO;
                                    }}
                                    setTooltip={setTooltipThis}
                                    clearItem={() => tooltip = null}
                            ></ChestMenuItem>
                        {/if}
                    </div>
                {/each}
            </div>
        {/each}
    </form>
    {#if tooltip !== null}
        <p
                class="tooltip"
                style="left: {tooltipX}px; top: {tooltipY}px; {spanColor ? ('color: #' + spanColor) : ''};"
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

<style>
    .coolContainer {
        background: var(--cool-dark);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.25);
        height: 100%;
        color: var(--text-cool);
    }
</style>
