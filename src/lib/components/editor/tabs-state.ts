import type { EditorSessionState } from "./editor-state";
import { getTemplateData } from "../../templatedata";
import { firstLine, secondLine } from "../../df_reprs";
import { Codeblock } from "../../diamondfire";

export type EditorTab = {
    id: string;
    name: string;
    icon: string | null;
    showOnlyIcon: boolean;
    template: string; // JSON format
    editorState: EditorSessionState | null;
};

export type TabsState = {
    tabs: EditorTab[];
    activeTabId: string;
};

let tabCounter = 0;
const TAB_DEFAULT_NAME = "New Tab";

function generateTabId(): string {
    return `tab-${Date.now()}-${tabCounter++}`;
}

function parseTemplate(template: string) {
    const result = getTemplateData(template);
    return result.status === "success" ? result.templateObject : null;
}

function getTabName(templateJSON: string): string {
    const templateObject = parseTemplate(templateJSON);
    if (!templateObject || !templateObject.blocks.length) {
        return TAB_DEFAULT_NAME;
    }

    const firstBlock = templateObject.blocks[0];
    if (!(firstBlock instanceof Codeblock)) {
        return TAB_DEFAULT_NAME;
    }

    const action = secondLine(firstBlock);
    if (action && action.trim().length > 0) {
        return action;
    }

    // If there's a block but no action, return empty string (will show only icon)
    return "";
}

function getTabIcon(templateJSON: string): string | null {
    const templateObject = parseTemplate(templateJSON);
    if (!templateObject || !templateObject.blocks.length) {
        return null;
    }

    const firstBlock = templateObject.blocks[0];
    if (!(firstBlock instanceof Codeblock)) {
        return null;
    }

    return `/textures/${firstBlock.category}.png`;
}

export function createDefaultTab(templateJSON: string = ""): EditorTab {
    const name = getTabName(templateJSON);
    const icon = getTabIcon(templateJSON);
    return {
        id: generateTabId(),
        name,
        icon,
        showOnlyIcon: name === "" && icon !== null,
        template: templateJSON,
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
    const name = getTabName(template);
    const icon = getTabIcon(template);
    return {
        ...state,
        tabs: state.tabs.map(tab =>
            tab.id === tabId
                ? {
                    ...tab,
                    editorState,
                    template,
                    name,
                    icon,
                    showOnlyIcon: name === "" && icon !== null
                }
                : tab
        )
    };
}
