<script lang="ts">
    import {getContext, onMount} from "svelte";

    let actiondump = getContext("actiondump").actiondump;

    let id = $state(0);
    let {data} = $props();

    function updateTime() {
        id = requestAnimationFrame(updateTime);
        let now = Date.now() / 1000;
        for (let element of document.getElementsByClassName("ago")) {
            let ago = now - parseFloat(element.getAttribute("data-time"));
            let years = Math.floor(ago / (365 * 24 * 3600));
            let months = Math.floor(ago / (30 * 24 * 3600)) % 12;
            let days = Math.floor(ago / (24 * 3600)) % 30;
            let hours = Math.floor(ago / 3600) % 24;
            let minutes = Math.floor(ago / 60) % 60;
            let seconds = ago % 60;
            let text = [];
            if (years) text.push(`${years} year` + (years == 1 ? "" : "s"));
            if (months) text.push(`${months} month` + (months == 1 ? "" : "s"));
            if (days) text.push(`${days} day` + (days == 1 ? "" : "s"));
            if (hours) text.push(`${hours} hour` + (hours == 1 ? "" : "s"));
            text.push(`${minutes} minute` + (minutes == 1 ? "" : "s"));
            text.push(`and ${seconds.toFixed(3)} second` + (seconds == 1 ? "" : "s"));
            element.innerText = text.join(", ") + " ago";
        }
    }

    onMount(() => {
        id = requestAnimationFrame(updateTime);
        return () => {
            cancelAnimationFrame(id);
        }
    });
</script>

<svelte:head>
    <title>Charcoal | About</title>
    <meta name="description" content="About Charcoal: the best external workstation for DiamondFire." />
</svelte:head>

<h1 id="about"><a href="#about">About</a></h1>
<p>
    <span style="font-size: 1.5em">One app to rule them all.</span>
    Charcoal is a unified external workstation for <a href="#diamondfire">DiamondFire</a>, bringing compatibility across a wide domain of tools.
</p>
<p>Although, Charcoal is still in its infancy. Right now, the only available tool is the <a href="/editor">Template Editor</a>.</p>
<h2 id="history"><a href="#history">History</a></h2>
<p>
    This idea was seeded during the <strong>November 2025 Game Jam</strong>, where a workflow problem caused several delays to the overall development time of <a href="#me">my</a> team's game.
    As a result of this workflow issue, I was the only person who was able to do a routine deployment task.
    Upon explaining my convoluted workflow, my teammate became more confused than ever, to the point of a mental shutdown.
    Post jam, upon my reflection of the jam process, I've identified a key issue with the external DiamondFire development ecosystem:
    beyond the unofficial semi-standard <a href="#codeclient">mod</a> and its archived <a href="#recode">predecessor</a>, there are no other methods of communication.
    Each tool has its own user interface, all different from the other, and even some have broken CSS.
    The external DiamondFire ecosystem is filled with abandonware and largely incompatible tools.
</p>
<p>
    This allowed me to create Charcoal. The first attempt to unify the DiamondFire ecosystem. Archiving and publishing information and tools.
    Transforming the workflow of a tool-integrated DiamondFire developer. This project was started on December 3rd, 2025, so <span class="ago" data-time={1764768387}></span>.
</p>
<p>
    For this project, I decided to learn <a href="https://svelte.dev">Svelte</a> and <a href="https://www.typescriptlang.org/">TypeScript</a> instead of sticking to <a href="https://flask.palletsprojects.com/en/stable/">Flask</a> and <a href="https://www.python.org">Python</a>.
    Using Svelte and TypeScript enabled me to write faster code &mdash; and plus, it was a learning opportunity.
    I've heard about Svelte from the <a href="#dfonline">DFOnline</a> project, so I decided to give it a try.
</p>
<p>
    As of December 31st, 2025 (<span class="ago" data-time={1767179397}></span>), the <a href="/editor">Template Editor</a> is now complete.
</p>
<h2 id="roadmap"><a href="#roadmap">Roadmap</a></h2>
<p>
    The current roadmap includes: in-depth documentation for all DiamondFire actions; a structured data importer; miscellaneous branding elements; package manager and integration with CodeVault; and a domain-specific language.
</p>
<p>
    These goals are also a reason why the Charcoal project exists &mdash; to ensure consistency and ease-of-use between the different tools.
