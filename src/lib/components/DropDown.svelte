<script lang="ts">
    import {onMount} from "svelte";

    let {
        name,
        id,
        options,
        oninput
    }: {
        name: string,
        id: string,
        options: {
            text: string,
            name: string | null,
            selected: boolean
        }[],
        oninput: (name: string | null) => void
    } = $props();

    let optionsVisible = $state(false);
    let containerElement: HTMLDivElement | null = $state(null);

    function clickOutside(event: MouseEvent) {
        const target = event.target as Node;
        if (containerElement && !containerElement.contains(target)) {
            optionsVisible = false;

            if (selectedOption) {
                value = selectedOption.text;
            }
        }
    }

    onMount(() => {
        document.addEventListener("click", clickOutside);

        return () => {
            document.removeEventListener("click", clickOutside);
        }
    });

    let selectedOption = $derived(options?.find(o => o?.selected));
    let value = $state("");

    $effect(() => {
        if (!optionsVisible) {
            value = selectedOption?.text ?? "";
        }
    });

    function filter() {
        if (!options || !Array.isArray(options)) {
            return [];
        }
        if (value === "" || selectedOption?.text?.toLowerCase() === value.toLowerCase()) {
            return options;
        }
        return options.filter(v => {
            if (!v) return false;
            const textMatch = v.text?.toLowerCase().includes(value.toLowerCase()) || false;
            const nameMatch = v.name?.toString().toLowerCase().includes(value.toLowerCase()) || false;
            return textMatch || nameMatch;
        });
    }

    let visibleOptions = $derived.by(filter);

    function clickedOption(option: any) {
        optionsVisible = false;
        if (option && option.text) {
            value = option.text;
            oninput(option.name ?? "");
        }
    }
</script>

<div bind:this={containerElement}>
    <input
            name={name}
            id={id}
            onclick={e => {
                e.stopPropagation();
                optionsVisible = true;
            }}
            bind:value={value}
    />

    {#if optionsVisible}
        <div class="input-like" style="display: flex; flex-direction: column; max-height: 250px; overflow-y: scroll; padding: 7px 0 0 0;">
            {#each visibleOptions as visibleOption, index}
                <div
                        style="color: var(--text); padding: 7px 10px; cursor: pointer; border-bottom: 1px solid var(--text);"
                        role="option"
                        tabindex={index}
                        aria-selected={visibleOption.selected}
                        onclick={() => {
                            clickedOption(visibleOption);
                        }}
                        onkeydown={e => {
                            if (e.key === "Enter" || e.key === "Space") {
                                clickedOption(visibleOption);
                            }
                        }}
                >{visibleOption.text}</div>
            {/each}
        </div>
    {/if}
</div>