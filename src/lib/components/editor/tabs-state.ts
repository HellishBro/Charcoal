import type { EditorSessionState } from "$lib/components/editor/editor-state";

export type EditorTab = {
    id: string;
    name: string;
    template: string;
    editorState: EditorSessionState | null;
};

export type TabsState = {
    tabs: EditorTab[];
    activeTabId: string;
};

let tabCounter = 0;

function generateTabId(): string {
    return `tab-${Date.now()}-${tabCounter++}`;
}

export function createDefaultTab(template: string = ""): EditorTab {
    return {
        id: generateTabId(),
        name: `Template ${tabCounter}`,
        template,
        editorState: null
    };
}

export function createDefaultTabsState(initialTemplate: string = ""): TabsState {
    const firstTab = createDefaultTab(initialTemplate);
    return {
        tabs: [firstTab],
        activeTabId: firstTab.id
    };
}

export function getActiveTab(state: TabsState): EditorTab | null {
    return state.tabs.find(tab => tab.id === state.activeTabId) ?? null;
}

export function addTab(state: TabsState, template: string = ""): TabsState {
    const newTab = createDefaultTab(template);
    return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id
    };
}

export function removeTab(state: TabsState, tabId: string): TabsState {
    const newTabs = state.tabs.filter(tab => tab.id !== tabId);
    
    if (newTabs.length === 0) {
        // Always keep at least one tab
        return {
            tabs: [createDefaultTab()],
            activeTabId: newTabs[0]?.id ?? createDefaultTab().id
        };
    }

    const newActiveId = state.activeTabId === tabId 
        ? newTabs[newTabs.length - 1]!.id
        : state.activeTabId;

    return {
        tabs: newTabs,
        activeTabId: newActiveId
    };
}

export function switchTab(state: TabsState, tabId: string): TabsState {
    if (state.tabs.find(tab => tab.id === tabId)) {
        return {
            ...state,
            activeTabId: tabId
        };
    }
    return state;
}

export function updateTabState(state: TabsState, tabId: string, editorState: EditorSessionState, template: string): TabsState {
    return {
        ...state,
        tabs: state.tabs.map(tab =>
            tab.id === tabId
                ? { ...tab, editorState, template }
                : tab
        )
    };
}
