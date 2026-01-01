<script lang="ts">
    import { fastRender as fastRenderMM, render as renderMM } from "$lib/minimessage";

    let { mm }: { mm: string } = $props();
</script>

{#await renderMM(mm)}
    {@html fastRenderMM(mm)}
{:then html}
    {@html html}
{/await}