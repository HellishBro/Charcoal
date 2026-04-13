<script lang="ts">
    import Editor from "$lib/components/editor/Editor.svelte";
    import type { EditorSessionState } from "$lib/components/editor/editor-state";

    let {data} = $props();

    let containerWidth: number = $state(0);
    let containerHeight: number = $state(0);
    let editorState: EditorSessionState | null = $state(null);

    function handleEditorStateChange(nextState: EditorSessionState) {
        editorState = nextState;
    }
</script>

<svelte:head>
    <title>Charcoal | Editor</title>
    <meta name="description" content="Create and share DiamondFire code with each other or for yourself." />
</svelte:head>

<div style="width: 100%; height: 100%" bind:offsetWidth={containerWidth} bind:offsetHeight={containerHeight}>
    <Editor
            template={data.templateData}
            {editorState}
            onStateChange={handleEditorStateChange}
            {containerWidth}
            {containerHeight}
    ></Editor>
</div>
