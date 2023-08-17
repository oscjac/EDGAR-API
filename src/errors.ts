import {DOMParser} from "xmldom";

export class UserAgentError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "UserAgentError";
    }
}

export class SECError extends Error {
    readonly code: string;
    readonly key: string

    constructor(text: string) {
        const doc = new DOMParser().parseFromString(text, "text/xml");
        const message = doc.getElementsByTagName("Error")[0]
        super(message.textContent ?? "");
        this.name = "SECError";
        this.code = message.getElementsByTagName("Code")[0].textContent ?? "";
        this.key = message.getElementsByTagName("Key")[0].textContent ?? "";
    }
}

export class ForbiddenRequestError extends Error {
    constructor(html: string) {
        const parsed = html.replace("</P>", "</p>");
        const doc = new DOMParser().parseFromString(parsed, "text/html");
        const title = doc.getElementsByTagName("title")[0];
        const message = title.textContent ?? "";
        super(message);
        this.name = "ForbiddenError";
    }
}