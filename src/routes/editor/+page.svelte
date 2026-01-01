<script>
    import Editor from "$lib/components/editor/Editor.svelte";

    let {data} = $props();
</script>

<svelte:head>
    <title>Charcoal | Editor</title>
    <meta name="description" content="Create and share DiamondFire code with each other or for yourself." />
</svelte:head>

<Editor template={data.templateData}></Editor>