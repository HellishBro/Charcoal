<script lang="ts">
    import { onMount } from "svelte";

    let allThemes: string[] = $state([]);
    let theme = $state("");

    onMount(() => {
        theme = window.localStorage.getItem('theme') ?? "light";
        fetch("/themes.json").then((res) => res.json()).then((allowedThemes: { [key: string]: string }) => {
            allThemes = allowedThemes;
        });
    });

    function toggleTheme() {
        let selected = document.getElementById("themeSelector").value as string;
        window.localStorage.setItem('theme', selected);
        setTheme(selected);
        theme = selected;
    }

    function setTheme(theme) {
        document.getElementById("themeLinkElement").href = "/theme_" + theme + ".css";
    }
</script>

<nav>
    <a href="/">Charcoal</a>
    <a href="/about">About</a>
    <a href="/editor">Editor</a>
    <div style="position: absolute; top: 0; right: 10px; display: flex; align-items: center;">
        <label for="themeSelector" style="display: inline; margin-right: 5px">Theme:</label>
        <select
                onchange={toggleTheme}
                style="background: var(--primary); color: var(--text-primary); display: inline"
                id="themeSelector"
        >
            {#each Object.entries(allThemes) as thisTheme}
                <option name="{thisTheme[0]}" value="{thisTheme[0]}" selected={theme === thisTheme[0]}>{thisTheme[1]}</option>
            {/each}
        </select>
    </div>
</nav>

<style>
    nav a {
        padding-left: 10px;
        padding-right: 10px;
    }

    nav {
        margin: 0;
    }
</style>