<script lang="ts">
    import TopBar from "$lib/components/TopBar.svelte";
    import {setContext} from "svelte";
    import ContextMenu from "$lib/components/ContextMenu.svelte";
    import { onNavigate } from '$app/navigation';

    let { data, children } = $props();
    setContext("actiondump", {
        actiondump: (() => data.actiondump)()
    });

    onNavigate((navigation) => {
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });

    let windowWidth = $state(0);
    let windowHeight = $state(0);

    $effect(() => {
        isMobile.isMobile = windowHeight == 0 ? false : windowWidth / windowHeight <= 9 / 10;
    });
    let isMobile = $state({
        isMobile: false
    });
    setContext("mobile", isMobile);
</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight}></svelte:window>

<TopBar></TopBar>

<div class="main-content" style={{"height": isMobile.isMobile ? "100%" : "calc(100% - 42px)"}}>
    {@render children?.()}
</div>

<ContextMenu></ContextMenu>
