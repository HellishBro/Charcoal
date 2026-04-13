import { Template } from "$lib/diamondfire";
import { getTemplateData } from "$lib/templatedata";

export type InspectorObject = {
    label: string;
    type: "StringField" | "DropDown" | "NumberField" | "MiniMessageField" | "ColorField" | "PercentageField" | "BooleanField" | "ItemField";
    multiline?: boolean;
    id: string;
    options?: { text: string; name: string }[];
    set: (data: any) => void;
    get: () => any;
    placeholder?: string;
};

export type EditorStatusType = "success" | "error";

export type EditorStatus = {
    type: EditorStatusType;
    message: string;
};

export type EditorUIState = {
    clickedChestIndex: number;
    editBlockIndex: number;
    inspectingItem: number;
    freezeInDepthView: boolean;
};

export type EditorRendererState = {
    cameraXTarget: number;
    cameraZoomTarget: number;
    selection: number[];
    startSelection: number | null;
    movingSelection: boolean;
};

export type EditorSessionState = {
    version: 1;
    templateInput: string;
    templateEncoded: string;
    status: EditorStatus;
    ui: EditorUIState;
    renderer: EditorRendererState;
};

export const EDITOR_STATE_VERSION = 1 as const;
export const EDITOR_SUCCESS_MESSAGE = "Code parsed successfully!";

export function createDefaultEditorUIState(): EditorUIState {
    return {
        clickedChestIndex: -1,
        editBlockIndex: -1,
        inspectingItem: -1,
        freezeInDepthView: false
    };
}

export function createDefaultEditorRendererState(): EditorRendererState {
    return {
        cameraXTarget: 0,
        cameraZoomTarget: 0,
        selection: [],
        startSelection: null,
        movingSelection: false
    };
}

function parseTemplateInput(templateInput: string): { templateObject: Template; status: EditorStatus; normalizedInput: string } {
    const normalizedInput = templateInput.trim();
    const response = getTemplateData(normalizedInput);

    if (response.status === "success") {
        return {
            templateObject: response.templateObject,
            status: {
                type: "success",
                message: EDITOR_SUCCESS_MESSAGE
            },
            normalizedInput
        };
    }

    return {
        templateObject: new Template([]),
        status: {
            type: "error",
            message: response.message
        },
        normalizedInput
    };
}

function decodeTemplateSafe(templateEncoded: string): Template | null {
    if (templateEncoded.trim().length === 0) {
        return new Template([]);
    }

    try {
        return Template.decodeTemplate(templateEncoded);
    } catch {
        return null;
    }
}

function normalizeStatus(status: Partial<EditorStatus> | undefined, fallback: EditorStatus): EditorStatus {
    const type: EditorStatusType = status?.type === "error" ? "error" : "success";
    const message = typeof status?.message === "string" && status.message.length > 0
        ? status.message
        : (type === "success" ? EDITOR_SUCCESS_MESSAGE : fallback.message);

    return {
        type,
        message
    };
}

function normalizeUIState(ui: Partial<EditorUIState> | undefined): EditorUIState {
    const defaults = createDefaultEditorUIState();

    return {
        clickedChestIndex: Number.isInteger(ui?.clickedChestIndex) ? (ui?.clickedChestIndex as number) : defaults.clickedChestIndex,
        editBlockIndex: Number.isInteger(ui?.editBlockIndex) ? (ui?.editBlockIndex as number) : defaults.editBlockIndex,
        inspectingItem: Number.isInteger(ui?.inspectingItem) ? (ui?.inspectingItem as number) : defaults.inspectingItem,
        freezeInDepthView: typeof ui?.freezeInDepthView === "boolean" ? ui.freezeInDepthView : defaults.freezeInDepthView
    };
}

function normalizeRendererState(renderer: Partial<EditorRendererState> | undefined): EditorRendererState {
    const defaults = createDefaultEditorRendererState();

    const selection = Array.isArray(renderer?.selection)
        ? renderer.selection.filter((index): index is number => Number.isInteger(index)).map(index => Math.trunc(index))
        : defaults.selection;

    return {
        cameraXTarget: typeof renderer?.cameraXTarget === "number" ? renderer.cameraXTarget : defaults.cameraXTarget,
        cameraZoomTarget: typeof renderer?.cameraZoomTarget === "number" ? renderer.cameraZoomTarget : defaults.cameraZoomTarget,
        selection: [...selection],
        startSelection: Number.isInteger(renderer?.startSelection) ? (renderer?.startSelection as number) : defaults.startSelection,
        movingSelection: typeof renderer?.movingSelection === "boolean" ? renderer.movingSelection : defaults.movingSelection
    };
}