</p>
<h1 id="diamondfire"><a href="#diamondfire">DiamondFire</a></h1>
<p>
    DiamondFire (<a href="https://discord.gg/pDHBbBD">Discord server</a>, or <a href="https://www.mcdiamondfire.com/">Minecraft server IP</a>),
    is a Minecraft server where one can create games and other forms of programming arts in a vanilla Minecraft setting, using DiamondFire's own proprietary plugin, Hypercube.
    DiamondFire founded its own genre of Minecraft servers, with an exonym of "Creative+", approximately <span class="ago" data-time={1418840496}></span>.
    In DiamondFire, players use code blocks and actions in a sequence to create logic,
    akin to <a href="https://scratch.mit.edu">Scratch</a> or <a href="https://snap.berkeley.edu/">Snap!</a> (in fact, DiamondFire was featured at the <a href="https://www.youtube.com/watch?v=dOwVrUT8vck">Scratch 2017 Conference</a> and the <a href="https://www.youtube.com/watch?v=JB1RXvOJ-iw">Snapcon 2020</a>).
</p>
<p>
    As one can imagine, creating any sort of complex games or algorithms in Minecraft code blocks is a difficult task, especially with the inherent unfriendly interface of Minecraft.
    As a result, many DiamondFire players had built external tools that integrates with the server itself, assisting their coding on the server.
</p>
<h2 id="dfonline"><a href="#dfonline">DFOnline</a></h2>
<p>
    <a href="https://dfonline.dev">DFOnline</a> is a website dedicated to viewing DiamondFire code templates. It was created December 5th, 2021 &mdash; <span class="ago" data-time={1638724212}></span>.
    In addition, it provided import and export functionalities, using the lineage of <a href="#recode">Recode</a>, and now, more contemporary, <a href="#codeclient">CodeClient</a>.
</p>
<p>
    DFOnline can be thought of as the competitor to Charcoal &mdash; or, rather, Charcoal can be thought of as the competitor to DFOnline.
    However, that only applies to the <a href="/editor">Template Editor</a>.
    One of the goals of the Charcoal project is to ensure that any tasks from the previous scattered ecosystem of DiamondFire can be accomplished,
    and DFOnline is a good baseline for that metric.
</p>
<h2 id="codeclient"><a href="#codeclient">CodeClient</a></h2>
<p>
    <a href="https://github.com/DFOnline/CodeClient">CodeClient</a> is a client-side mod for DiamondFire. Started on December 22nd, 2022 (<span class="ago" data-time={1671711964}></span>),
    originally just a "DiamondFire utility client for advanced coding", it quickly turned into a must-have for DiamondFire players.
    Currently, it is the only way to beam code templates to DiamondFire, which is done with a WebSocket connection.
</p>
<p>
    Currently, the <a href="/editor">Template Editor</a> uses CodeClient API to export templates.
</p>
<h2 id="recode"><a href="#recode">Recode</a></h2>
<p>
    <a href="https://github.com/homchom/recode">Recode</a> is an archived mod for DiamondFire.
    It was created on May 1st, 2022, <span class="ago" data-time={1651365142}></span>, as the successor of <a href="#codeutilities">CodeUtilities</a>.
    It was the de-facto standard mod for DiamondFire, and almost every external tool used this mod to send templates to the game.
</p>
<h2 id="codeutilities"><a href="#codeutilities">CodeUtilities</a></h2>
<p>
    <a href="https://github.com/CodeUtilities/CodeUtilities">CodeUtilities</a> is the predecessor to <a href="#recode">Recode</a>.
    Open-sourced on February 13th, 2022, <span class="ago" data-time={1644770702}></span>, it reached its End-of-Life on August 20th, 2022, <span class="ago" data-time={1661006742}></span>.
    It was succeeded by <a href="#recode">Recode</a> and CodeUtilities-2.0, which was later abandoned on April 24th, 2022, <span class="ago" data-time={1650779446}></span>.
</p>
<h1 id="credits"><a href="#credits">Credits</a></h1>
<h2 id="me"><a href="#me">I</a></h2>
<p>
    First and foremost, thank you for using my little program! My name is TempestTempus, also known as HellishBro.
    You can find me on <a href="https://discordapp.com/users/812125215051743282">Discord</a>.
</p>
<h2 id="circ"><a href="#circ">Circuitweaver</a></h2>
<p>
    rawr :3
</p>
<p>
    - Circuitweaver (aka. AussieBox)
</p>
<h1 id="info"><a href="#info">Miscellaneous Information</a></h1>
<h2 id="actiondump"><a href="#actiondump">Actiondump Well-Being</a></h2>
<p>
    Currently, there are {Object.keys(actiondump.actions_category_reverse_map).length} actions on DiamondFire as of <span class="ago" data-time={actiondump.time}></span>.
</p>

<style>
    p a {
        text-decoration: underline;
    }

    .ago {
        font-family: "minecraftSeven", monospace;
        font-size: 0.8em;
    }
</style>