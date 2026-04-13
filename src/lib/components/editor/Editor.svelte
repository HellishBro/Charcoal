<script lang="ts">
    import { Codeblock, Item } from "$lib/diamondfire";
    import "svelte";
    import { CodeClient } from "$lib/codeclient";
    import CodeRenderer from "$lib/components/editor/CodeRenderer.svelte";
    import ChestMenu from "$lib/components/editor/ChestMenu.svelte";
    import { setContext } from "svelte";
    import Inspector from "$lib/components/editor/Inspector.svelte";
    import {
        EDITOR_STATE_VERSION,
        EDITOR_SUCCESS_MESSAGE,
        type EditorRendererState,
        type EditorSessionState,
        type EditorStatusType,
        type InspectorObject,
        cloneEditorSessionState,
        createEditorSessionState,
        editorSessionStateSignature,
        hydrateEditorSessionState
    } from "$lib/components/editor/editor-state";
    import { CATEGORY_COLOR_MAP, secondLine, TYPE_DISPLAY_COLORS_MAP, TYPE_DISPLAY_MAP } from "$lib/df_reprs";
    import { toURLSafeB64 } from "$lib/utils.ts";
    import { replaceState } from "$app/navigation";
    import { getTemplateData } from "$lib/templatedata.ts";

    let {
        template = "",
        editorState = null,
        onStateChange,
        containerWidth,
        containerHeight
    }: {
        template: string,
        editorState: EditorSessionState | null,
        onStateChange?: (state: EditorSessionState) => void,
        containerWidth: number,
        containerHeight: number
    } = $props();

    $effect(() => {
        isMobile.isMobile = containerHeight == 0 ? false : containerWidth / containerHeight <= 9 / 10;
    });
    let isMobile = $state({
        isMobile: false
    });
    setContext("editorMobile", isMobile);

    const emptyState = createEditorSessionState();

    let templateObject = $state(emptyState.templateObject);
    let templateDisplay = $state(emptyState.state.templateInput);
    let statusType = $state<EditorStatusType>(emptyState.state.status.type);
    let statusMessage = $state(emptyState.state.status.message);

    let clickedChestIndex = $state(emptyState.state.ui.clickedChestIndex);
    let editBlockIndex = $state(emptyState.state.ui.editBlockIndex);
    let inspectingItem = $state(emptyState.state.ui.inspectingItem);
    let freezeInDepthView = $state(emptyState.state.ui.freezeInDepthView);
    let inspectingItemItem: Item | null = $state(null);

    let rendererState = $state<EditorRendererState>({
        cameraXTarget: emptyState.state.renderer.cameraXTarget,
        cameraZoomTarget: emptyState.state.renderer.cameraZoomTarget,
        selection: [...emptyState.state.renderer.selection],
        startSelection: emptyState.state.renderer.startSelection,
        movingSelection: emptyState.state.renderer.movingSelection
    });

    let inspectorObjects = $state<InspectorObject[][] | null>(null);
    let inspectorSpecialCase = $state(false);

    function setInspectorObjects(iO: InspectorObject[][] | null) {
        inspectorObjects = iO;
        inspectorSpecialCase = false;
    }

    function setStatus(status: EditorStatusType, message?: string) {
        statusType = status;
        if (status === "success") {
            statusMessage = EDITOR_SUCCESS_MESSAGE;
        } else {
            statusMessage = message ?? "Cannot parse template.";
        }
    }

    function inputTemplate() {
        const templateInput = templateDisplay.trim();

        const response = getTemplateData(templateInput);

        switch (response.status) {
            case "success":
                templateObject = response.templateObject;
                setStatus("success");
                break;

            case "error":
                setStatus("error", response.message);
                break;
        }
    }

    async function sendTemplate() {
        let codeclient = new CodeClient();
        await codeclient.connect();
        codeclient.giveTemplate(templateObject.encodeTemplate(), "Charcoal Template", "Charcoal");
        codeclient.close();
    }

    function clickChest(index: number) {
        clickedChestIndex = index;
    }

    function getInspectingTitle(): string {
        let text = "";
        let color = "white";
        if (clickedChestIndex != -1) {
            text = inspectingItemItem ? TYPE_DISPLAY_MAP[inspectingItemItem.id] : "";
            color = inspectingItemItem ? TYPE_DISPLAY_COLORS_MAP[inspectingItemItem.id] : "white";
        }
        if (editBlockIndex != -1) {
            text = secondLine(templateObject.blocks[editBlockIndex] as Codeblock) || "&lt;empty&gt;";
            color = CATEGORY_COLOR_MAP[(templateObject.blocks[editBlockIndex] as Codeblock).category];
        }
        return "<" + color + ">" + text + "</" + color + ">";
    }

    function updateTemplateJSON() {
        templateDisplay = JSON.stringify(templateObject.toJSON(), null, 4);
        setStatus("success");
    }

    function loadState(nextState: Partial<EditorSessionState> | null | undefined) {
        const hydratedState = hydrateEditorSessionState(nextState, template);

        templateObject = hydratedState.templateObject;
        templateDisplay = hydratedState.state.templateInput;
        statusType = hydratedState.state.status.type;
        statusMessage = hydratedState.state.status.message;

        clickedChestIndex = hydratedState.state.ui.clickedChestIndex;
        editBlockIndex = hydratedState.state.ui.editBlockIndex;
        inspectingItem = hydratedState.state.ui.inspectingItem;
        freezeInDepthView = hydratedState.state.ui.freezeInDepthView;
        inspectingItemItem = null;

        rendererState = {
            cameraXTarget: hydratedState.state.renderer.cameraXTarget,
            cameraZoomTarget: hydratedState.state.renderer.cameraZoomTarget,
            selection: [...hydratedState.state.renderer.selection],
            startSelection: hydratedState.state.renderer.startSelection,
            movingSelection: hydratedState.state.renderer.movingSelection
        };

        setInspectorObjects(null);
    }

    function buildSessionState(): EditorSessionState {
        return cloneEditorSessionState({
            version: EDITOR_STATE_VERSION,
            templateInput: templateDisplay,
            templateEncoded: templateObject.encodeTemplate(),
            status: {
                type: statusType,
                message: statusMessage
            },
            ui: {
                clickedChestIndex,
                editBlockIndex,
                inspectingItem,
                freezeInDepthView
            },
            renderer: {
                cameraXTarget: rendererState.cameraXTarget,
                cameraZoomTarget: rendererState.cameraZoomTarget,
                selection: [...rendererState.selection],
                startSelection: rendererState.startSelection,
                movingSelection: rendererState.movingSelection
            }
        });
    }

    let initialized = $state(false);
    let lastPublishedStateSignature = $state("");

    $effect(() => {
        if (!initialized) {
            loadState(editorState);
            initialized = true;
            return;
        }

        if (!editorState) {
            return;
        }

        const hydratedIncomingState = hydrateEditorSessionState(editorState, template).state;
        const incomingSignature = editorSessionStateSignature(hydratedIncomingState);
        const currentSignature = editorSessionStateSignature(buildSessionState());

        if (incomingSignature !== currentSignature && incomingSignature !== lastPublishedStateSignature) {
            loadState(editorState);
        }
    });

    $effect(() => {
        if (!initialized) {
            return;
        }

        templateDisplay;
        statusType;
        statusMessage;
        clickedChestIndex;
        editBlockIndex;
        inspectingItem;
        freezeInDepthView;
        rendererState.cameraXTarget;
        rendererState.cameraZoomTarget;
        rendererState.selection;
        rendererState.startSelection;
        rendererState.movingSelection;

        const nextState = buildSessionState();
        const nextStateSignature = editorSessionStateSignature(nextState);

        if (nextStateSignature !== lastPublishedStateSignature) {
            lastPublishedStateSignature = nextStateSignature;
            onStateChange?.(nextState);
        }
    });

    let inspectingTitle = $derived.by(getInspectingTitle);
