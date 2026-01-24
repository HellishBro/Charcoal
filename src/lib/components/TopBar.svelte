<script lang="ts">
    import {getContext, onMount} from "svelte";
    import { afterNavigate } from "$app/navigation";
    import {slide, crossfade} from "svelte/transition";
    import {Menu} from "@lucide/svelte";

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

    let menuVisible = $state(false);

    afterNavigate(() => {
        menuVisible = false;
    });

    let isMobile: boolean = $derived(getContext("mobile").isMobile);
</script>

{#if isMobile}
    <button onclick={() => menuVisible = !menuVisible} id="hamburgerMenu"><Menu style="width: 1em; height: 1em;"></Menu></button>
{/if}
{#if menuVisible || !isMobile}
    {#if isMobile}
        <div role="presentation" transition:crossfade style="position: fixed; width: 100vw; height: 100vh; z-index: 999; background: rgba(0, 0, 0, 0.2);" onclick={() => {menuVisible = false}}></div>
    {/if}
    <nav class:mobile={isMobile} transition:slide={{axis: "x"}} style="z-index: 1000; height: {menuVisible && isMobile ? '85vh' : 'auto'}; display: relative">
        <ul class:mobile={isMobile}>
            <li><a href="/">Charcoal</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/editor">Editor</a></li>
            <li id="themeSwitcher" style="display: flex;">
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
            </li>
        </ul>
    </nav>
{/if}

<style>
    nav a {
        padding-left: 10px;
        padding-right: 10px;
    }

    nav {
        margin: 0;
    }

    li#themeSwitcher {
        display: block;
        position: absolute;
        top: 0;
        right: 10px;
        align-items: center
    }

    #hamburgerMenu {
        position: absolute;
        margin-left: 10px;
        margin-top: 10px;
        z-index: 998;
        width: 3em;
        height: 3em;
        padding: 0;
        align-items: center;
    }

    .mobile {
        nav& {
            position: fixed;
            flex-direction: column;
            border-radius: 0 12px 12px 0;
        }
        ul& {
            flex-direction: column;
            align-items: center;
            gap: 1.25em;

            & li {
                display: block;

                & a {
                    padding-top: 0.75em;
                    padding-bottom: 0.75em;
                }
            }
        }
        li#themeSwitcher {
            top: auto;
            bottom: 10px;
            left: 10px;
            flex-direction: column;

            & select {
                text-align: center;
            }
        }
    }
</style>