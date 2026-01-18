<script lang="ts">
    import {Clipboard} from "@lucide/svelte";

    let {
        inner,
        wrapSpace = true,
    }: {
        inner: string,
        wrapSpace: boolean
    } = $props();
</script>

<div style="position: relative; width: 100%; display: inline-block">
    <button class="tiny-button" title="Click to copy" onclick={() => {
        navigator.clipboard.writeText(inner);
    }}><Clipboard></Clipboard></button>
    <pre style={{ "overflow-wrap": wrapSpace ? "break-word" : "anywhere" }}>{inner}</pre>
</div>

<style>
    .tiny-button {
        position: absolute;
        left: auto;
        right: 10px;
        top: 10px;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        box-shadow: none;
        color: var(--text);
    }

    pre {
        white-space: pre-wrap;
        max-height: 200px;
    }
</style>