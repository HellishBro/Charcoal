<svelte:head>
    <title>Charcoal | Index</title>
    <meta name="description" content="Charcoal is the best external workstation for DiamondFire!" />
</svelte:head>

<h1>Charcoal</h1>
<div class="container">
    <a href="/editor" class="card">
        <div class="image">
            <img src="/images/example_template.png" alt="" style="width: 90%;" />
        </div>
        <div>
            <h2>Editor</h2>
            <p>Edit and create templates, with easy import and export features.</p>
        </div>
    </a>
    <a href="/about" class="card">
        <div class="image">
            <img src="/images/diamondfire_and_charcoal.png" alt="" style="width: 100%;" />
        </div>
        <div>
            <h2>About</h2>
            <p>Charcoal's goals, objectives, and what it does.</p>
        </div>
    </a>
    <a href="https://github.com/HellishBro/Charcoal/issues" class="card">
        <div>
            <h2>Issue Tracker</h2>
            <p>Report bugs, issues, glitches, et cetera, to here.</p>
        </div>
    </a>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 20px;
        padding: 20px;
        width: 100%;
        box-sizing: border-box;
        overflow-y: hidden;
        height: 100%;
        margin-bottom: 20px;
    }

    a.card {
        display: grid;
        grid-template-rows: 1fr 1fr;
        height: 100%;
        overflow: hidden;
    }

    .image {
        background: var(--background-secondary);
        border-radius: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: relative;
    }

    .image img {
        object-fit: contain;
        width: 100%;
    }
</style>