export function cloneEditorSessionState(state: EditorSessionState): EditorSessionState {
    return {
        version: EDITOR_STATE_VERSION,
        templateInput: state.templateInput,
        templateEncoded: state.templateEncoded,
        status: {
            type: state.status.type,
            message: state.status.message
        },
        ui: {
            clickedChestIndex: state.ui.clickedChestIndex,
            editBlockIndex: state.ui.editBlockIndex,
            inspectingItem: state.ui.inspectingItem,
            freezeInDepthView: state.ui.freezeInDepthView
        },
        renderer: {
            cameraXTarget: state.renderer.cameraXTarget,
            cameraZoomTarget: state.renderer.cameraZoomTarget,
            selection: [...state.renderer.selection],
            startSelection: state.renderer.startSelection,
            movingSelection: state.renderer.movingSelection
        }
    };
}

export function createEditorSessionState(templateInput: string = ""): { state: EditorSessionState; templateObject: Template } {
    const { templateObject, status, normalizedInput } = parseTemplateInput(templateInput);

    const state: EditorSessionState = {
        version: EDITOR_STATE_VERSION,
        templateInput: normalizedInput,
        templateEncoded: templateObject.encodeTemplate(),
        status,
        ui: createDefaultEditorUIState(),
        renderer: createDefaultEditorRendererState()
    };

    return {
        state,
        templateObject
    };
}

export function hydrateEditorSessionState(incomingState: Partial<EditorSessionState> | null | undefined, fallbackTemplateJSON: string = ""): { state: EditorSessionState; templateObject: Template } {
    const fallback = createEditorSessionState(fallbackTemplateJSON);

    if (!incomingState) {
        // When no state, try to parse fallbackTemplateJSON as JSON
        if (fallbackTemplateJSON.trim()) {
            const parsed = getTemplateData(fallbackTemplateJSON);
            if (parsed.status === "success") {
                const templateObject = parsed.templateObject;
                return {
                    state: {
                        version: EDITOR_STATE_VERSION,
                        templateInput: JSON.stringify(templateObject.toJSON(), null, 4),
                        templateEncoded: templateObject.encodeTemplate(),
                        status: { type: "success", message: EDITOR_SUCCESS_MESSAGE },
                        ui: fallback.state.ui,
                        renderer: fallback.state.renderer
                    },
                    templateObject
                };
            }
        }
        return fallback;
    }

    const templateInput = typeof incomingState.templateInput === "string"
        ? incomingState.templateInput
        : fallback.state.templateInput;

    let templateObject = decodeTemplateSafe(typeof incomingState.templateEncoded === "string" ? incomingState.templateEncoded : "");

    if (templateObject === null) {
        const parsed = getTemplateData(templateInput.trim());
        if (parsed.status === "success") {
            templateObject = parsed.templateObject;
        } else {
            templateObject = fallback.templateObject;
        }
    }

    const state: EditorSessionState = {
        version: EDITOR_STATE_VERSION,
        templateInput,
        templateEncoded: templateObject.encodeTemplate(),
        status: normalizeStatus(incomingState.status, fallback.state.status),
        ui: normalizeUIState(incomingState.ui),
        renderer: normalizeRendererState(incomingState.renderer)
    };

    return {
        state,
        templateObject
    };
}

export function editorSessionStateSignature(state: EditorSessionState): string {
    return JSON.stringify({
        version: state.version,
        templateInput: state.templateInput,
        templateEncoded: state.templateEncoded,
        status: state.status,
        ui: state.ui,
        renderer: {
            cameraXTarget: state.renderer.cameraXTarget,
            cameraZoomTarget: state.renderer.cameraZoomTarget,
            selection: state.renderer.selection,
            startSelection: state.renderer.startSelection,
            movingSelection: state.renderer.movingSelection
        }
    });
}
