<script lang="ts">
    import TopBar from "$lib/components/TopBar.svelte";
    import {setContext} from "svelte";
    import ContextMenu from "$lib/components/ContextMenu.svelte";

    let { data, children } = $props();
    setContext("actiondump", {
        actiondump: (() => data.actiondump)()
    })
</script>

<TopBar></TopBar>

<div class="main-content" style="height: calc(100% - 42px)">
    {@render children?.()}
</div>

<ContextMenu></ContextMenu>
