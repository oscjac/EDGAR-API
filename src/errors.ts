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
        const error = doc.getElementsByTagName("Error")[0]
        const message = error.getElementsByTagName("Message")[0];
        const code = error.getElementsByTagName("Code")[0];
        const key = error.getElementsByTagName("Key")[0];
        const messageText = `${message.textContent}\nCode: ${code.textContent}\nKey: ${key.textContent}`
        super(messageText);
        this.name = "SECError";
        this.code = code.textContent ?? "";
        this.key = key.textContent ?? "";
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