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
            name: string,
            selected: boolean
        }[],
        oninput: (name: string) => void
    } = $props();

    let optionsVisible = $state(false);

    function clickOutside() {
        optionsVisible = false;
        value = selectedOption.text;
    }

    onMount(() => {
        document.addEventListener("click", clickOutside);

        return () => {
            document.removeEventListener("click", clickOutside);
        }
    });

    let selectedOption = $derived(options.find(o => o.selected));
    let value = $derived(selectedOption?.text ?? "");

    function filter() {
        if (value == "" || selectedOption?.text?.toLowerCase() == value.toLowerCase()) {
            return options;
        }
        return options.filter(v => v.text.toLowerCase().includes(value.toLowerCase()) || v.name.toLowerCase().includes(value.toLowerCase()));
    }

    let visibleOptions = $derived.by(filter);

    function clickedOption(option) {
        optionsVisible = false;
        value = option.text;
        oninput(option.name);
    }
</script>

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