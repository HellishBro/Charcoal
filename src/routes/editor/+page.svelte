<script lang="ts">
    import Editor from "$lib/components/editor/Editor.svelte";
    import type { EditorSessionState } from "$lib/components/editor/editor-state";
    import type { TabsState } from "$lib/components/editor/tabs-state";
    import { createDefaultTabsState, getActiveTab, addTab, removeTab, switchTab, updateTabState } from "$lib/components/editor/tabs-state";

    let {data} = $props();

    let containerWidth: number = $state(0);
    let containerHeight: number = $state(0);
    
    let tabsState = $state<TabsState | null>(null);

    $effect.pre(() => {
        if (!tabsState) {
            tabsState = createDefaultTabsState(data.templateData ?? "");
        }
    });

    function handleEditorStateChange(nextState: EditorSessionState) {
        const activeTab = getActiveTab(tabsState!);
        if (activeTab) {
            tabsState = updateTabState(tabsState!, activeTab.id, nextState, nextState.templateEncoded);
        }
    }

    function handleCreateTab() {
        tabsState = addTab(tabsState!);
    }

    function handleSwitchTab(tabId: string) {
        tabsState = switchTab(tabsState!, tabId);
    }

    function handleCloseTab(tabId: string) {
        tabsState = removeTab(tabsState!, tabId);
    }

    let activeTab = $derived(tabsState ? getActiveTab(tabsState) : null);
</script>

<svelte:head>
    <title>Charcoal | Editor</title>
    <meta name="description" content="Create and share DiamondFire code with each other or for yourself." />
</svelte:head>

<div style="width: 100%; height: 100%; display: flex; flex-direction: column;" bind:offsetWidth={containerWidth} bind:offsetHeight={containerHeight}>
    {#if tabsState}
        <!-- Tabs Bar -->
        <div style="display: flex; gap: 8px; padding: 8px; background-color: var(--background-secondary, #2a2a2a); border-bottom: 1px solid var(--background-tertiary, #3a3a3a); overflow-x: auto; align-items: center;">
            {#each tabsState.tabs as tab (tab.id)}
                <div
                        style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background-color: {tab.id === tabsState.activeTabId ? 'var(--primary, #0066cc)' : 'var(--background-tertiary, #3a3a3a)'}; color: white; border-radius: 4px; cursor: pointer; white-space: nowrap;"
                        onclick={() => handleSwitchTab(tab.id)}
                        onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSwitchTab(tab.id);
                            }
                        }}
                        role="button"
                        tabindex="0"
                >
                    <span>{tab.name}</span>
                    {#if tabsState.tabs.length > 1}
                        <button
                                style="padding: 2px 6px; background-color: transparent; color: white; border: none; cursor: pointer; font-size: 12px; line-height: 1; margin-left: 4px;"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    handleCloseTab(tab.id);
                                }}
                                title="Close tab"
                        >
                            ✕
                        </button>
                    {/if}
                </div>
            {/each}
            <button
                    style="padding: 8px 12px; background-color: var(--background-tertiary, #3a3a3a); color: white; border: none; border-radius: 4px; cursor: pointer;"
                    onclick={handleCreateTab}
                    title="Create new tab"
            >
                + New Tab
            </button>
        </div>

        <!-- Editor Container -->
        <div style="flex: 1; min-height: 0;">
            {#key tabsState.activeTabId}
                {#if activeTab}
                    <Editor
                            template={activeTab.template}
                            editorState={activeTab.editorState}
                            onStateChange={handleEditorStateChange}
                            containerWidth={containerWidth}
                            containerHeight={containerHeight - 50}
                    ></Editor>
                {/if}
            {/key}
        </div>
    {/if}
</div>

