<script lang="ts">
    import { Canvas } from "@threlte/core";
    import type { Template } from "$lib/diamondfire";
    import CodeRendererInside from "$lib/components/editor/CodeRendererInside.svelte";
    import type { EditorRendererState, InspectorObject } from "$lib/components/editor/editor-state";
    import { Tween } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { WebGLRenderer } from "three";

    let {
        template,
        clickChest,
        editBlockIndex = $bindable(),
        updateTemplateJSON,
        clearInspector,
        setInspectorObjects,
        rendererState = $bindable()
    }: {
        template: Template,
        clickChest: (index: number) => void,
        editBlockIndex: number,
        updateTemplateJSON: () => void,
        clearInspector: () => void,
        setInspectorObjects: (iO: InspectorObject[][] | null) => void,
        rendererState: EditorRendererState
    } = $props();

    let cameraX = new Tween(rendererState.cameraXTarget, {
        duration: 500,
        easing: cubicOut
    });
    let cameraY = $state(new Tween(0, {
        duration: 500,
        easing: cubicOut
    }));
    let cameraZ = $state(new Tween(0, {
        duration: 500,
        easing: cubicOut
    }));
    let cameraZoom = $state(new Tween(rendererState.cameraZoomTarget, {
        duration: 500,
        easing: cubicOut
    }));

    let divElement: HTMLDivElement | null = $state(null);
    let maxX = $state(0);

    $effect(() => {
        if (rendererState.cameraXTarget !== cameraX.target) {
            cameraX.target = rendererState.cameraXTarget;
        }
        if (rendererState.cameraZoomTarget !== cameraZoom.target) {
            cameraZoom.target = rendererState.cameraZoomTarget;
        }
    });

    let lastTouchPosition: [number, number] = $state([0, 0]);
    function touchStart(event: TouchEvent) {
        let touch = event.changedTouches[0];
        lastTouchPosition = [touch.clientX, touch.clientY];
    }
    function touchMove(event: TouchEvent) {
        let touch = event.changedTouches[0];
        let delta = [touch.clientX - lastTouchPosition[0], touch.clientY - lastTouchPosition[1]];
        lastTouchPosition = [touch.clientX, touch.clientY];
        cameraX.target -= delta[0] * 0.02;
        rendererState = {
            ...rendererState,
            cameraXTarget: cameraX.target
        };
    }
</script>

<div onwheel={ev => {
    let dy = ev.deltaY > 0 ? 1 : -1;
    if (ev.shiftKey) {
        dy *= 0.25;
    }
    if (ev.ctrlKey) {
        cameraZoom.target += dy;
        rendererState = {
            ...rendererState,
            cameraZoomTarget: cameraZoom.target
        };
    } else {
        cameraX.target = Math.max(Math.min(cameraX.target + dy, maxX), -2);
        rendererState = {
            ...rendererState,
            cameraXTarget: cameraX.target
        };
    }
    ev.preventDefault();
}} style="height: 100%" onclick={() => {
    editBlockIndex = -1;
    clearInspector();
}} role="presentation" bind:this={divElement}>
    <Canvas createRenderer={(canvas: HTMLCanvasElement) => {
        canvas.addEventListener("touchstart", touchStart);
        canvas.addEventListener("touchmove", touchMove);
        return new WebGLRenderer({
            canvas,
            preserveDrawingBuffer: true,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
    }}>
        <CodeRendererInside
                bind:editBlockIndex
                bind:maxX
                bind:rendererState
                {template}
                {cameraX}
                {cameraY}
                {cameraZ}
                {cameraZoom}
                {clickChest}
                {divElement}
                {setInspectorObjects}
                {updateTemplateJSON}
        ></CodeRendererInside>
    </Canvas>
</div>
