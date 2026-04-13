<script lang="ts">
    import { browser } from "$app/environment";
    import Editor from "$lib/components/editor/Editor.svelte";
    import type { EditorSessionState } from "$lib/components/editor/editor-state";
    import type { TabsState } from "$lib/components/editor/tabs-state";
    import { 
        createDefaultTabsState, 
        createDefaultTab,
        getActiveTab, 
        addTab, 
        removeTab, 
        switchTab, 
        updateTabState 
    } from "$lib/components/editor/tabs-state";
    import { toURLSafeB64 } from "$lib/utils";
    import { replaceState } from "$app/navigation";
    import { getTemplateData } from "$lib/templatedata";

    let { data } = $props();

    let containerWidth: number = $state(0);
    let containerHeight: number = $state(0);
    
    let tabsState = $state<TabsState | null>(null);
    let isInitialized = $state(false);

    $effect.pre(() => {
        if (tabsState) return; // Already initialized

        // Initialize tabs state from URL parameters
        if (data.initialTemplates?.length) {
            const tabs = data.initialTemplates.map((template: string) => createDefaultTab(template));
            tabsState = {
                tabs,
                activeTabId: tabs[0]?.id ?? ""
            };
        } else {
            tabsState = createDefaultTabsState(data.templateData);
        }
        isInitialized = true;
    });

    function handleEditorStateChange(nextState: EditorSessionState) {
        const activeTab = getActiveTab(tabsState!);
        if (!activeTab) return;

        // Update tab state - URL will be updated by reactive effect
        const templateResult = getTemplateData(nextState.templateEncoded);
        if (templateResult.status === "success") {
            const newTemplateJSON = JSON.stringify(templateResult.templateObject.toJSON());
            tabsState = updateTabState(tabsState!, activeTab.id, nextState, newTemplateJSON);
        }
    }

    function buildURLParams(state: TabsState): URLSearchParams {
        const params = new URLSearchParams(browser ? window.location.search : "");
        
        if (state.tabs.length === 1) {
            const result = getTemplateData(state.tabs[0]!.template);
            if (result.status === "success") {
                params.set("template", toURLSafeB64(result.templateObject.encodeTemplate()));
            } else {
                params.delete("template");
            }
            params.delete("templates");
        } else {
            const templates = state.tabs
                .map(tab => {
                    const result = getTemplateData(tab.template);
                    return result.status === "success" ? toURLSafeB64(result.templateObject.encodeTemplate()) : "";
                })
                .filter(t => t)
                .join('|');
            
            if (templates) {
                params.set("templates", templates);
            } else {
                params.delete("templates");
            }
            params.delete("template");
        }

        return params;
    }

    function updateURLState() {
        if (!browser || !tabsState || !isInitialized) return;

        try {
            const params = buildURLParams(tabsState);
            const loc = new URL(window.location.href);
            loc.search = params.toString();
            replaceState(loc, null);
        } catch (error) {
            // Silently ignore if router isn't ready yet
            console.debug("URL update deferred", error);
        }
    }

    // Update URL reactively when tabs state changes
    $effect(() => {
        if (tabsState) {
            updateURLState();
        }
    });

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
        <div style="display: flex; gap: 6px; padding: 12px; background-color: var(--background-secondary, #2a2a2a); border-bottom: 1px solid var(--background-tertiary, #3a3a3a); overflow-x: auto; align-items: center; border-radius: 15px 15px 0 0;">
            {#each tabsState.tabs as tab (tab.id)}
                <div
                        style="display: flex; align-items: center; gap: 6px; padding: 10px 14px; background-color: {tab.id === tabsState.activeTabId ? 'var(--primary, #0066cc)' : 'var(--background-tertiary, #3a3a3a)'}; color: white; border-radius: 8px; cursor: pointer; white-space: nowrap; min-height: 40px; box-shadow: {tab.id === tabsState.activeTabId ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'}; transition: all 0.15s ease;"
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
                    <!-- Icon placeholder for consistent height -->
                    <div style="width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
                        {#if tab.icon}
                            <img src={tab.icon} alt="" width="18" height="18" style="border-radius: 3px;" />
                        {:else}
                            <!-- Invisible placeholder to maintain height -->
                            <div style="width: 18px; height: 18px;"></div>
                        {/if}
                    </div>
                    
                    {#if !tab.showOnlyIcon}
                        <span style="font-weight: {tab.id === tabsState.activeTabId ? '500' : '400'}; opacity: {tab.name ? '1' : '0.7'};">
                            {tab.name || 'New Tab'}
                        </span>
                    {/if}
                    
                    {#if tabsState.tabs.length > 1}
                        <button
                                style="padding: 2px 6px; background-color: transparent; color: white; border: none; cursor: pointer; font-size: 12px; line-height: 1; margin-left: 4px; opacity: 0.7; border-radius: 3px; transition: opacity 0.15s ease;"
                                onmouseenter={(e) => e.target.style.opacity = '1'}
                                onmouseleave={(e) => e.target.style.opacity = '0.7'}
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
                    style="padding: 10px 14px; background-color: var(--background-tertiary, #3a3a3a); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.15s ease; min-height: 40px;"
                    onmouseenter={(e) => e.target.style.backgroundColor = 'var(--background-primary, #4a4a4a)'}
                    onmouseleave={(e) => e.target.style.backgroundColor = 'var(--background-tertiary, #3a3a3a)'}
                    onclick={handleCreateTab}
                    title="Create new tab"
            >
                + New Tab
            </button>
        </div>

        <!-- Editor Container -->
        <div style="flex: 1; min-height: 0; background-color: var(--background-secondary, #2a2a2a); border-radius: 0 0 15px 15px; overflow: hidden;">
            {#key tabsState.activeTabId}
                {#if activeTab}
                    <div style="height: 100%; border-radius: 0;">
                        <Editor
                                template={activeTab.template}
                                editorState={activeTab.editorState}
                                onStateChange={handleEditorStateChange}
                                containerWidth={containerWidth}
                                containerHeight={containerHeight - 70}
                        ></Editor>
                    </div>
                {/if}
            {/key}
        </div>
    {/if}
</div>

