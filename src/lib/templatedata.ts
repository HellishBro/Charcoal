import {isJSON} from "./utils";
import {Template} from "./diamondfire";

export function getTemplateData(template: string): { status: "success"; templateObject: Template } | { status: "error"; message: string } {
    function success(templateObject: Template): { status: "success"; templateObject: Template } {
        return { status: "success", templateObject: templateObject };
    }
    function error(message: string): { status: "error"; message: string } {
        return { status: "error", message: message };
    }

    if (template.startsWith("'") && template.endsWith("'")) {
        template = template.substring(1, template.length - 1);
    }

    try {
        if (isJSON(template) && template.length != 0) {
            let json = JSON.parse(template);
            if ("code" in json) {
                return success(Template.decodeTemplate(json.code));
            } else {
                return success(Template.fromJSON(JSON.parse(template)));
            }
        } else if (template.matchAll(/[a-zA-Z0-9+/=]+/g)) {
            return success(Template.decodeTemplate(template));
        } else if (template.length == 0) {
            return success(new Template([]));
        } else {
            return error("Cannot parse template because template does not match any acceptable template format.");
        }
    } catch (e: any) {
        return error("Cannot parse template: " + e.toString());
    }
}