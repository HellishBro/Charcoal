import {fromURLSafeB64, toURLSafeB64} from "$lib/utils";
import { getTemplateData } from "$lib/templatedata";

export function load({ url }) {
    const templateParam = new URL(url).searchParams.get("template");
    const templatesParam = new URL(url).searchParams.get("templates");

    if (templatesParam) {
        // Multiple templates format: templates=template1|template2|template3
        const templates = templatesParam.split('|').map(t => {
            const decoded = fromURLSafeB64(t);
            const result = getTemplateData(decoded);
            return result.status === "success" ? JSON.stringify(result.templateObject.toJSON()) : "";
        });
        return {
            initialTemplates: templates,
            templateData: templates[0] || ""
        };
    } else {
        // Single template format: template=xxxx
        const decoded = templateParam ? fromURLSafeB64(templateParam) : "";
        const result = getTemplateData(decoded);
        const templateJSON = result.status === "success" ? JSON.stringify(result.templateObject.toJSON()) : "";
        return {
            initialTemplates: templateParam ? [templateJSON] : [],
            templateData: templateJSON
        };
    }
}