<script module lang="ts">
    export type Option = {
        label?: string,
        image?: string,
        tooltip: string,
        callback: () => {
            options: Option[],
            flexDirection?: string,
            openLeft?: boolean,
            openUp?: boolean,
            maxWidth?: number | string
        } | null,
    }

    let visible = $state(false);
    let x = $state(0);
    let y = $state(0);
    let options = $state([]);
    let flexDirection = $state("column");
    let openLeft = $state(false);
    let openUp = $state(false);

    export function setContextMenu(event: PointerEvent, options_: Option[], flexDirection_: string = "column", openLeft_?: boolean, openUp_?: boolean) {
        visible = true;
        x = event.clientX;
        y = event.clientY;
        options = options_;
        flexDirection = flexDirection_;
        openLeft = openLeft_ ?? (x > window.innerWidth / 2);
        openUp = openUp_ ?? (y > window.innerHeight / 2);
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import MiniMessageRenderer from "$lib/components/MiniMessageRenderer.svelte";

    let contextMenu: HTMLDivElement | null = $state(null);

    function escape(event: KeyboardEvent) {
        if (contextMenu) {
            if (event.key === "Escape") {
                visible = false;
            }
        }
    }

    function oncontextmenu(event: PointerEvent) {
        event.preventDefault();
    }

    onMount(() => {
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("keydown", escape);
        };
    });

    let actualX = $derived.by(() => {
        if (openLeft) {
            return x - (contextMenu ? contextMenu.offsetWidth : 0);
        } else {
            return x;
        }
    });
    let actualY = $derived.by(() => {
        if (openUp) {
            return y - (contextMenu ? contextMenu.offsetHeight : 0);
        } else {
            return y;
        }
    })
</script>

{#if visible}
    <div
            role="presentation"
            onclick={() => visible = false}
            style="position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; overflow: hidden;"
            oncontextmenu={e => {
                visible = false;
                e.preventDefault();
            }}
    ></div>
    <div class="context-menu" bind:this={contextMenu} style="left: {actualX}px; top: {actualY}px; flex-direction: {flexDirection}; gap: {flexDirection === 'column' ? 2 : 5}px;" role="presentation" {oncontextmenu}>
        {#each options as option, idx}
            <button
                    title={option.tooltip}
                    onclick={e => {
                        e.stopPropagation();
                        let newCM = option.callback();
                        if (newCM) {
                            options = newCM.options;
                            flexDirection = newCM.flexDirection ?? flexDirection;
                            openLeft = newCM.openLeft ?? openLeft;
                            openUp = newCM.openUp ?? openUp;
                        } else {
                            visible = false;
                        }
                    }}
                    class="context-menu-item"
                    {oncontextmenu}
            >
                {#if option.label}
                    <MiniMessageRenderer mm={option.label}></MiniMessageRenderer>
                {:else}
                    <img src={option.image} alt={option.tooltip} style="height: 2em;" />
                {/if}
            </button>
        {/each}
    </div>
{/if}

<style>
    .context-menu {
        display: flex;
        z-index: 10000;
        position: fixed;
        background: var(--cool-dark);
        border: 3px solid var(--cool-black);
        border-radius: 5px;
        padding: 10px;
        margin: 0;
        flex-wrap: wrap;
        max-width: max(25vw, 250px);
    }
    .context-menu-item {
        color: var(--text-cool);
        display: block;
        background: none;
        box-shadow: none;
        padding: 0;
        text-align: left;
    }
</style>