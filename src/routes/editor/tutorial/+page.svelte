<script lang="ts">
	import {blur} from 'svelte/transition';
    import {getTemplateData} from "$lib/templatedata.ts";
    import {toURLSafeB64} from "$lib/utils.ts";
    import CodeBlock from "$lib/components/CodeBlock.svelte";

    const MAX_STEPS = 5;

    let currentStep = $state(1);
    let codetemplatedata = $state('');
    let { valid, templateUrl, message } = $derived.by(() => {
        
        const response = getTemplateData(codetemplatedata);

        if (response.status === "success") {
            return { valid: true, templateUrl: toURLSafeB64(response.templateObject.encodeTemplate()), message: null };
        } else {
            return { valid: false, templateUrl: null, message: response.message };
        }
    });
    let prevEnabled = $derived.by(() => currentStep > 1);
    let nextEnabled = $derived.by(() => {
        if (currentStep === 4) {
            return valid;
        }
        return currentStep < MAX_STEPS;
    });
</script>

<svelte:head>
    <title>Charcoal | Import Tutorial</title>
    <meta name="description" content="Walkthrough of how to import code" />
</svelte:head>

<svelte:window onkeydown={(e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
        if (prevEnabled) currentStep--;
    }
    if (e.key === "ArrowRight") {
        if (nextEnabled) currentStep++;
    }
}}></svelte:window>

{#snippet step(i)}
    {#key i}
        <div in:blur={{ duration: 300 }}>
            <h2>Step {i}</h2>
            {#if i === 1}
                <p>This is tutorial will walk through the steps of sharing a code template.</p>
                <p>Press Next to continue.</p>
            {:else if i === 2}
                <p>Shift+right click the start of the Function/Event you'd like to share.</p>
                <img src="/images/tutorial/linestarter.png" alt="" style="width: 20%;" />
                <p>This should give you a code template item.</p>
                <img src="/images/tutorial/template_item.png" alt="" style="width: 40%;" />
            {:else if i === 3}
                <p>Hold the code template item in your hand and type <code>/item nbt</code>. Open chat, hover over the blue <code>hypercube:codetemplatedata</code> section, and press "Copy Text"</p>
                <img src="/images/tutorial/codetemplatedata.png" alt="" style="width: 50%;" />
            {:else if i === 4}
                <p>Paste it here:</p>
                <input class="nbt-input" type="text" name="" id="" bind:value={codetemplatedata} onkeydown={e => {e.stopPropagation()}} />
                {#if codetemplatedata === ""}
                    <p in:blur={{ duration: 300 }}>No NBT input</p>
                {:else if !valid}
                    <p in:blur={{ duration: 300 }}>Invalid NBT input. {message}</p>
                {:else}
                    <p in:blur={{ duration: 300 }}>Valid NBT input! Press Next.</p>
                {/if}
            {:else if i === 5}
                <p>Share the following link: </p>
                <CodeBlock inner={`https://charcoal-env.xyz/editor?template=${templateUrl}`}></CodeBlock>
                <br />
                <p>If sharing on Discord, use this embedded link:</p>
                <CodeBlock inner={`[code template](https://charcoal-env.xyz/editor?template=${templateUrl})`}></CodeBlock>
                <!-- open link in new tab -->
                <p><a href={"https://charcoal-env.xyz/editor?template=" + templateUrl} target="_blank" rel="noopener noreferrer">Open in Charcoal Editor</a></p>
            {/if}
        </div>
    {/key}
{/snippet}

<div class="container">
    <h1>Import a Code Template</h1>
    
    {@render step(currentStep)}

    <div class="stepper">
        <button type="button" onclick={() => currentStep -= 1} disabled={!prevEnabled}>Previous</button>
        <button type="button" onclick={() => currentStep += 1} disabled={!nextEnabled}>Next</button>
    </div>
</div>

<style>
    .stepper {
        display: flex;
        justify-content: space-between;
    }

    a {
        text-decoration: underline;
    }
</style>