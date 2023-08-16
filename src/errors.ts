export class UserAgentError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "UserAgentError";
    }
}

export class SECError extends Error {
    readonly code: string;
    readonly key: string
    constructor(doc: Document) {
        const message = doc.getElementsByTagName("Error")[0]
        super(message.textContent ?? "");
        this.name = "SECError";
        this.code = message.getElementsByTagName("Code")[0].textContent ?? "";
        this.key = message.getElementsByTagName("Key")[0].textContent ?? "";
    }
}
