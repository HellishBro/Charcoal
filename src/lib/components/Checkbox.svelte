<script lang="ts">
    let {
        id,
        name,
        checked = $bindable()
    }: {
        id: string,
        name: string,
        checked: boolean,
    } = $props();

    let checked_ = $state(checked);

    $effect(() => {
        checked_ = checked;
    })

    function click() {
        checked_ = !checked_;
        checked = checked_;
    }
</script>

<div style="position: relative; width: 40px; height: 40px">
    <div
            class={checked_ ? 'checkbox checked' : 'checkbox unchecked'}
            style="position: absolute; left: 0; top: 0; margin: 0"
            onclick={click}
            {id}
            role="checkbox"
            tabindex="0"
            aria-checked={checked_}
            onkeydown={(event: KeyboardEvent) => {
                if (event.key === "Enter" || event.key === "Space") {
                    click();
                }
            }}
    >{checked ? "1" : "0"}</div>
    <input
            type="checkbox"
            {name}
            style="position: absolute; opacity: 0; height: 0; width: 0;"
    />
</div>