</script>

<div class="container" class:mobile={isMobile.isMobile}>
    <div class="import-export">
        <div style="position: relative; min-height: 0; min-width: 0;">
            <textarea
                    bind:value={templateDisplay}
                    oninput={inputTemplate}
                    onblur={updateTemplateJSON}
                    placeholder="Enter template JSON, compressed template JSON, or codetemplatedata..."
                    style="overflow-y: auto; resize: none; height: 100%; width: 100%; box-sizing: border-box; position: relative"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
            ></textarea>
            <div class="code-status" title={statusMessage} style:background-color={"var(--" + statusType + ")"}></div>
        </div>
        <button onclick={sendTemplate}>Send Template</button>
    </div>
    <div style="position: relative; height: 100%; min-height: 0; min-width: 0; box-sizing: border-box;">
        <CodeRenderer
                bind:template={templateObject}
                bind:editBlockIndex
                bind:rendererState
                {clickChest}
                clearInspector={() => setInspectorObjects(null)}
                {setInspectorObjects}
                {updateTemplateJSON}
        ></CodeRenderer>
        <ChestMenu
                bind:templateObject
                bind:inspectingItem
                bind:freezeInDepthView
                bind:inspectingItemItem
                blockIndex={clickedChestIndex}
                visible={clickedChestIndex !== -1}
                dismiss={() => clickedChestIndex = -1}
                {inspectorSpecialCase}
                {setInspectorObjects}
                {updateTemplateJSON}
        ></ChestMenu>
    </div>
    <Inspector
            bind:inspectingItem
            bind:freezeInDepthView
            bind:inspectingItemItem
            bind:inspectorObjects
            bind:inspectorSpecialCase
            {inspectingTitle}
            {updateTemplateJSON}
    ></Inspector>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 20% 1fr 20%;
        grid-template-rows: 1fr;
        gap: 20px;
        padding: 20px;
        width: 100%;
        height: 100%;
        align-items: stretch;
    }

    .container > * {
        min-width: 0;
        min-height: 0;
    }

    .container.mobile {
        grid-template-columns: 1fr;
        grid-template-rows: 20% 1fr 20%;
    }

    .import-export {
        display: grid;
        grid-template-rows: 3fr 1fr;
        grid-template-columns: 1fr;
        gap: 20px;
        min-height: 0;
        min-width: 0;
        height: 100%;
        box-sizing: border-box;
        align-items: stretch;
    }

    .mobile .import-export {
        grid-template-rows: 1fr;
        grid-template-columns: 3fr 1fr;
    }

    .code-status {
        position: absolute;
        bottom: 10px;
        left: 10px;
        width: 20px;
        height: 20px;
        background: var(--success);
        border: 3px solid var(--black);
        border-radius: 10px;
    }
</style>
