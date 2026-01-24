<script lang="ts">
    import { Canvas } from "@threlte/core";
    import CodeRendererInside from "$lib/components/editor/CodeRendererInside.svelte";
    import { setInspectorObjects } from "$lib/components/editor/Inspector.svelte";
    import { Tween } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { WebGLRenderer } from "three";

    let { template, clickChest, editBlockIndex = $bindable(), updateTemplateJSON } = $props();
    let cameraX = new Tween(0, {
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
    let cameraZoom = $state(new Tween(0, {
        duration: 500,
        easing: cubicOut
    }));

    let divElement = $state(null);
    let maxX = $state(0);

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
    }
</script>

<div onwheel={ev => {
    let dy = ev.deltaY > 0 ? 1 : -1;
    if (ev.shiftKey) {
        dy *= 0.25;
    }
    if (ev.ctrlKey) {
        cameraZoom.target += dy;
    } else {
        cameraX.target = Math.max(Math.min(cameraX.target + dy, maxX), -2);
    }
    ev.preventDefault();
}} style="height: 100%" onclick={() => {
    editBlockIndex = -1;
    setInspectorObjects(null);
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
                {template}
                {cameraX}
                {cameraY}
                {cameraZ}
                {cameraZoom}
                {clickChest}
                {divElement}
                {updateTemplateJSON}
        ></CodeRendererInside>
    </Canvas>
</div>