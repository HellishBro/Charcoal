<script lang="ts">
    import {Codeblock, Item, Template} from "$lib/diamondfire";
    import "svelte";
    import { CodeClient } from "$lib/codeclient"
    import CodeRenderer from "$lib/components/editor/CodeRenderer.svelte";
    import ChestMenu from "$lib/components/editor/ChestMenu.svelte";
    import { isJSON } from "$lib/utils";
    import { onMount } from "svelte";
    import Inspector from "$lib/components/editor/Inspector.svelte";
    import { setInspectorObjects } from "$lib/components/editor/Inspector.svelte";
    import { CATEGORY_COLOR_MAP, TYPE_DISPLAY_COLORS_MAP, TYPE_DISPLAY_MAP } from "$lib/df_reprs";
    import {toURLSafeB64} from "$lib/utils.ts";
    import {replaceState} from "$app/navigation";

    let { template = "" } = $props();
    let templateObject = $state((() => template)() ? Template.decodeTemplate((() => template)()) : new Template([]));
    let templateDisplay = $state((() => template)() ? JSON.stringify((() => templateObject)().toJSON(), null, 4) : "");

    let statusMessage = $state("");

    onMount(() => setStatus("success"));

    function setStatus(status: 'success' | 'error', msg?: string) {
        document.getElementById("codeStatus").style.backgroundColor = "var(--" + status + ")";
        if (status === 'success') {
            statusMessage = "Code parsed successfully!";
        } else {
            statusMessage = msg;
        }
    }

    function inputTemplate(event: Event) {
        template = (event.target as HTMLTextAreaElement).value.trim();
        if (template.startsWith("'") && template.endsWith("'")) {
            template = template.substring(1, template.length - 1);
        }
        try {
            if (isJSON(template) && template.length != 0) {
                let json = JSON.parse(template);
                if ("code" in json) {
                    templateObject = Template.decodeTemplate(json.code);
                } else {
                    templateObject = Template.fromJSON(JSON.parse(template));
                }
                setStatus("success");
            } else if (template.matchAll(/[a-zA-Z0-9+/=]+/g)) {
                templateObject = Template.decodeTemplate(template);
                setStatus("success");
            } else if (template.length == 0) {
                templateObject = new Template([]);
                setStatus("success");
            } else {
                setStatus("error", "Cannot parse template because template does not match any acceptable template format.");
            }
        } catch (e) {
            setStatus("error", "Cannot parse template: " + e.toString());
        }
    }

    async function sendTemplate() {
        let codeclient = new CodeClient();
        await codeclient.connect();
        codeclient.giveTemplate(templateObject.encodeTemplate(), "Charcoal Template", "Charcoal");
        codeclient.close();
    }

    let clickedChestIndex = $state(-1);
    let editBlockIndex = $state(-1);

    function clickChest(index: number) {
        clickedChestIndex = index;
    }

    function getInspectingTitle(): string {
        let text: string;
        let color: string;
        if (clickedChestIndex != -1) {
            text = inspectingItemItem ? TYPE_DISPLAY_MAP[inspectingItemItem.id] : "";
            color = inspectingItemItem ? TYPE_DISPLAY_COLORS_MAP[inspectingItemItem.id] : "";
        }
        if (editBlockIndex != -1) {
            text = (templateObject.blocks[editBlockIndex] as Codeblock).action || "&lt;empty&gt;";
            color = CATEGORY_COLOR_MAP[(templateObject.blocks[editBlockIndex] as Codeblock).category];
        }
        return "<" + color + ">" + text + "</" + color + ">";
    }

    function updateTemplateJSON() {
        templateDisplay = JSON.stringify(templateObject.toJSON(), null, 4);
        let searchParams = new URLSearchParams(window.location.search);
        searchParams.set("template", toURLSafeB64(templateObject.encodeTemplate()));
        let loc = new URL(window.location.href);
        loc.search = searchParams.toString();
        replaceState(loc, null);
        inspectingTitle = getInspectingTitle();
        setStatus("success");
    }

    let inspectingItem = $state(-1);
    let freezeInDepthView = $state(false);
    let inspectingItemItem: Item | null = $state(null);
    let inspectingTitle = $derived.by(getInspectingTitle);
</script>

<div class="container">
    <div style="display: grid; grid-template-rows: 3fr 1fr; gap: 20px; min-height: 0; height: 100%; box-sizing: border-box; align-items: stretch">
        <div style="position: relative">
            <textarea
                    oninput={inputTemplate}
                    onblur={updateTemplateJSON}
                    placeholder="Enter template JSON, compressed template JSON, or codetemplatedata..."
                    style="overflow: scroll; resize: none; height: 100%; width: 100%; box-sizing: border-box; position: relative"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
            >{templateDisplay}</textarea>
            <div id="codeStatus" title={statusMessage}></div>
        </div>
        <button onclick={sendTemplate}>Send Template</button>
    </div>
    <div style="position: relative; height: 100%; min-height: 0; box-sizing: border-box;">
        <CodeRenderer
                bind:template={templateObject}
                bind:editBlockIndex
                {clickChest}
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
                {setInspectorObjects}
                {updateTemplateJSON}
        ></ChestMenu>
    </div>
    <Inspector
            bind:template={templateObject}
            bind:inspectingItem
            bind:freezeInDepthView
            bind:inspectingItemItem
            {inspectingTitle}
            {updateTemplateJSON}
    ></Inspector>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 20% 1fr 20%;
        gap: 20px;
        padding: 20px;
        width: 100%;
        height: 100%;
        align-items: stretch;
    }

    #codeStatus {
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